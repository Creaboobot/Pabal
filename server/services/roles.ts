import { type Prisma, type PrismaClient, type RoleKey } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type RoleClient = PrismaClient | Prisma.TransactionClient;

export const FOUNDATION_ROLE_DEFINITIONS: ReadonlyArray<{
  key: RoleKey;
  name: string;
  description: string;
}> = [
  {
    key: "OWNER",
    name: "Owner",
    description: "Workspace owner with full foundation administration rights.",
  },
  {
    key: "ADMIN",
    name: "Admin",
    description: "Workspace administrator for future team management.",
  },
  {
    key: "MEMBER",
    name: "Member",
    description: "Standard workspace member.",
  },
  {
    key: "VIEWER",
    name: "Viewer",
    description: "Read-only workspace member for future review workflows.",
  },
];

export const FOUNDATION_ROLE_KEYS = FOUNDATION_ROLE_DEFINITIONS.map(
  (role) => role.key,
);

export function isFoundationRoleKey(value: unknown): value is RoleKey {
  return (
    typeof value === "string" &&
    FOUNDATION_ROLE_KEYS.includes(value as RoleKey)
  );
}

export async function ensureFoundationRoles(db: RoleClient = prisma) {
  return Promise.all(
    FOUNDATION_ROLE_DEFINITIONS.map((role) =>
      db.role.upsert({
        where: { key: role.key },
        create: role,
        update: {
          name: role.name,
          description: role.description,
        },
      }),
    ),
  );
}
