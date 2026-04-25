import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { ensureDefaultTenantForUser } from "@/server/services/tenancy";

const developmentCredentialsSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.string().email(),
  ),
  name: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : undefined),
    z.string().min(1).max(120).optional(),
  ),
});

export function isDevelopmentAuthEnabled(
  source: NodeJS.ProcessEnv = process.env,
) {
  return source.NODE_ENV !== "production" && source.ENABLE_DEV_AUTH === "true";
}

export async function authorizeDevelopmentUser(
  credentials: Partial<Record<string, unknown>> | undefined,
) {
  if (!isDevelopmentAuthEnabled()) {
    return null;
  }

  const parsed = developmentCredentialsSchema.safeParse(credentials ?? {});

  if (!parsed.success) {
    return null;
  }

  const { email, name } = parsed.data;
  const update = name ? { name } : {};

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: name ?? email.split("@")[0] ?? "Developer",
      emailVerified: new Date(),
    },
    update,
  });

  await ensureDefaultTenantForUser({
    userId: user.id,
    email: user.email,
    name: user.name,
    actorUserId: user.id,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  };
}
