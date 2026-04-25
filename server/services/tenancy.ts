import { Prisma, type PrismaClient, type RoleKey } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import {
  findActiveMembershipForUser,
  findFirstActiveMembershipForUser,
} from "@/server/repositories/memberships";
import { writeAuditLog } from "@/server/services/audit-log";
import { ensureFoundationRoles } from "@/server/services/roles";

const TRANSACTION_RETRY_LIMIT = 2;

export class TenantAccessDeniedError extends Error {
  constructor() {
    super("Tenant access denied");
    this.name = "TenantAccessDeniedError";
  }
}

export class UserTenantRequiredError extends Error {
  constructor(userId: string) {
    super(`User ${userId} does not have an active tenant membership`);
    this.name = "UserTenantRequiredError";
  }
}

export type TenantContext = {
  userId: string;
  tenantId: string;
  roleKey: RoleKey;
  tenantName: string;
};

export type EnsureDefaultTenantInput = {
  userId: string;
  email?: string | null | undefined;
  name?: string | null | undefined;
  actorUserId?: string | null | undefined;
};

function isRetryablePrismaError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2002" || error.code === "P2034")
  );
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : "workspace";
}

function displayName(input: EnsureDefaultTenantInput) {
  return input.name?.trim() || input.email?.split("@")[0] || "My";
}

export function buildDefaultTenantSlug(input: EnsureDefaultTenantInput) {
  const base = slugify(displayName(input));
  const suffix = slugify(input.userId).slice(0, 32);

  return `${base}-${suffix}`.slice(0, 96);
}

export async function getDefaultTenantContextForUser(userId: string) {
  const membership = await findFirstActiveMembershipForUser(userId);

  if (!membership) {
    return null;
  }

  return {
    userId,
    tenantId: membership.tenantId,
    roleKey: membership.role.key,
    tenantName: membership.tenant.name,
  } satisfies TenantContext;
}

export async function requireTenantAccess(input: {
  tenantId: string;
  userId: string;
}) {
  const membership = await findActiveMembershipForUser(input);

  if (!membership) {
    throw new TenantAccessDeniedError();
  }

  return {
    userId: input.userId,
    tenantId: membership.tenantId,
    roleKey: membership.role.key,
    tenantName: membership.tenant.name,
  } satisfies TenantContext;
}

export async function ensureDefaultTenantForUser(
  input: EnsureDefaultTenantInput,
  client: PrismaClient = prisma,
) {
  for (let attempt = 0; attempt <= TRANSACTION_RETRY_LIMIT; attempt += 1) {
    try {
      return await client.$transaction(
        async (tx) => {
          await ensureFoundationRoles(tx);

          const user = await tx.user.findUnique({
            where: { id: input.userId },
            select: {
              id: true,
              email: true,
              name: true,
            },
          });

          if (!user) {
            throw new Error("Cannot create a default tenant for an unknown user");
          }

          const ownerRole = await tx.role.findUniqueOrThrow({
            where: { key: "OWNER" },
          });

          const tenantBefore = await tx.tenant.findUnique({
            where: { defaultForUserId: user.id },
          });

          const tenant =
            tenantBefore ??
            (await tx.tenant.create({
              data: {
                name: `${displayName({
                  userId: user.id,
                  email: input.email ?? user.email,
                  name: input.name ?? user.name,
                })}'s Workspace`,
                slug: buildDefaultTenantSlug({
                  userId: user.id,
                  email: input.email ?? user.email,
                  name: input.name ?? user.name,
                }),
                defaultForUserId: user.id,
              },
            }));

          const membershipBefore = await tx.membership.findUnique({
            where: {
              tenantId_userId: {
                tenantId: tenant.id,
                userId: user.id,
              },
            },
          });

          if (!tenantBefore) {
            await writeAuditLog(
              {
                tenantId: tenant.id,
                actorUserId: input.actorUserId ?? user.id,
                action: "tenant.created",
                entityType: "Tenant",
                entityId: tenant.id,
                metadata: {
                  source: "default-auth-onboarding",
                },
              },
              tx,
            );
          }

          if (!membershipBefore) {
            await tx.membership.create({
              data: {
                tenantId: tenant.id,
                userId: user.id,
                roleId: ownerRole.id,
              },
            });

            await writeAuditLog(
              {
                tenantId: tenant.id,
                actorUserId: input.actorUserId ?? user.id,
                action: "membership.created",
                entityType: "Membership",
                entityId: `${tenant.id}:${user.id}`,
                metadata: {
                  roleKey: ownerRole.key,
                  source: "default-auth-onboarding",
                },
              },
              tx,
            );
          }

          const membership = await tx.membership.findUniqueOrThrow({
            where: {
              tenantId_userId: {
                tenantId: tenant.id,
                userId: user.id,
              },
            },
            include: {
              role: true,
              tenant: true,
            },
          });

          return {
            userId: user.id,
            tenantId: membership.tenantId,
            roleKey: membership.role.key,
            tenantName: membership.tenant.name,
          } satisfies TenantContext;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      if (attempt < TRANSACTION_RETRY_LIMIT && isRetryablePrismaError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to ensure a default tenant for the user");
}
