import type { RoleKey } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      activeTenantId: string | null;
      roleKey: RoleKey | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    activeTenantId?: string | null;
    roleKey?: RoleKey | null;
  }
}
