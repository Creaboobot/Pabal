// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/services/audit-log";
import {
  ensureDefaultTenantForUser,
  requireTenantAccess,
  TenantAccessDeniedError,
} from "@/server/services/tenancy";
import {
  createUser,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

describeWithDatabase("tenant foundation", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates exactly one default tenant and owner membership for a new user", async () => {
    const user = await createUser("owner@example.com", "Owner User");

    const context = await ensureDefaultTenantForUser({
      userId: user.id,
      email: user.email,
      name: user.name,
      actorUserId: user.id,
    });

    const tenants = await prisma.tenant.findMany({
      where: {
        defaultForUserId: user.id,
      },
    });
    const memberships = await prisma.membership.findMany({
      where: {
        userId: user.id,
        tenantId: context.tenantId,
      },
      include: {
        role: true,
      },
    });

    expect(tenants).toHaveLength(1);
    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.role.key).toBe("OWNER");
  });

  it("does not create duplicate default tenants on repeated calls", async () => {
    const user = await createUser("repeat@example.com", "Repeat User");

    const first = await ensureDefaultTenantForUser({
      userId: user.id,
      email: user.email,
      name: user.name,
      actorUserId: user.id,
    });
    const second = await ensureDefaultTenantForUser({
      userId: user.id,
      email: user.email,
      name: user.name,
      actorUserId: user.id,
    });

    const tenantCount = await prisma.tenant.count({
      where: {
        defaultForUserId: user.id,
      },
    });
    const membershipCount = await prisma.membership.count({
      where: {
        userId: user.id,
        tenantId: first.tenantId,
      },
    });
    const tenantCreatedAuditCount = await prisma.auditLog.count({
      where: {
        action: "tenant.created",
        tenantId: first.tenantId,
      },
    });

    expect(second.tenantId).toBe(first.tenantId);
    expect(tenantCount).toBe(1);
    expect(membershipCount).toBe(1);
    expect(tenantCreatedAuditCount).toBe(1);
  });

  it("allows access for active tenant members", async () => {
    const user = await createUser("member@example.com", "Member User");
    const context = await ensureDefaultTenantForUser({
      userId: user.id,
      email: user.email,
      name: user.name,
      actorUserId: user.id,
    });

    const access = await requireTenantAccess({
      userId: user.id,
      tenantId: context.tenantId,
    });

    expect(access.tenantId).toBe(context.tenantId);
    expect(access.roleKey).toBe("OWNER");
  });

  it("denies cross-tenant access", async () => {
    const firstUser = await createUser("first@example.com", "First User");
    const secondUser = await createUser("second@example.com", "Second User");

    await ensureDefaultTenantForUser({
      userId: firstUser.id,
      email: firstUser.email,
      name: firstUser.name,
      actorUserId: firstUser.id,
    });
    const secondContext = await ensureDefaultTenantForUser({
      userId: secondUser.id,
      email: secondUser.email,
      name: secondUser.name,
      actorUserId: secondUser.id,
    });

    await expect(
      requireTenantAccess({
        userId: firstUser.id,
        tenantId: secondContext.tenantId,
      }),
    ).rejects.toBeInstanceOf(TenantAccessDeniedError);
  });

  it("does not persist secrets in audit metadata", async () => {
    const user = await createUser("audit@example.com", "Audit User");
    const context = await ensureDefaultTenantForUser({
      userId: user.id,
      email: user.email,
      name: user.name,
      actorUserId: user.id,
    });

    const log = await writeAuditLog({
      tenantId: context.tenantId,
      actorUserId: user.id,
      action: "security.test",
      entityType: "AuditLog",
      metadata: {
        allowed: "visible",
        databaseUrl: "postgresql://user:password@localhost:5432/pobal",
        authToken: "sensitive-token-value",
        nested: {
          note: "safe",
          sessionSecret: "do-not-store",
        },
      },
    });

    const persisted = await prisma.auditLog.findUniqueOrThrow({
      where: {
        id: log.id,
      },
    });
    const serialized = JSON.stringify(persisted.metadata);

    expect(serialized).toContain("visible");
    expect(serialized).toContain("safe");
    expect(serialized).not.toContain("postgresql://");
    expect(serialized).not.toContain("sensitive-token-value");
    expect(serialized).not.toContain("do-not-store");
  });
});
