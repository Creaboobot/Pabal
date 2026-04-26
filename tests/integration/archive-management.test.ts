// @vitest-environment node
import { beforeEach, expect, it } from "vitest";
import { type Prisma, type RoleKey } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import {
  getTenantArchiveBrowser,
  restoreTenantArchivedRecord,
} from "@/server/services/archive-management";
import { WorkspaceAdminAuthorizationError } from "@/server/services/admin-authorization";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  createTenantContext,
  createUser,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";
import { type TenantContext } from "@/server/services/tenancy";

async function addMember(input: {
  context: TenantContext;
  email: string;
  name: string;
  roleKey: RoleKey;
}) {
  const user = await createUser(input.email, input.name);
  const role = await prisma.role.findUniqueOrThrow({
    where: {
      key: input.roleKey,
    },
  });

  await prisma.membership.create({
    data: {
      roleId: role.id,
      tenantId: input.context.tenantId,
      userId: user.id,
    },
  });

  return {
    context: {
      roleKey: input.roleKey,
      tenantId: input.context.tenantId,
      tenantName: input.context.tenantName,
      userId: user.id,
    } satisfies TenantContext,
    user,
  };
}

async function createArchiveLog(input: {
  action: string;
  actorUserId: string;
  entityId: string;
  entityType: string;
  tenantId: string;
}) {
  return prisma.auditLog.create({
    data: {
      action: input.action,
      actorUserId: input.actorUserId,
      entityId: input.entityId,
      entityType: input.entityType,
      metadata: {
        source: "test",
      } satisfies Prisma.InputJsonValue,
      tenantId: input.tenantId,
    },
  });
}

async function seedArchivedRecords(owner: TenantContext) {
  const archivedAt = new Date("2026-04-26T10:00:00.000Z");
  const otherTenant = await createTenantContext(
    "archive-other@example.com",
    "Other Archive Owner",
  );

  await prisma.auditLog.deleteMany();

  const person = await prisma.person.create({
    data: {
      archivedAt,
      createdByUserId: owner.userId,
      displayName: "Archived Person",
      relationshipStatus: "ARCHIVED",
      tenantId: owner.tenantId,
    },
  });
  const note = await prisma.note.create({
    data: {
      archivedAt: new Date("2026-04-26T11:00:00.000Z"),
      body: "Sensitive archived note body must not be logged during restore.",
      createdByUserId: owner.userId,
      sensitivity: "SENSITIVE_BUSINESS",
      sourceType: "MANUAL",
      summary: "Archived note summary",
      tenantId: owner.tenantId,
    },
  });
  const voiceNote = await prisma.voiceNote.create({
    data: {
      archivedAt: new Date("2026-04-26T12:00:00.000Z"),
      audioRetentionStatus: "NOT_STORED",
      createdByUserId: owner.userId,
      editedTranscriptText: "Edited transcript must not be audit metadata.",
      rawAudioDeletedAt: new Date("2026-04-26T12:01:00.000Z"),
      status: "TRANSCRIBED",
      tenantId: owner.tenantId,
      title: "Archived voice note",
      transcriptText: "Transcript must not be audit metadata.",
    },
  });
  const crossTenantNote = await prisma.note.create({
    data: {
      archivedAt,
      body: "Cross tenant archive body must not appear.",
      createdByUserId: otherTenant.userId,
      summary: "Cross tenant archived note",
      tenantId: otherTenant.tenantId,
    },
  });

  await createArchiveLog({
    action: "person.archived",
    actorUserId: owner.userId,
    entityId: person.id,
    entityType: "Person",
    tenantId: owner.tenantId,
  });
  await createArchiveLog({
    action: "note.archived",
    actorUserId: owner.userId,
    entityId: note.id,
    entityType: "Note",
    tenantId: owner.tenantId,
  });
  await createArchiveLog({
    action: "voice_note.archived",
    actorUserId: owner.userId,
    entityId: voiceNote.id,
    entityType: "VoiceNote",
    tenantId: owner.tenantId,
  });

  return {
    crossTenantNote,
    note,
    person,
    voiceNote,
  };
}

