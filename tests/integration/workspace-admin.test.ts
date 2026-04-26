// @vitest-environment node
import { beforeEach, expect, it } from "vitest";
import { type MembershipStatus, type RoleKey } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import {
  LastWorkspaceOwnerError,
  WorkspaceMemberNotFoundError,
  deactivateTenantMembership,
  getTenantWorkspaceAdminProfile,
  reactivateTenantMembership,
  updateTenantMembershipRole,
  updateTenantWorkspaceName,
} from "@/server/services/workspace-admin";
import {
  WorkspaceAdminAuthorizationError,
  WorkspaceOwnerAuthorizationError,
} from "@/server/services/admin-authorization";
import {
  createUser,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";
import {
  ensureDefaultTenantForUser,
  type TenantContext,
} from "@/server/services/tenancy";

describeWithDatabase("workspace admin foundation", () => {
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
    status?: MembershipStatus;
  }) {
    const user = await createUser(input.email, input.name);
    const role = await prisma.role.findUniqueOrThrow({
      where: {
        key: input.roleKey,
      },
    });
    const membership = await prisma.membership.create({
      data: {
        roleId: role.id,
        status: input.status ?? "ACTIVE",
        tenantId: input.context.tenantId,
        userId: user.id,
      },
      include: {
        role: true,
      },
    });

    return {
      context: {
        roleKey: input.roleKey,
        tenantId: input.context.tenantId,
        tenantName: input.context.tenantName,
        userId: user.id,
      } satisfies TenantContext,
      membership,
      user,
    };
  }

  it("renders a tenant-scoped member list", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const otherOwner = await createContext("other@example.com", "Other User");
    await addMember({
      context: owner,
      email: "member@example.com",
      name: "Member User",
      roleKey: "MEMBER",
    });

    const profile = await getTenantWorkspaceAdminProfile(owner);

    expect(profile.members).toHaveLength(2);
    expect(profile.members.map((member) => member.email)).toContain(
      "member@example.com",
    );
    expect(profile.members.map((member) => member.email)).not.toContain(
      "other@example.com",
    );
    expect(profile.tenant.id).toBe(owner.tenantId);
    expect(otherOwner.tenantId).not.toBe(owner.tenantId);
  });

  it("updates workspace name for an admin role and writes a safe audit log", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const admin = await addMember({
      context: owner,
      email: "admin@example.com",
      name: "Admin User",
      roleKey: "ADMIN",
    });

    await updateTenantWorkspaceName(admin.context, {
      name: "Client Growth Workspace",
    });

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: {
        id: owner.tenantId,
      },
    });
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: "workspace.updated",
        tenantId: owner.tenantId,
      },
    });

    expect(tenant.name).toBe("Client Growth Workspace");
    expect(JSON.stringify(audit.metadata)).toContain("changedFields");
    expect(JSON.stringify(audit.metadata)).not.toContain(
      "Client Growth Workspace",
    );
  });

  it("rejects workspace update from a non-admin member", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const member = await addMember({
      context: owner,
      email: "member@example.com",
      name: "Member User",
      roleKey: "MEMBER",
    });

    await expect(
      updateTenantWorkspaceName(member.context, {
        name: "Unauthorized Name",
      }),
    ).rejects.toBeInstanceOf(WorkspaceAdminAuthorizationError);
  });

  it("rejects member-list access from a non-admin member", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const member = await addMember({
      context: owner,
      email: "member@example.com",
      name: "Member User",
      roleKey: "MEMBER",
    });

    await expect(
      getTenantWorkspaceAdminProfile(member.context),
    ).rejects.toBeInstanceOf(WorkspaceAdminAuthorizationError);
  });

  it("updates a member role when the actor is an owner", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const member = await addMember({
      context: owner,
      email: "member@example.com",
      name: "Member User",
      roleKey: "MEMBER",
    });

    await updateTenantMembershipRole(owner, member.membership.id, "ADMIN");

    const updated = await prisma.membership.findUniqueOrThrow({
      where: {
        id: member.membership.id,
      },
      include: {
        role: true,
      },
    });

    expect(updated.role.key).toBe("ADMIN");
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: "membership.role_updated",
        entityId: member.membership.id,
        tenantId: owner.tenantId,
      },
    });
    const serialized = JSON.stringify(audit.metadata);

    expect(serialized).toContain("oldRole");
    expect(serialized).toContain("newRole");
    expect(serialized).not.toContain("member@example.com");
  });

  it("rejects role updates from non-owner members", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const admin = await addMember({
      context: owner,
      email: "admin@example.com",
      name: "Admin User",
      roleKey: "ADMIN",
    });
    const member = await addMember({
      context: owner,
      email: "member@example.com",
      name: "Member User",
      roleKey: "MEMBER",
    });

    await expect(
      updateTenantMembershipRole(admin.context, member.membership.id, "VIEWER"),
    ).rejects.toBeInstanceOf(WorkspaceOwnerAuthorizationError);
  });

  it("rejects cross-tenant membership mutations", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const otherOwner = await createContext("other@example.com", "Other User");

    const otherMembership = await prisma.membership.findFirstOrThrow({
      where: {
        tenantId: otherOwner.tenantId,
        userId: otherOwner.userId,
      },
    });

    await expect(
      updateTenantMembershipRole(owner, otherMembership.id, "MEMBER"),
    ).rejects.toBeInstanceOf(WorkspaceMemberNotFoundError);
  });

  it("prevents demoting the last active owner", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const ownerMembership = await prisma.membership.findFirstOrThrow({
      where: {
        tenantId: owner.tenantId,
        userId: owner.userId,
      },
    });

    await expect(
      updateTenantMembershipRole(owner, ownerMembership.id, "ADMIN"),
    ).rejects.toBeInstanceOf(LastWorkspaceOwnerError);
  });

  it("prevents deactivating the last active owner", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const ownerMembership = await prisma.membership.findFirstOrThrow({
      where: {
        tenantId: owner.tenantId,
        userId: owner.userId,
      },
    });

    await expect(
      deactivateTenantMembership(owner, ownerMembership.id),
    ).rejects.toBeInstanceOf(LastWorkspaceOwnerError);
  });

  it("deactivates and reactivates memberships without hard deletion", async () => {
    const owner = await createContext("owner@example.com", "Owner User");
    const member = await addMember({
      context: owner,
      email: "member@example.com",
      name: "Member User",
      roleKey: "MEMBER",
    });

    await deactivateTenantMembership(owner, member.membership.id);

    const inactive = await prisma.membership.findUniqueOrThrow({
      where: {
        id: member.membership.id,
      },
    });

    expect(inactive.status).toBe("INACTIVE");

    await reactivateTenantMembership(owner, member.membership.id);

    const active = await prisma.membership.findUniqueOrThrow({
      where: {
        id: member.membership.id,
      },
    });

    expect(active.status).toBe("ACTIVE");
  });
});
