import { z } from "zod";

const emptyStringToUndefined = z.literal("").transform(() => undefined);

const optionalString = z.union([z.string().min(1), emptyStringToUndefined]).optional();
const optionalUrl = z.union([z.string().url(), emptyStringToUndefined]).optional();
const optionalBoolean = z
  .union([z.enum(["true", "false"]).transform((value) => value === "true"), emptyStringToUndefined])
  .optional();

export const runtimeEnvSchema = z.object({
  APP_URL: optionalUrl,
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  AUTH_SECRET: optionalString,
  AUTH_MICROSOFT_ENTRA_ID_ID: optionalString,
  AUTH_MICROSOFT_ENTRA_ID_SECRET: optionalString,
  AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: optionalString,

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

  FEATURE_MICROSOFT_GRAPH: optionalBoolean,
  FEATURE_LINKEDIN_MANUAL_ENRICHMENT: optionalBoolean,
  FEATURE_VOICE_CAPTURE: optionalBoolean,
  FEATURE_BILLING: optionalBoolean,
});

const readinessEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required at runtime"),
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
  const required = readinessEnvSchema.safeParse(source);

  return {
    ready: runtime.success && required.success,
    checks: [
      {
        name: "runtime-env-shape",
        ok: runtime.success,
      },
      {
        name: "database-url",
        ok: required.success,
      },
    ],
  };
}
