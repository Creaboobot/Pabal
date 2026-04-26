// @vitest-environment node
import { beforeEach, expect, it } from "vitest";
import { type Prisma, type RoleKey } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import {
  getTenantAuditLogViewer,
  sanitizeAuditMetadataForViewer,
} from "@/server/services/audit-log-viewer";
import { WorkspaceAdminAuthorizationError } from "@/server/services/admin-authorization";
import {
  createUser,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";
import {
  ensureDefaultTenantForUser,
  type TenantContext,
} from "@/server/services/tenancy";

describeWithDatabase("audit log viewer", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  async function createContext(email: string, name: string) {
    const user = await createUser(email, name);

    return ensureDefaultTenantForUser({
      actorUserId: user.id,
      email: user.email,
      name: user.name,
      userId: user.id,
    });
  }

  async function addMember(input: {
    context: TenantContext;
    email: string;
    name: string;
    roleKey: RoleKey;
  }) {
    const user = await createUser(input.email, input.name);
    const role = await prisma.role.findUniqueOrThrow({
      where: {
        key: input.roleKey,
      },
    });
    await prisma.membership.create({
      data: {
        roleId: role.id,
        tenantId: input.context.tenantId,
        userId: user.id,
      },
    });

    return {
      context: {
        roleKey: input.roleKey,
        tenantId: input.context.tenantId,
        tenantName: input.context.tenantName,
        userId: user.id,
      } satisfies TenantContext,
      user,
    };
  }

  async function createAuditLog(input: {
    action: string;
    actorUserId?: string | null;
    createdAt: Date;
    entityId?: string | null;
    entityType: string;
    metadata?: unknown;
    tenantId?: string | null;
  }) {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      createdAt: input.createdAt,
      entityId: input.entityId ?? null,
      entityType: input.entityType,
      tenantId: input.tenantId ?? null,
    };

    if (input.metadata !== undefined) {
      data.metadata = input.metadata as Prisma.InputJsonValue;
    }

    return prisma.auditLog.create({
      data,
    });
  }

  it("renders tenant-scoped audit rows and excludes cross-tenant and tenant-null logs", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const otherOwner = await createContext("other@example.com", "Other Owner");
    await prisma.auditLog.deleteMany();
    await createAuditLog({
      action: "workspace.updated",
      actorUserId: owner.userId,
      createdAt: new Date("2026-04-26T10:00:00.000Z"),
      entityId: owner.tenantId,
      entityType: "Tenant",
      metadata: {
        changedFields: ["name"],
      },
      tenantId: owner.tenantId,
    });
    await createAuditLog({
      action: "other.workspace.updated",
      actorUserId: otherOwner.userId,
      createdAt: new Date("2026-04-26T10:01:00.000Z"),
      entityId: otherOwner.tenantId,
      entityType: "Tenant",
      tenantId: otherOwner.tenantId,
    });
    await createAuditLog({
      action: "system.global",
      createdAt: new Date("2026-04-26T10:02:00.000Z"),
      entityType: "System",
      tenantId: null,
    });

    const viewer = await getTenantAuditLogViewer(owner);

    expect(viewer.events.map((event) => event.action)).toContain(
      "workspace.updated",
    );
    expect(viewer.events.map((event) => event.action)).not.toContain(
      "other.workspace.updated",
    );
    expect(viewer.events.map((event) => event.action)).not.toContain(
      "system.global",
    );
    expect(viewer.tenant.id).toBe(owner.tenantId);
  });

  it("rejects non-admin audit viewer access", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const member = await addMember({
      context: owner,
      email: "member@example.com",
      name: "Member User",
      roleKey: "MEMBER",
    });

    await expect(getTenantAuditLogViewer(member.context)).rejects.toBeInstanceOf(
      WorkspaceAdminAuthorizationError,
    );
  });

  it("filters by action, entity type, actor, and date range", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const admin = await addMember({
      context: owner,
      email: "admin@example.com",
      name: "Admin User",
      roleKey: "ADMIN",
    });
    await prisma.auditLog.deleteMany();
    await createAuditLog({
      action: "task.created",
      actorUserId: admin.user.id,
      createdAt: new Date("2026-04-24T10:00:00.000Z"),
      entityId: "task_1",
      entityType: "Task",
      tenantId: owner.tenantId,
    });
    await createAuditLog({
      action: "task.updated",
      actorUserId: owner.userId,
      createdAt: new Date("2026-04-25T10:00:00.000Z"),
      entityId: "task_2",
      entityType: "Task",
      tenantId: owner.tenantId,
    });
    await createAuditLog({
      action: "note.created",
      actorUserId: admin.user.id,
      createdAt: new Date("2026-04-27T10:00:00.000Z"),
      entityId: "note_1",
      entityType: "Note",
      tenantId: owner.tenantId,
    });

    const viewer = await getTenantAuditLogViewer(owner, {
      action: "task.created",
      actorUserId: admin.user.id,
      entityType: "Task",
      from: "2026-04-24",
      to: "2026-04-26",
    });

    expect(viewer.events).toHaveLength(1);
    expect(viewer.events[0]).toMatchObject({
      action: "task.created",
      entityType: "Task",
    });
    expect(viewer.events[0]?.actor.id).toBe(admin.user.id);
  });

  it("paginates by tenant-scoped cursor and rejects cross-tenant cursors safely", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const otherOwner = await createContext("other@example.com", "Other Owner");
    await prisma.auditLog.deleteMany();
    await createAuditLog({
      action: "first",
      createdAt: new Date("2026-04-26T10:02:00.000Z"),
      entityType: "Task",
      tenantId: owner.tenantId,
    });
    await createAuditLog({
      action: "second",
      createdAt: new Date("2026-04-26T10:01:00.000Z"),
      entityType: "Task",
      tenantId: owner.tenantId,
    });
    await createAuditLog({
      action: "third",
      createdAt: new Date("2026-04-26T10:00:00.000Z"),
      entityType: "Task",
      tenantId: owner.tenantId,
    });
    const otherLog = await createAuditLog({
      action: "other",
      createdAt: new Date("2026-04-26T10:03:00.000Z"),
      entityType: "Task",
      tenantId: otherOwner.tenantId,
    });

    const firstPage = await getTenantAuditLogViewer(owner, {
      limit: "2",
    });
    const secondPage = await getTenantAuditLogViewer(owner, {
      cursor: firstPage.nextCursor ?? undefined,
      limit: "2",
    });
    const crossTenantCursor = await getTenantAuditLogViewer(owner, {
      cursor: otherLog.id,
      limit: "2",
    });

    expect(firstPage.events.map((event) => event.action)).toEqual([
      "first",
      "second",
    ]);
    expect(firstPage.nextCursor).toBeTruthy();
    expect(secondPage.events.map((event) => event.action)).toEqual(["third"]);
    expect(crossTenantCursor.events).toHaveLength(0);
  });

  it("sanitizes metadata before display and does not mutate or audit the read", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    await prisma.auditLog.deleteMany();
    await createAuditLog({
      action: "note.created",
      actorUserId: owner.userId,
      createdAt: new Date("2026-04-26T10:00:00.000Z"),
      entityId: "note_1",
      entityType: "Note",
      metadata: {
        noteBody: "Sensitive note body should not be displayed",
        providerPayload: {
          raw: "provider response",
        },
        safeField: "Visible",
        token: "Bearer secret",
      },
      tenantId: owner.tenantId,
    });
    const before = await prisma.auditLog.count({
      where: {
        tenantId: owner.tenantId,
      },
    });

    const viewer = await getTenantAuditLogViewer(owner);
    const after = await prisma.auditLog.count({
      where: {
        tenantId: owner.tenantId,
      },
    });

    expect(after).toBe(before);
    expect(JSON.stringify(viewer.events[0]?.metadataPreview)).not.toContain(
      "Sensitive note body",
    );
    expect(viewer.events[0]?.metadataPreview).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "noteBody",
          redacted: true,
        }),
        expect.objectContaining({
          key: "safeField",
          value: "Visible",
        }),
      ]),
    );
    expect(sanitizeAuditMetadataForViewer(null)).toEqual([]);
  });
});
