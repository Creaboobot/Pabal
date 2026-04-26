import { z } from "zod";

import {
  listTenantAuditLogs,
  type TenantAuditLogRecord,
} from "@/server/repositories/audit-logs";
import { requireWorkspaceAdmin } from "@/server/services/admin-authorization";
import { type TenantContext } from "@/server/services/tenancy";

export const AUDIT_LOG_VIEWER_DEFAULT_LIMIT = 25;
export const AUDIT_LOG_VIEWER_MAX_LIMIT = 50;
const MAX_METADATA_STRING_LENGTH = 160;
const MAX_METADATA_DEPTH = 2;
const MAX_METADATA_ARRAY_ITEMS = 3;
const MAX_METADATA_ENTRIES = 12;

const SENSITIVE_DISPLAY_KEY_PATTERN =
  /(secret|token|cookie|session|authorization|api[_-]?key|password|body|noteBody|pastedText|transcript|editedTranscript|rawAiOutput|providerPayload|proposedPatch|headers|env|payment|card|rawPayload)/i;

const SUSPICIOUS_DISPLAY_VALUE_PATTERNS = [
  /bearer\s+[a-z0-9._-]+/i,
  /postgres(?:ql)?:\/\//i,
  /mysql:\/\//i,
  /mongodb(?:\+srv)?:\/\//i,
  /sk-[a-z0-9_-]{16,}/i,
  /(sk|rk)_(live|test|proj)_[a-z0-9_=-]{12,}/i,
];

const auditLogViewerFilterSchema = z.object({
  action: z.string().trim().min(1).max(160).optional(),
  actorUserId: z.string().trim().min(1).max(160).optional(),
  cursor: z.string().trim().min(1).max(160).optional(),
  entityType: z.string().trim().min(1).max(160).optional(),
  from: z.date().optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(AUDIT_LOG_VIEWER_MAX_LIMIT)
    .default(AUDIT_LOG_VIEWER_DEFAULT_LIMIT),
  to: z.date().optional(),
});

export type AuditLogViewerFilters = z.infer<typeof auditLogViewerFilterSchema>;

export type AuditLogViewerRawFilters = Partial<
  Record<string, string | string[] | undefined>
>;

export type SanitizedAuditMetadataEntry = {
  key: string;
  redacted: boolean;
  truncated: boolean;
  value: string;
};

export type AuditLogViewerEvent = {
  action: string;
  actor: {
    displayName: string;
    email: string | null;
    id: string | null;
  };
  createdAt: Date;
  entityId: string | null;
  entityType: string;
  id: string;
  metadataPreview: SanitizedAuditMetadataEntry[];
};

export type AuditLogViewer = {
  events: AuditLogViewerEvent[];
  filters: AuditLogViewerFilters;
  governanceCards: GovernanceOverviewCard[];
  nextCursor: string | null;
  tenant: {
    id: string;
    name: string;
  };
};

export type GovernanceOverviewCard = {
  description: string;
  key: string;
  title: string;
};

export const governanceOverviewCards = [
  {
    description:
      "Sensitive mutations write audit events, and this viewer reads only sanitized tenant-scoped entries.",
    key: "audit-logging",
    title: "Audit logging active",
  },
  {
    description:
      "Domain services enforce active tenant context before protected reads and writes.",
    key: "tenant-isolation",
    title: "Tenant isolation in services",
  },
  {
    description:
      "Voice capture stores transcripts while raw audio is not retained by default.",
    key: "raw-audio",
    title: "Raw audio not retained",
  },
  {
    description:
      "AI can create review-only proposals; approved proposal items do not apply changes automatically.",
    key: "ai-review",
    title: "Human-in-the-loop AI",
  },
  {
    description:
      "Microsoft Graph remains readiness-only with no OAuth, token storage, sync, or ingestion.",
    key: "microsoft-readiness",
    title: "Microsoft readiness only",
  },
  {
    description:
      "LinkedIn context is manual user-provided data only, with no scraping, monitoring, or automation.",
    key: "linkedin-manual",
    title: "LinkedIn manual only",
  },
  {
    description:
      "Billing has a disabled readiness provider and no checkout, portal, webhooks, or payment collection.",
    key: "billing-readiness",
    title: "Billing readiness only",
  },
  {
    description:
      "Privacy exports are available under settings; deletion and retention controls are planned for Step 14C.",
    key: "export-delete",
    title: "Privacy exports available",
  },
] satisfies GovernanceOverviewCard[];

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function optionalParam(value: string | string[] | undefined) {
  const first = firstParam(value)?.trim();

  return first && first.length > 0 ? first : undefined;
}

function parsePositiveInt(value: string | string[] | undefined) {
  const raw = optionalParam(value);

  if (!raw) {
    return AUDIT_LOG_VIEWER_DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed)) {
    return AUDIT_LOG_VIEWER_DEFAULT_LIMIT;
  }

  return Math.min(Math.max(parsed, 1), AUDIT_LOG_VIEWER_MAX_LIMIT);
}