describeWithDatabase("archive management", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("lists archived records for the active tenant only", async () => {
    const owner = await createTenantContext("archive-owner@example.com");
    await seedArchivedRecords(owner);

    const browser = await getTenantArchiveBrowser(owner);
    const serialized = JSON.stringify(browser);

    expect(browser.records).toHaveLength(3);
    expect(serialized).toContain("Archived Person");
    expect(serialized).toContain("Archived note summary");
    expect(serialized).toContain("Archived voice note");
    expect(serialized).not.toContain("Cross tenant archived note");
    expect(browser.records[0]?.archivedBy?.id).toBe(owner.userId);
  });

  it("filters archived records by record type", async () => {
    const owner = await createTenantContext("archive-filter@example.com");
    await seedArchivedRecords(owner);

    const browser = await getTenantArchiveBrowser(owner, {
      recordType: "voiceNotes",
    });

    expect(browser.records).toHaveLength(1);
    expect(browser.records[0]?.recordType).toBe("voiceNotes");
    expect(browser.records[0]?.voiceRetention?.audioRetentionStatus).toBe(
      "NOT_STORED",
    );
    expect(browser.records[0]?.voiceRetention?.transcriptPresent).toBe(true);
    expect(browser.records[0]?.voiceRetention?.editedTranscriptPresent).toBe(true);
  });

  it("denies archive browsing and restore for non-admin users", async () => {
    const owner = await createTenantContext("archive-denied@example.com");
    const { note } = await seedArchivedRecords(owner);
    const member = await addMember({
      context: owner,
      email: "archive-member@example.com",
      name: "Archive Member",
      roleKey: "MEMBER",
    });

    await expect(getTenantArchiveBrowser(member.context)).rejects.toBeInstanceOf(
      WorkspaceAdminAuthorizationError,
    );
    await expect(
      restoreTenantArchivedRecord(member.context, {
        recordId: note.id,
        recordType: "notes",
      }),
    ).rejects.toBeInstanceOf(WorkspaceAdminAuthorizationError);
  });

  it("restores archived notes without logging sensitive content", async () => {
    const owner = await createTenantContext("archive-restore@example.com");
    const { note } = await seedArchivedRecords(owner);

    await restoreTenantArchivedRecord(owner, {
      recordId: note.id,
      recordType: "notes",
    });

    const restored = await prisma.note.findUniqueOrThrow({
      where: {
        id_tenantId: {
          id: note.id,
          tenantId: owner.tenantId,
        },
      },
    });
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: "note.restored",
        entityId: note.id,
        tenantId: owner.tenantId,
      },
    });
    const auditMetadata = JSON.stringify(audit.metadata);

    expect(restored.archivedAt).toBeNull();
    expect(restored.updatedByUserId).toBe(owner.userId);
    expect(auditMetadata).toContain("previousArchivedAt");
    expect(auditMetadata).not.toContain("Sensitive archived note body");
  });

  it("maps archived person relationship status to unknown on restore", async () => {
    const owner = await createTenantContext("archive-person@example.com");
    const { person } = await seedArchivedRecords(owner);

    await restoreTenantArchivedRecord(owner, {
      recordId: person.id,
      recordType: "people",
    });

    const restored = await prisma.person.findUniqueOrThrow({
      where: {
        id_tenantId: {
          id: person.id,
          tenantId: owner.tenantId,
        },
      },
    });
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: "person.restored",
        entityId: person.id,
        tenantId: owner.tenantId,
      },
    });

    expect(restored.archivedAt).toBeNull();
    expect(restored.relationshipStatus).toBe("UNKNOWN");
    expect(JSON.stringify(audit.metadata)).toContain("relationshipStatusChange");
  });

  it("fails safely for cross-tenant restore attempts", async () => {
    const owner = await createTenantContext("archive-cross@example.com");
    const { crossTenantNote } = await seedArchivedRecords(owner);

    await expect(
      restoreTenantArchivedRecord(owner, {
        recordId: crossTenantNote.id,
        recordType: "notes",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });
});
