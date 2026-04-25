import { z } from "zod";

const emptyStringToUndefined = z.literal("").transform(() => undefined);

const optionalString = z.union([z.string().min(1), emptyStringToUndefined]).optional();
const optionalUrl = z.union([z.string().url(), emptyStringToUndefined]).optional();
const optionalFlag = z
  .union([
    z.enum(["true", "false", "1", "0"]).transform((value) => value === "true" || value === "1"),
    emptyStringToUndefined,
  ])
  .optional();

export const runtimeEnvSchema = z.object({
  APP_URL: optionalUrl,
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_TELEMETRY_DISABLED: optionalFlag,

  AUTH_SECRET: optionalString,
  AUTH_MICROSOFT_ENTRA_ID_ID: optionalString,
  AUTH_MICROSOFT_ENTRA_ID_SECRET: optionalString,
  AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: optionalString,
  AUTH_MICROSOFT_ENTRA_ID_ISSUER: optionalUrl,
  ENABLE_DEV_AUTH: optionalFlag,

  DATABASE_URL: optionalString,

  OPENAI_API_KEY: optionalString,
  OPENAI_TRANSCRIPTION_MODEL: optionalString,
  OPENAI_STRUCTURING_MODEL: optionalString,
  OPENAI_EMBEDDING_MODEL: optionalString,

  STORAGE_PROVIDER: optionalString,
  S3_ENDPOINT: optionalString,
  S3_REGION: optionalString,
  S3_BUCKET: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,

  JOB_PROVIDER: optionalString,
  INNGEST_EVENT_KEY: optionalString,
  INNGEST_SIGNING_KEY: optionalString,

  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_PRICE_ID_PRO: optionalString,

  SENTRY_DSN: optionalString,

  FEATURE_MICROSOFT_GRAPH: optionalFlag,
  FEATURE_LINKEDIN_MANUAL_ENRICHMENT: optionalFlag,
  FEATURE_VOICE_CAPTURE: optionalFlag,
  FEATURE_BILLING: optionalFlag,
});

const databaseReadinessEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required at runtime"),
});

const authReadinessEnvSchema = z.object({
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required at runtime"),
});

export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>;

export function readRuntimeEnv(source: NodeJS.ProcessEnv = process.env) {
  return runtimeEnvSchema.safeParse(source);
}

export function getRuntimeEnv(source: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  const parsed = readRuntimeEnv(source);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid runtime environment: ${details}`);
  }

  return parsed.data;
}

export function getReadinessStatus(source: NodeJS.ProcessEnv = process.env) {
  const runtime = readRuntimeEnv(source);
  const database = databaseReadinessEnvSchema.safeParse(source);
  const auth = authReadinessEnvSchema.safeParse(source);

  return {
    ready: runtime.success && database.success && auth.success,
    checks: [
      {
        name: "runtime-env-shape",
        ok: runtime.success,
      },
      {
        name: "database-url",
        ok: database.success,
      },
      {
        name: "auth-secret",
        ok: auth.success,
      },
    ],
  };
}
