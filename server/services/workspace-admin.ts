import {
  Prisma,
  type MembershipStatus,
  type PrismaClient,
  type RoleKey,
} from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { isFoundationRoleKey } from "@/server/services/roles";
import {
  assertCanManageMembership,
  isWorkspaceAdminRole,
  requireWorkspaceAdmin,
  requireWorkspaceOwner,
} from "@/server/services/admin-authorization";
import { writeAuditLog } from "@/server/services/audit-log";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export class WorkspaceAdminValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceAdminValidationError";
  }
}

export class WorkspaceMemberNotFoundError extends Error {
  constructor(membershipId: string) {
    super(`Membership ${membershipId} was not found in this workspace`);
    this.name = "WorkspaceMemberNotFoundError";
  }
}

export class LastWorkspaceOwnerError extends Error {
  constructor() {
    super("The last active workspace owner cannot be demoted or deactivated");
    this.name = "LastWorkspaceOwnerError";
  }
}

export type WorkspaceMemberSummary = {
  createdAt: Date;
  email: string | null;
  id: string;
  name: string | null;
  roleKey: RoleKey;
  status: MembershipStatus;
  updatedAt: Date;
  userId: string;
};

export type WorkspaceAdminProfile = {
  activeOwnerCount: number;
  canManageMembers: boolean;
  canUpdateWorkspace: boolean;
  currentUserRole: RoleKey;
  members: WorkspaceMemberSummary[];
  tenant: {
    createdAt: Date;
    id: string;
    name: string;
    slug: string;
    updatedAt: Date;
  };
};

export type WorkspaceSettingsProfile = Omit<WorkspaceAdminProfile, "members">;

const WORKSPACE_NAME_MAX_LENGTH = 120;
type WorkspaceAdminClient = PrismaClient | Prisma.TransactionClient;
type MembershipRecord = Prisma.MembershipGetPayload<{
  include: {
    role: true;
    user: {
      select: {
        email: true;
        id: true;
        name: true;
      };
    };
  };
}>;

function normalizeWorkspaceName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");

  if (name.length < 2) {
    throw new WorkspaceAdminValidationError(
      "Workspace name must be at least 2 characters.",
    );
  }

  if (name.length > WORKSPACE_NAME_MAX_LENGTH) {
    throw new WorkspaceAdminValidationError(
      `Workspace name must be ${WORKSPACE_NAME_MAX_LENGTH} characters or fewer.`,
    );
  }

  return name;
}

function toMemberSummary(membership: MembershipRecord): WorkspaceMemberSummary {
  return {
    createdAt: membership.createdAt,
    email: membership.user.email,
    id: membership.id,
    name: membership.user.name,
    roleKey: membership.role.key,
    status: membership.status,
    updatedAt: membership.updatedAt,
    userId: membership.userId,
  };
}

