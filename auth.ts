import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

import { authConfig } from "@/auth.config";
import { prisma } from "@/server/db/prisma";
import {
  authorizeDevelopmentUser,
  isDevelopmentAuthEnabled,
} from "@/server/services/development-auth";
import { isFoundationRoleKey } from "@/server/services/roles";
import {
  ensureDefaultTenantForUser,
  getDefaultTenantContextForUser,
} from "@/server/services/tenancy";

function getMicrosoftEntraIssuer(source: NodeJS.ProcessEnv = process.env) {
  if (source.AUTH_MICROSOFT_ENTRA_ID_ISSUER) {
    return source.AUTH_MICROSOFT_ENTRA_ID_ISSUER;
  }

  if (source.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID) {
    return `https://login.microsoftonline.com/${source.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`;
  }

  return undefined;
}

export function hasMicrosoftEntraProviderConfig(
  source: NodeJS.ProcessEnv = process.env,
) {
  return Boolean(
    source.AUTH_MICROSOFT_ENTRA_ID_ID &&
      source.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
      getMicrosoftEntraIssuer(source),
  );
}

const providers: NextAuthConfig["providers"] = [];

if (isDevelopmentAuthEnabled()) {
  providers.push(
    Credentials({
      id: "development",
      name: "Development",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },
        name: {
          label: "Name",
          type: "text",
          placeholder: "Your name",
        },
      },
      authorize: authorizeDevelopmentUser,
    }),
  );
}

if (hasMicrosoftEntraProviderConfig()) {
  const clientId = process.env.AUTH_MICROSOFT_ENTRA_ID_ID;
  const clientSecret = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET;
  const issuer = getMicrosoftEntraIssuer();

  if (!clientId || !clientSecret || !issuer) {
    throw new Error("Microsoft Entra provider configuration is incomplete.");
  }

  providers.push(
    MicrosoftEntraID({
      clientId,
      clientSecret,
      issuer,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;

      if (user?.id) {
        await ensureDefaultTenantForUser({
          userId: user.id,
          email: user.email,
          name: user.name,
          actorUserId: user.id,
        });
      }

      if (userId && !token.activeTenantId) {
        const tenantContext = await getDefaultTenantContextForUser(userId);

        if (tenantContext) {
          token.activeTenantId = tenantContext.tenantId;
          token.roleKey = tenantContext.roleKey;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.activeTenantId =
          typeof token.activeTenantId === "string"
            ? token.activeTenantId
            : null;
        session.user.roleKey = isFoundationRoleKey(token.roleKey)
          ? token.roleKey
          : null;
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) {
        return;
      }

      await ensureDefaultTenantForUser({
        userId: user.id,
        email: user.email,
        name: user.name,
        actorUserId: user.id,
      });
    },
  },
});
