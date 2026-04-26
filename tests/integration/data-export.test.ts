// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { type RoleKey } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import {
  DATA_EXPORT_VERSION,
  exportTenantPersonalData,
  exportTenantWorkspaceData,
} from "@/server/services/data-export";
import { WorkspaceAdminAuthorizationError } from "@/server/services/admin-authorization";
import {
  createTenantContext,
  createUser,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";
import { type TenantContext } from "@/server/services/tenancy";

const getCurrentUserContextMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/services/session", () => ({
  getCurrentUserContext: getCurrentUserContextMock,
}));

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

async function seedExportRecords(owner: TenantContext) {
  const teammate = await addMember({
    context: owner,
    email: "export-teammate@example.com",
    name: "Export Teammate",
    roleKey: "MEMBER",
  });
  const otherTenant = await createTenantContext(
    "export-other@example.com",
    "Other Workspace Owner",
  );

  await prisma.auditLog.deleteMany();

  const person = await prisma.person.create({
    data: {
      createdByUserId: owner.userId,
      displayName: "Owner Export Person",
      tenantId: owner.tenantId,
    },
  });
  const company = await prisma.company.create({
    data: {
      createdByUserId: owner.userId,
      name: "Owner Export Company",
      tenantId: owner.tenantId,
    },
  });
  const teammateNote = await prisma.note.create({
    data: {
      body: "Team note body should appear only in workspace export.",
      createdByUserId: teammate.user.id,
      sourceType: "MANUAL",
      tenantId: owner.tenantId,
    },
  });
  const ownerNote = await prisma.note.create({
    data: {
      body: "Owner note body with relationship context.",
      createdByUserId: owner.userId,
      personId: person.id,
      sourceType: "TEAMS_COPILOT_PASTE",
      tenantId: owner.tenantId,
    },
  });
  const voiceNote = await prisma.voiceNote.create({
    data: {
      audioMimeType: "audio/webm",
      audioRetentionStatus: "NOT_STORED",
      audioSizeBytes: 128,
      audioStorageKey: "raw-audio-storage-key-must-not-export",
      createdByUserId: owner.userId,
      rawAudioDeletedAt: new Date("2026-04-26T10:00:00.000Z"),
      status: "TRANSCRIBED",
      tenantId: owner.tenantId,
      transcriptText: "Owner voice transcript should export in personal scope.",
    },
  });
  const proposal = await prisma.aIProposal.create({
    data: {
      createdByUserId: owner.userId,
      proposalType: "VOICE_NOTE_EXTRACTION",
      sourceVoiceNoteId: voiceNote.id,
      tenantId: owner.tenantId,
      title: "Export proposal",
    },
  });
  await prisma.aIProposalItem.create({
    data: {
      aiProposalId: proposal.id,
      createdByUserId: owner.userId,
      proposedPatch: {
        title: "Proposed patch content is tenant export content.",
      },
      tenantId: owner.tenantId,
    },
  });
  await prisma.sourceReference.create({
    data: {
      createdByUserId: owner.userId,
      sourceEntityId: ownerNote.id,
      sourceEntityType: "NOTE",
      targetEntityId: person.id,
      targetEntityType: "PERSON",
      tenantId: owner.tenantId,
    },
  });
  await prisma.note.create({
    data: {
      body: "Cross tenant note body must not export.",
      createdByUserId: otherTenant.userId,
      tenantId: otherTenant.tenantId,
    },
  });
  await prisma.auditLog.create({
    data: {
      action: "note.created",
      actorUserId: owner.userId,
      entityId: ownerNote.id,
      entityType: "Note",
      metadata: {
        noteBody: "Audit note body must be redacted.",
        safeField: "safe",
        token: "Bearer secret-token",
      },
      tenantId: owner.tenantId,
    },
  });
  await prisma.auditLog.create({
    data: {
      action: "note.created",
      actorUserId: otherTenant.userId,
      entityType: "Note",
      metadata: {
        safeField: "cross tenant",
      },
      tenantId: otherTenant.tenantId,
    },
  });

  return {
    company,
    ownerNote,
    person,
    proposal,
    teammate,
    teammateNote,
    voiceNote,
  };
}

