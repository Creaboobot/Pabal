import { type Prisma } from "@prisma/client";

import {
  getExportRequestMetadata,
  getTenantPersonalExportSections,
  getTenantWorkspaceExportSections,
  type ExportSection,
} from "@/server/repositories/data-export";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/services/audit-log";
import { sanitizeAuditMetadataForViewer } from "@/server/services/audit-log-viewer";
import { requireWorkspaceAdmin } from "@/server/services/admin-authorization";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export const DATA_EXPORT_VERSION = "pabal.data_export.v1";
export const DATA_EXPORT_SECTION_LIMIT = 5000;

export type DataExportType = "PERSONAL" | "WORKSPACE";

export type DataExportPayload = {
  counts: Record<string, number>;
  exportType: DataExportType;
  exportVersion: typeof DATA_EXPORT_VERSION;
  generatedAt: string;
  limits: {
    sectionLimit: number;
  };
  omissions: string[];
  requestedByUser: {
    email: string | null;
    id: string;
    name: string | null;
  };
  scope: {
    description: string;
    type: DataExportType;
  };
  sections: Record<string, unknown>;
  tenant: {
    id: string;
    name: string;
  };
};

type RawSectionMap = Record<string, ExportSection<unknown>>;

const BASE_OMISSIONS = [
  "Auth.js accounts, sessions, verification tokens, provider access tokens, and refresh tokens are excluded.",
  "Raw audio files are not exported because raw audio is not retained by default.",
  "VoiceNote audioStorageKey is excluded; only retention and audio metadata are exported.",
  "Raw provider payloads, raw AI responses, cookies, headers, environment values, secrets, and payment/card data are excluded.",
  "Audit logs are exported with sanitized metadata previews only; raw audit metadata is excluded.",
];

function sanitizeAuditLogRecord(record: unknown) {
  const auditRecord = record as {
    metadata?: unknown;
    [key: string]: unknown;
  };
  const safeRecord = Object.fromEntries(
    Object.entries(auditRecord).filter(([key]) => key !== "metadata"),
  );

  return {
    ...safeRecord,
    metadataPreview: sanitizeAuditMetadataForViewer(auditRecord.metadata),
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function toJsonReady(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(toJsonReady);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toJsonReady(entry)]),
    );
  }

  return value;
}

function exportRecordsForSection(sectionName: string, records: unknown[]) {
  const exportedRecords =
    sectionName === "auditLogs"
      ? records.map(sanitizeAuditLogRecord)
      : records;

  return toJsonReady(exportedRecords);
}

function buildCounts(sections: RawSectionMap) {
  return Object.fromEntries(
    Object.entries(sections).map(([sectionName, section]) => [
      sectionName,
      section.records.length,
    ]),
  );
}

function buildTruncationFlags(sections: RawSectionMap) {
  return Object.fromEntries(
    Object.entries(sections).map(([sectionName, section]) => [
      sectionName,
      section.truncated,
    ]),
  );
}

function buildOmissions(sections: RawSectionMap) {
  const truncatedSections = Object.entries(sections)
    .filter(([, section]) => section.truncated)
    .map(([sectionName]) => sectionName);

  if (truncatedSections.length === 0) {
    return BASE_OMISSIONS;
  }

  return [
    ...BASE_OMISSIONS,
    `The following sections were truncated at ${DATA_EXPORT_SECTION_LIMIT} records: ${truncatedSections.join(", ")}.`,
  ];
}

function buildSectionPayload(sections: RawSectionMap) {
  return Object.fromEntries(
    Object.entries(sections).map(([sectionName, section]) => [
      sectionName,
      exportRecordsForSection(sectionName, section.records),
    ]),
  );
}

