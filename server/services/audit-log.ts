import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type AuditClient = PrismaClient | Prisma.TransactionClient;

const SENSITIVE_KEY_PATTERN =
  /(secret|token|password|authorization|cookie|session|api[_-]?key)/i;

const SENSITIVE_VALUE_PATTERNS = [
  /postgres(?:ql)?:\/\//i,
  /bearer\s+[a-z0-9._-]+/i,
  /sk-[a-z0-9]/i,
];

export type AuditLogInput = {
  tenantId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function isSensitiveKey(key: string) {
  return SENSITIVE_KEY_PATTERN.test(key);
}

function sanitizeString(value: string) {
  return SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value))
    ? "[redacted]"
    : value;
}

export function sanitizeAuditMetadata(
  value: unknown,
): Prisma.InputJsonValue | undefined {
  if (value === undefined || typeof value === "function") {
    return undefined;
  }

  if (value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeAuditMetadata(item))
      .filter((item): item is Prisma.InputJsonValue => item !== undefined);
  }

  if (isPlainObject(value)) {
    const sanitized: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, entry] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
        continue;
      }

      const sanitizedEntry = sanitizeAuditMetadata(entry);

      if (sanitizedEntry !== undefined) {
        sanitized[key] = sanitizedEntry;
      }
    }

    return sanitized;
  }

  return String(value);
}

export async function writeAuditLog(
  input: AuditLogInput,
  db: AuditClient = prisma,
) {
  const metadata =
    input.metadata === undefined
      ? undefined
      : sanitizeAuditMetadata(input.metadata);
  const data: Prisma.AuditLogUncheckedCreateInput = {
    tenantId: input.tenantId ?? null,
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
  };

  if (metadata !== undefined) {
    data.metadata = metadata;
  }

  return db.auditLog.create({
    data,
  });
}
