import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type AuditClient = PrismaClient | Prisma.TransactionClient;

const MAX_AUDIT_METADATA_STRING_LENGTH = 500;
const MAX_AUDIT_METADATA_DEPTH = 4;
const MAX_AUDIT_METADATA_ARRAY_ITEMS = 20;
const MAX_AUDIT_METADATA_OBJECT_ENTRIES = 50;

const SENSITIVE_KEY_PATTERN =
  /(secret|token|password|authorization|cookie|session|api[_-]?key|storageKey|^headers?$|^env$|providerPayload|rawAiOutput|proposedPatch|noteBody|pastedText|transcriptText|editedTranscriptText|rawPayload|rawFormPayload|formPayload|^body$|payment|card)/i;

const SENSITIVE_VALUE_PATTERNS = [
  /postgres(?:ql)?:\/\//i,
  /mysql:\/\//i,
  /mongodb(?:\+srv)?:\/\//i,
  /bearer\s+[a-z0-9._-]+/i,
  /sk-[a-z0-9_-]{16,}/i,
  /(sk|rk)_(live|test|proj)_[a-z0-9_=-]{12,}/i,
  /\b(?:eyJ[a-z0-9_-]+\.){2}[a-z0-9_-]+\b/i,
  /^[a-z0-9_./+=-]{80,}$/i,
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
  if (SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
    return "[redacted]";
  }

  return value.length > MAX_AUDIT_METADATA_STRING_LENGTH
    ? `${value.slice(0, MAX_AUDIT_METADATA_STRING_LENGTH)}...`
    : value;
}

export function sanitizeAuditMetadata(
  value: unknown,
  depth = 0,
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
    if (depth >= MAX_AUDIT_METADATA_DEPTH) {
      return `[array:${value.length}]`;
    }

    return value
      .slice(0, MAX_AUDIT_METADATA_ARRAY_ITEMS)
      .map((item) => sanitizeAuditMetadata(item, depth + 1))
      .filter((item): item is Prisma.InputJsonValue => item !== undefined);
  }

  if (isPlainObject(value)) {
    if (depth >= MAX_AUDIT_METADATA_DEPTH) {
      return "[object]";
    }

    const sanitized: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, entry] of Object.entries(value).slice(
      0,
      MAX_AUDIT_METADATA_OBJECT_ENTRIES,
    )) {
      if (isSensitiveKey(key)) {
        continue;
      }

      const sanitizedEntry = sanitizeAuditMetadata(entry, depth + 1);

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