async function listMembershipsForTenant(
  tenantId: string,
  db: WorkspaceAdminClient = prisma,
) {
  return db.membership.findMany({
    where: {
      tenantId,
    },
    include: {
      role: true,
      user: {
        select: {
          email: true,
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        status: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
}

async function countActiveOwners(
  tenantId: string,
  db: WorkspaceAdminClient = prisma,
) {
  return db.membership.count({
    where: {
      role: {
        key: "OWNER",
      },
      status: "ACTIVE",
      tenantId,
    },
  });
}

async function getTenantOrThrow(
  context: TenantContext,
  db: WorkspaceAdminClient = prisma,
) {
  const tenant = await db.tenant.findUnique({
    where: {
      id: context.tenantId,
    },
    select: {
      createdAt: true,
      id: true,
      name: true,
      slug: true,
      updatedAt: true,
    },
  });

  if (!tenant) {
    throw new WorkspaceAdminValidationError("Workspace was not found.");
  }

  return tenant;
}

async function getMembershipOrThrow(
  tenantId: string,
  membershipId: string,
  db: Prisma.TransactionClient,
) {
  const membership = await db.membership.findFirst({
    where: {
      id: membershipId,
      tenantId,
    },
    include: {
      role: true,
    },
  });

  if (!membership) {
    throw new WorkspaceMemberNotFoundError(membershipId);
  }

  return membership;
}

async function assertNotLastActiveOwner(input: {
  db: Prisma.TransactionClient;
  membershipId: string;
  nextRole?: RoleKey;
  nextStatus?: MembershipStatus;
  tenantId: string;
}) {
  const membership = await getMembershipOrThrow(
    input.tenantId,
    input.membershipId,
    input.db,
  );
  const remainsOwner = input.nextRole ? input.nextRole === "OWNER" : true;
  const remainsActive = input.nextStatus
    ? input.nextStatus === "ACTIVE"
    : membership.status === "ACTIVE";

  if (
    membership.role.key !== "OWNER" ||
    membership.status !== "ACTIVE" ||
    (remainsOwner && remainsActive)
  ) {
    return membership;
  }

  const activeOwnerCount = await countActiveOwners(input.tenantId, input.db);

  if (activeOwnerCount <= 1) {
    throw new LastWorkspaceOwnerError();
  }

  return membership;
}

export async function getTenantWorkspaceSettingsProfile(
  context: TenantContext,
): Promise<WorkspaceSettingsProfile> {
  const access = await requireTenantAccess(context);

  const [tenant, activeOwnerCount] = await Promise.all([
    getTenantOrThrow(context),
    countActiveOwners(context.tenantId),
  ]);

  return {
    activeOwnerCount,
    canManageMembers: access.roleKey === "OWNER",
    canUpdateWorkspace: isWorkspaceAdminRole(access.roleKey),
    currentUserRole: access.roleKey,
    tenant,
  };
}

export async function getTenantWorkspaceAdminProfile(
  context: TenantContext,
): Promise<WorkspaceAdminProfile> {
  const access = await requireWorkspaceAdmin(context);

  const [tenant, members, activeOwnerCount] = await Promise.all([
    getTenantOrThrow(access),
    listMembershipsForTenant(access.tenantId),
    countActiveOwners(access.tenantId),
  ]);

  return {
    activeOwnerCount,
    canManageMembers: access.roleKey === "OWNER",
    canUpdateWorkspace: isWorkspaceAdminRole(access.roleKey),
    currentUserRole: access.roleKey,
    members: members.map(toMemberSummary),
    tenant,
  };
}

export async function updateTenantWorkspaceName(
  context: TenantContext,
  input: { name: string },
) {
  await requireWorkspaceAdmin(context);
  const name = normalizeWorkspaceName(input.name);

  return prisma.$transaction(async (tx) => {
    const existing = await getTenantOrThrow(context, tx);

    if (existing.name === name) {
      return existing;
    }

    const tenant = await tx.tenant.update({
      where: {
        id: context.tenantId,
      },
      data: {
        name,
      },
      select: {
        createdAt: true,
        id: true,
        name: true,
        slug: true,
        updatedAt: true,
      },
    });

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "workspace.updated",
        entityType: "Tenant",
        entityId: context.tenantId,
        metadata: {
          changedFields: ["name"],
        },
      },
      tx,
    );

    return tenant;
  });
}

export async function updateTenantMembershipRole(
  context: TenantContext,
  membershipId: string,
  nextRoleKey: RoleKey,
) {
  const access = await requireWorkspaceOwner(context);

  if (!isFoundationRoleKey(nextRoleKey)) {
    throw new WorkspaceAdminValidationError("Role is not supported.");
  }

  return prisma.$transaction(
    async (tx) => {
      const membership = await assertNotLastActiveOwner({
        db: tx,
        membershipId,
        nextRole: nextRoleKey,
        tenantId: context.tenantId,
      });

      assertCanManageMembership({
        actorRole: access.roleKey,
        nextRole: nextRoleKey,
        targetRole: membership.role.key,
      });

      if (membership.role.key === nextRoleKey) {
        return membership;
      }

      const role = await tx.role.findUniqueOrThrow({
        where: {
          key: nextRoleKey,
        },
      });
      const updated = await tx.membership.update({
        where: {
          id: membership.id,
        },
        data: {
          roleId: role.id,
        },
        include: {
          role: true,
        },
      });

      await writeAuditLog(
        {
          tenantId: context.tenantId,
          actorUserId: context.userId,
          action: "membership.role_updated",
          entityType: "Membership",
          entityId: updated.id,
          metadata: {
            membershipId: updated.id,
            newRole: nextRoleKey,
            oldRole: membership.role.key,
          },
        },
        tx,
      );

      return updated;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function deactivateTenantMembership(
  context: TenantContext,
  membershipId: string,
) {
  const access = await requireWorkspaceOwner(context);

  return prisma.$transaction(
    async (tx) => {
      const membership = await assertNotLastActiveOwner({
        db: tx,
        membershipId,
        nextStatus: "INACTIVE",
        tenantId: context.tenantId,
      });

      assertCanManageMembership({
        actorRole: access.roleKey,
        targetRole: membership.role.key,
      });

      if (membership.status === "INACTIVE") {
        return membership;
      }

      const updated = await tx.membership.update({
        where: {
          id: membership.id,
        },
        data: {
          status: "INACTIVE",
        },
      });

      await writeAuditLog(
        {
          tenantId: context.tenantId,
          actorUserId: context.userId,
          action: "membership.deactivated",
          entityType: "Membership",
          entityId: updated.id,
          metadata: {
            membershipId: updated.id,
            membershipStatus: updated.status,
          },
        },
        tx,
      );

      return updated;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function reactivateTenantMembership(
  context: TenantContext,
  membershipId: string,
) {
  const access = await requireWorkspaceOwner(context);

  return prisma.$transaction(async (tx) => {
    const membership = await getMembershipOrThrow(
      context.tenantId,
      membershipId,
      tx,
    );

    assertCanManageMembership({
      actorRole: access.roleKey,
      targetRole: membership.role.key,
    });

    if (membership.status === "ACTIVE") {
      return membership;
    }

    const updated = await tx.membership.update({
      where: {
        id: membership.id,
      },
      data: {
        status: "ACTIVE",
      },
    });

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "membership.reactivated",
        entityType: "Membership",
        entityId: updated.id,
        metadata: {
          membershipId: updated.id,
          membershipStatus: updated.status,
        },
      },
      tx,
    );

    return updated;
  });
}