function parseDateParam(
  value: string | string[] | undefined,
  endOfDay = false,
) {
  const raw = optionalParam(value);

  if (!raw) {
    return undefined;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? `${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
    : raw;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function normalizeAuditLogViewerFilters(
  filters: AuditLogViewerRawFilters = {},
): AuditLogViewerFilters {
  const parsed = auditLogViewerFilterSchema.parse({
    action: optionalParam(filters.action),
    actorUserId: optionalParam(filters.actorUserId),
    cursor: optionalParam(filters.cursor),
    entityType: optionalParam(filters.entityType),
    from: parseDateParam(filters.from),
    limit: parsePositiveInt(filters.limit),
    to: parseDateParam(filters.to, true),
  });

  if (parsed.from && parsed.to && parsed.to < parsed.from) {
    const withoutInvalidTo = {
      ...parsed,
    };

    delete withoutInvalidTo.to;

    return {
      ...withoutInvalidTo,
    };
  }

  return parsed;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function isSensitiveDisplayKey(key: string) {
  return SENSITIVE_DISPLAY_KEY_PATTERN.test(key);
}

function isSuspiciousDisplayValue(value: string) {
  return SUSPICIOUS_DISPLAY_VALUE_PATTERNS.some((pattern) =>
    pattern.test(value),
  );
}

function truncateValue(value: string) {
  if (value.length <= MAX_METADATA_STRING_LENGTH) {
    return {
      truncated: false,
      value,
    };
  }

  return {
    truncated: true,
    value: `${value.slice(0, MAX_METADATA_STRING_LENGTH)}...`,
  };
}

function summarizeMetadataValue(
  key: string,
  value: unknown,
  depth: number,
): Pick<SanitizedAuditMetadataEntry, "redacted" | "truncated" | "value"> {
  if (isSensitiveDisplayKey(key)) {
    return {
      redacted: true,
      truncated: false,
      value: "[redacted]",
    };
  }

  if (value === null || value === undefined) {
    return {
      redacted: false,
      truncated: false,
      value: "Empty",
    };
  }

  if (typeof value === "string") {
    if (isSuspiciousDisplayValue(value)) {
      return {
        redacted: true,
        truncated: false,
        value: "[redacted]",
      };
    }

    return {
      redacted: false,
      ...truncateValue(value),
    };
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return {
      redacted: false,
      truncated: false,
      value: String(value),
    };
  }

  if (value instanceof Date) {
    return {
      redacted: false,
      truncated: false,
      value: value.toISOString(),
    };
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_METADATA_DEPTH) {
      return {
        redacted: false,
        truncated: value.length > 0,
        value: `[array with ${value.length} item${value.length === 1 ? "" : "s"}]`,
      };
    }

    const preview = value
      .slice(0, MAX_METADATA_ARRAY_ITEMS)
      .map((item, index) =>
        summarizeMetadataValue(`${key}[${index}]`, item, depth + 1).value,
      );
    const suffix =
      value.length > MAX_METADATA_ARRAY_ITEMS
        ? `, +${value.length - MAX_METADATA_ARRAY_ITEMS} more`
        : "";

    return {
      redacted: false,
      truncated: value.length > MAX_METADATA_ARRAY_ITEMS,
      value: `[${preview.join(", ")}${suffix}]`,
    };
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);

    if (depth >= MAX_METADATA_DEPTH) {
      return {
        redacted: false,
        truncated: entries.length > 0,
        value: `[object with ${entries.length} key${entries.length === 1 ? "" : "s"}]`,
      };
    }

    const preview = entries
      .slice(0, MAX_METADATA_ARRAY_ITEMS)
      .map(([nestedKey, nestedValue]) => {
        const summarized = summarizeMetadataValue(
          nestedKey,
          nestedValue,
          depth + 1,
        );

        return `${nestedKey}: ${summarized.value}`;
      });
    const suffix =
      entries.length > MAX_METADATA_ARRAY_ITEMS
        ? `, +${entries.length - MAX_METADATA_ARRAY_ITEMS} more`
        : "";

    return {
      redacted: false,
      truncated: entries.length > MAX_METADATA_ARRAY_ITEMS,
      value: `{ ${preview.join(", ")}${suffix} }`,
    };
  }

  return {
    redacted: false,
    ...truncateValue(String(value)),
  };
}

export function sanitizeAuditMetadataForViewer(
  value: unknown,
): SanitizedAuditMetadataEntry[] {
  if (!isPlainObject(value)) {
    if (value === null || value === undefined) {
      return [];
    }

    const summarized = summarizeMetadataValue("value", value, 0);

    return [
      {
        key: "value",
        ...summarized,
      },
    ];
  }

  return Object.entries(value)
    .slice(0, MAX_METADATA_ENTRIES)
    .map(([key, entry]) => ({
      key,
      ...summarizeMetadataValue(key, entry, 0),
    }));
}

function actorDisplay(record: TenantAuditLogRecord) {
  if (!record.actorUserId) {
    return "System";
  }

  return record.actor?.name ?? record.actor?.email ?? "Unknown actor";
}

function toViewerEvent(record: TenantAuditLogRecord): AuditLogViewerEvent {
  return {
    action: record.action,
    actor: {
      displayName: actorDisplay(record),
      email: record.actor?.email ?? null,
      id: record.actorUserId,
    },
    createdAt: record.createdAt,
    entityId: record.entityId,
    entityType: record.entityType,
    id: record.id,
    metadataPreview: sanitizeAuditMetadataForViewer(record.metadata),
  };
}

export async function getTenantAuditLogViewer(
  context: TenantContext,
  rawFilters: AuditLogViewerRawFilters = {},
): Promise<AuditLogViewer> {
  const access = await requireWorkspaceAdmin(context);
  const filters = normalizeAuditLogViewerFilters(rawFilters);
  const page = await listTenantAuditLogs({
    ...filters,
    tenantId: access.tenantId,
  });

  return {
    events: page.records.map(toViewerEvent),
    filters,
    governanceCards: governanceOverviewCards,
    nextCursor: page.nextCursor,
    tenant: {
      id: access.tenantId,
      name: access.tenantName,
    },
  };
}