describeWithDatabase("data export and privacy controls", () => {
  beforeEach(async () => {
    getCurrentUserContextMock.mockReset();
    await resetDatabase();
  });

  it("creates a personal export for the current user's active-workspace contribution", async () => {
    const owner = await createTenantContext("personal-export@example.com");
    await seedExportRecords(owner);

    const payload = await exportTenantPersonalData(owner);
    const serialized = JSON.stringify(payload);

    expect(payload.exportVersion).toBe(DATA_EXPORT_VERSION);
    expect(payload.exportType).toBe("PERSONAL");
    expect(payload.tenant.id).toBe(owner.tenantId);
    expect(payload.requestedByUser.id).toBe(owner.userId);
    expect(payload.counts.notes).toBe(1);
    expect(serialized).toContain("Owner note body with relationship context.");
    expect(serialized).toContain(
      "Owner voice transcript should export in personal scope.",
    );
    expect(serialized).toContain("Proposed patch content is tenant export content.");
    expect(serialized).not.toContain("Team note body should appear");
    expect(serialized).not.toContain("Cross tenant note body must not export.");
    expect(serialized).not.toContain("raw-audio-storage-key-must-not-export");
  });

  it("creates a workspace export for owners/admins and excludes cross-tenant rows", async () => {
    const owner = await createTenantContext("workspace-export@example.com");
    await seedExportRecords(owner);

    const payload = await exportTenantWorkspaceData(owner);
    const serialized = JSON.stringify(payload);

    expect(payload.exportType).toBe("WORKSPACE");
    expect(payload.counts.notes).toBe(2);
    expect(serialized).toContain("Owner note body with relationship context.");
    expect(serialized).toContain("Team note body should appear only");
    expect(serialized).not.toContain("Cross tenant note body must not export.");
    expect(serialized).not.toContain("raw-audio-storage-key-must-not-export");
  });

  it("denies workspace export for non-admin users", async () => {
    const owner = await createTenantContext("workspace-denied@example.com");
    const member = await addMember({
      context: owner,
      email: "workspace-denied-member@example.com",
      name: "Workspace Denied Member",
      roleKey: "MEMBER",
    });

    await expect(exportTenantWorkspaceData(member.context)).rejects.toBeInstanceOf(
      WorkspaceAdminAuthorizationError,
    );
  });

  it("sanitizes audit metadata and writes export-request audit logs safely", async () => {
    const owner = await createTenantContext("export-audit@example.com");
    await seedExportRecords(owner);

    const payload = await exportTenantWorkspaceData(owner);
    const serialized = JSON.stringify(payload.sections.auditLogs);
    const auditLog = await prisma.auditLog.findFirstOrThrow({
      orderBy: {
        createdAt: "desc",
      },
      where: {
        action: "privacy.workspace_export_requested",
        tenantId: owner.tenantId,
      },
    });
    const auditMetadata = JSON.stringify(auditLog.metadata);

    expect(serialized).toContain("metadataPreview");
    expect(serialized).not.toContain("Audit note body must be redacted.");
    expect(serialized).not.toContain("Bearer secret-token");
    expect(auditMetadata).toContain("sectionCounts");
    expect(auditMetadata).not.toContain("Owner note body");
    expect(auditMetadata).not.toContain("Owner voice transcript");
    expect(auditMetadata).not.toContain("Proposed patch content");
  });

  it("returns JSON downloads from the personal export route", async () => {
    const owner = await createTenantContext("personal-route@example.com");
    await seedExportRecords(owner);
    getCurrentUserContextMock.mockResolvedValue(owner);
    const { POST: personalExportPost } = await import(
      "@/app/api/privacy/exports/personal/route"
    );

    const response = await personalExportPost();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(response.headers.get("Content-Type")).toContain("charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Disposition")).toContain(
      "pabal-personal-export",
    );
    expect(body.exportType).toBe("PERSONAL");
  });

  it("denies workspace export route access for non-admin users", async () => {
    const owner = await createTenantContext("workspace-route@example.com");
    const member = await addMember({
      context: owner,
      email: "workspace-route-member@example.com",
      name: "Workspace Route Member",
      roleKey: "MEMBER",
    });
    getCurrentUserContextMock.mockResolvedValue(member.context);
    const { POST: workspaceExportPost } = await import(
      "@/app/api/privacy/exports/workspace/route"
    );

    const response = await workspaceExportPost();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Workspace admin access is required.");
  });

  it("returns JSON downloads from the workspace export route for admins", async () => {
    const owner = await createTenantContext("workspace-route-admin@example.com");
    await seedExportRecords(owner);
    getCurrentUserContextMock.mockResolvedValue(owner);
    const { POST: workspaceExportPost } = await import(
      "@/app/api/privacy/exports/workspace/route"
    );

    const response = await workspaceExportPost();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain(
      "pabal-workspace-export",
    );
    expect(body.exportType).toBe("WORKSPACE");
  });
});
