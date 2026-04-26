import { type RoleKey } from "@prisma/client";

import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

const WORKSPACE_ADMIN_ROLES = new Set<RoleKey>(["OWNER", "ADMIN"]);

export class WorkspaceAdminAuthorizationError extends Error {
  constructor(message = "Workspace admin access is required") {
    super(message);
    this.name = "WorkspaceAdminAuthorizationError";
  }
}

export class WorkspaceOwnerAuthorizationError extends Error {
  constructor(message = "Workspace owner access is required") {
    super(message);
    this.name = "WorkspaceOwnerAuthorizationError";
  }
}

export function isWorkspaceAdminRole(roleKey: RoleKey) {
  return WORKSPACE_ADMIN_ROLES.has(roleKey);
}

export async function requireWorkspaceAdmin(context: TenantContext) {
  const access = await requireTenantAccess(context);

  if (!isWorkspaceAdminRole(access.roleKey)) {
    throw new WorkspaceAdminAuthorizationError();
  }

  return access;
}

export async function requireWorkspaceOwner(context: TenantContext) {
  const access = await requireTenantAccess(context);

  if (access.roleKey !== "OWNER") {
    throw new WorkspaceOwnerAuthorizationError();
  }

  return access;
}

export function assertCanManageMembership(input: {
  actorRole: RoleKey;
  nextRole?: RoleKey;
  targetRole?: RoleKey;
}) {
  if (input.actorRole !== "OWNER") {
    throw new WorkspaceOwnerAuthorizationError(
      "Only workspace owners can change member roles or status in this foundation release",
    );
  }

  if (input.targetRole === "OWNER" || input.nextRole === "OWNER") {
    return;
  }
}
