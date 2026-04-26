import { z } from "zod";
import { type SourceEntityType } from "@prisma/client";

import {
  ARCHIVE_RECORD_TYPES,
  archiveRecordRestoreAction,
  archiveRecordTypeLabel,
  listArchivedRecordsForTenant,
  restoreArchivedRecordForTenant,
  type ArchiveRecordFilter,
  type ArchiveRecordType,
  type ArchivedRecordSummary,
} from "@/server/repositories/archive-management";
import { prisma } from "@/server/db/prisma";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { writeAuditLog } from "@/server/services/audit-log";
import { requireWorkspaceAdmin } from "@/server/services/admin-authorization";
import { type TenantContext } from "@/server/services/tenancy";

export const ARCHIVE_BROWSER_DEFAULT_LIMIT = 25;
export const ARCHIVE_BROWSER_MAX_LIMIT = 50;

export const archiveRecordTypeSchema = z.enum(ARCHIVE_RECORD_TYPES);

const archiveRecordFilterSchema = z.union([
  archiveRecordTypeSchema,
  z.literal("all"),
]);

const archiveBrowserFilterSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(ARCHIVE_BROWSER_MAX_LIMIT)
    .default(ARCHIVE_BROWSER_DEFAULT_LIMIT),
  recordType: archiveRecordFilterSchema.default("all"),
});

export const restoreArchiveRecordSchema = z.object({
  recordId: z.string().trim().min(1),
  recordType: archiveRecordTypeSchema,
});

export type ArchiveBrowserRawFilters = Partial<
  Record<string, string | string[] | undefined>
>;

export type ArchiveBrowserFilters = z.infer<typeof archiveBrowserFilterSchema>;

export type ArchiveBrowserOption = {
  label: string;
  value: ArchiveRecordFilter;
};

export type ArchiveBrowser = {
  filters: ArchiveBrowserFilters;
  options: ArchiveBrowserOption[];
  records: ArchivedRecordSummary[];
  tenant: {
    id: string;
    name: string;
  };
  truncated: boolean;
};

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

function parseLimit(value: string | string[] | undefined) {
  const raw = optionalParam(value);

  if (!raw) {
    return ARCHIVE_BROWSER_DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed)) {
    return ARCHIVE_BROWSER_DEFAULT_LIMIT;
  }

  return Math.min(Math.max(parsed, 1), ARCHIVE_BROWSER_MAX_LIMIT);
}

export function normalizeArchiveBrowserFilters(
  rawFilters: ArchiveBrowserRawFilters = {},
): ArchiveBrowserFilters {
  const rawRecordType = optionalParam(rawFilters.recordType);
  const parsedRecordType = archiveRecordFilterSchema.safeParse(rawRecordType);
  const recordType = parsedRecordType.success ? parsedRecordType.data : "all";

  return archiveBrowserFilterSchema.parse({
    limit: parseLimit(rawFilters.limit),
    recordType,
  });
}

export function archiveBrowserOptions(): ArchiveBrowserOption[] {
  return [
    {
      label: "All archived records",
      value: "all",
    },
    ...ARCHIVE_RECORD_TYPES.map((recordType) => ({
      label: archiveRecordTypeLabel(recordType),
      value: recordType,
    })),
  ];
}

function archiveRecordSourceEntityType(
  recordType: ArchiveRecordType,
): SourceEntityType {
  switch (recordType) {
    case "people":
      return "PERSON";
    case "companies":
      return "COMPANY";
    case "companyAffiliations":
      return "COMPANY_AFFILIATION";
    case "meetings":
      return "MEETING";
    case "notes":
      return "NOTE";
    case "tasks":
      return "TASK";
    case "commitments":
      return "COMMITMENT";
    case "needs":
      return "NEED";
    case "capabilities":
      return "CAPABILITY";
    case "introductionSuggestions":
      return "INTRODUCTION_SUGGESTION";
    case "aiProposals":
      return "AI_PROPOSAL";
    case "voiceNotes":
      return "VOICE_NOTE";
  }
}

export async function getTenantArchiveBrowser(
  context: TenantContext,
  rawFilters: ArchiveBrowserRawFilters = {},
): Promise<ArchiveBrowser> {
  const access = await requireWorkspaceAdmin(context);
  const filters = normalizeArchiveBrowserFilters(rawFilters);
  const page = await listArchivedRecordsForTenant({
    limit: filters.limit,
    recordType: filters.recordType,
    tenantId: access.tenantId,
  });

  return {
    filters,
    options: archiveBrowserOptions(),
    records: page.records,
    tenant: {
      id: access.tenantId,
      name: access.tenantName,
    },
    truncated: page.truncated,
  };
}

function restoreAuditMetadata(input: {
  changedFields: string[];
  previousArchivedAt: Date;
  recordId: string;
  recordType: ArchiveRecordType;
  relationshipStatusChange?: {
    from: string;
    to: string;
  } | undefined;
  restoredByUserId: string;
}) {
  return {
    changedFields: input.changedFields,
    previousArchivedAt: input.previousArchivedAt.toISOString(),
    recordId: input.recordId,
    recordType: input.recordType,
    relationshipStatusChange: input.relationshipStatusChange,
    restoredByUserId: input.restoredByUserId,
  };
}

export async function restoreTenantArchivedRecord(
  context: TenantContext,
  input: {
    recordId: string;
    recordType: ArchiveRecordType;
  },
) {
  const access = await requireWorkspaceAdmin(context);

  return prisma.$transaction(async (tx) => {
    const restored = await restoreArchivedRecordForTenant(
      {
        recordId: input.recordId,
        recordType: input.recordType,
        tenantId: access.tenantId,
        userId: access.userId,
      },
      tx,
    );

    if (!restored) {
      throw new TenantScopedEntityNotFoundError(
        archiveRecordSourceEntityType(input.recordType),
        input.recordId,
      );
    }

    await writeAuditLog(
      {
        action: archiveRecordRestoreAction(restored.recordType),
        actorUserId: access.userId,
        entityId: restored.id,
        entityType: restored.entityType,
        metadata: restoreAuditMetadata({
          changedFields: restored.changedFields,
          previousArchivedAt: restored.previousArchivedAt,
          recordId: restored.id,
          recordType: restored.recordType,
          relationshipStatusChange: restored.relationshipStatusChange,
          restoredByUserId: access.userId,
        }),
        tenantId: access.tenantId,
      },
      tx,
    );

    return restored;
  });
}