function jsonMetadata(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function buildPayload(input: {
  exportType: DataExportType;
  generatedAt: string;
  requestedByUser: {
    email: string | null;
    id: string;
    name: string | null;
  };
  scopeDescription: string;
  sections: RawSectionMap;
  tenant: {
    id: string;
    name: string;
  };
}): DataExportPayload {
  return {
    counts: buildCounts(input.sections),
    exportType: input.exportType,
    exportVersion: DATA_EXPORT_VERSION,
    generatedAt: input.generatedAt,
    limits: {
      sectionLimit: DATA_EXPORT_SECTION_LIMIT,
    },
    omissions: buildOmissions(input.sections),
    requestedByUser: input.requestedByUser,
    scope: {
      description: input.scopeDescription,
      type: input.exportType,
    },
    sections: buildSectionPayload(input.sections),
    tenant: input.tenant,
  };
}

export async function exportTenantPersonalData(context: TenantContext) {
  const access = await requireTenantAccess(context);
  const generatedAt = new Date().toISOString();

  return prisma.$transaction(async (tx) => {
    const metadata = await getExportRequestMetadata(
      {
        tenantId: access.tenantId,
        userId: access.userId,
      },
      tx,
    );
    const rawSections = (await getTenantPersonalExportSections(
      {
        limit: DATA_EXPORT_SECTION_LIMIT,
        tenantId: access.tenantId,
        userId: access.userId,
      },
      tx,
    )) as RawSectionMap;
    const sections = {
      ...rawSections,
      memberships: {
        records: [metadata.membership],
        truncated: false,
      },
      userProfile: {
        records: [metadata.user],
        truncated: false,
      },
    } satisfies RawSectionMap;
    const payload = buildPayload({
      exportType: "PERSONAL",
      generatedAt,
      requestedByUser: {
        email: metadata.user.email,
        id: metadata.user.id,
        name: metadata.user.name,
      },
      scopeDescription:
        "The current user's contribution inside the active workspace.",
      sections,
      tenant: {
        id: metadata.tenant.id,
        name: metadata.tenant.name,
      },
    });

    await writeAuditLog(
      {
        action: "privacy.personal_export_requested",
        actorUserId: access.userId,
        entityId: access.tenantId,
        entityType: "Tenant",
        metadata: jsonMetadata({
          exportType: payload.exportType,
          generatedAt: payload.generatedAt,
          requestedByUserId: access.userId,
          sectionCounts: payload.counts,
          tenantId: access.tenantId,
          truncationFlags: buildTruncationFlags(sections),
        }),
        tenantId: access.tenantId,
      },
      tx,
    );

    return payload;
  });
}

export async function exportTenantWorkspaceData(context: TenantContext) {
  const access = await requireWorkspaceAdmin(context);
  const generatedAt = new Date().toISOString();

  return prisma.$transaction(async (tx) => {
    const metadata = await getExportRequestMetadata(
      {
        tenantId: access.tenantId,
        userId: access.userId,
      },
      tx,
    );
    const sections = (await getTenantWorkspaceExportSections(
      {
        limit: DATA_EXPORT_SECTION_LIMIT,
        tenantId: access.tenantId,
      },
      tx,
    )) as RawSectionMap;
    const payload = buildPayload({
      exportType: "WORKSPACE",
      generatedAt,
      requestedByUser: {
        email: metadata.user.email,
        id: metadata.user.id,
        name: metadata.user.name,
      },
      scopeDescription:
        "Tenant-owned workspace records for the active workspace.",
      sections,
      tenant: {
        id: metadata.tenant.id,
        name: metadata.tenant.name,
      },
    });

    await writeAuditLog(
      {
        action: "privacy.workspace_export_requested",
        actorUserId: access.userId,
        entityId: access.tenantId,
        entityType: "Tenant",
        metadata: jsonMetadata({
          exportType: payload.exportType,
          generatedAt: payload.generatedAt,
          requestedByUserId: access.userId,
          sectionCounts: payload.counts,
          tenantId: access.tenantId,
          truncationFlags: buildTruncationFlags(sections),
        }),
        tenantId: access.tenantId,
      },
      tx,
    );

    return payload;
  });
}
