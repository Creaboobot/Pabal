import { auth } from "@/auth";
import {
  ensureDefaultTenantForUser,
  getDefaultTenantContextForUser,
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required");
    this.name = "AuthenticationRequiredError";
  }
}

export async function getCurrentUserContext(): Promise<TenantContext | null> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  if (session.user?.activeTenantId) {
    return requireTenantAccess({
      userId,
      tenantId: session.user.activeTenantId,
    });
  }

  const existingContext = await getDefaultTenantContextForUser(userId);

  if (existingContext) {
    return existingContext;
  }

  return ensureDefaultTenantForUser({
    userId,
    email: session.user?.email,
    name: session.user?.name,
    actorUserId: userId,
  });
}

export async function requireCurrentUserContext() {
  const context = await getCurrentUserContext();

  if (!context) {
    throw new AuthenticationRequiredError();
  }

  return context;
}
