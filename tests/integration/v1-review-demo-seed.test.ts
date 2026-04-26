// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { seedV1ReviewDemoData } from "@/prisma/seed-data/v1-review-demo";
import { prisma } from "@/server/db/prisma";
import {
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

async function demoCounts(tenantId: string) {
  const [
    companies,
    people,
    affiliations,
    meetings,
    meetingParticipants,
    notes,
    tasks,
    commitments,
    needs,
    capabilities,
    introductionSuggestions,
    aiProposals,
    aiProposalItems,
    voiceNotes,
    sourceReferences,
    auditLogs,
  ] = await Promise.all([
    prisma.company.count({ where: { tenantId } }),
    prisma.person.count({ where: { tenantId } }),
    prisma.companyAffiliation.count({ where: { tenantId } }),
    prisma.meeting.count({ where: { tenantId } }),
    prisma.meetingParticipant.count({ where: { tenantId } }),
    prisma.note.count({ where: { tenantId } }),
    prisma.task.count({ where: { tenantId } }),
    prisma.commitment.count({ where: { tenantId } }),
    prisma.need.count({ where: { tenantId } }),
    prisma.capability.count({ where: { tenantId } }),
    prisma.introductionSuggestion.count({ where: { tenantId } }),
    prisma.aIProposal.count({ where: { tenantId } }),
    prisma.aIProposalItem.count({ where: { tenantId } }),
    prisma.voiceNote.count({ where: { tenantId } }),
    prisma.sourceReference.count({ where: { tenantId } }),
    prisma.auditLog.count({ where: { tenantId } }),
  ]);

  return {
    companies,
    people,
    affiliations,
    meetings,
    meetingParticipants,
    notes,
    tasks,
    commitments,
    needs,
    capabilities,
    introductionSuggestions,
    aiProposals,
    aiProposalItems,
    voiceNotes,
    sourceReferences,
    auditLogs,
  };
}

describeWithDatabase("V1 review demo seed data", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates a richer deterministic demo workspace idempotently", async () => {
    const first = await seedV1ReviewDemoData(prisma);
    const firstCounts = await demoCounts(first.tenantId);
    const second = await seedV1ReviewDemoData(prisma);
    const secondCounts = await demoCounts(second.tenantId);

    expect(second).toEqual(first);
    expect(secondCounts).toEqual(firstCounts);
    expect(firstCounts).toMatchObject({
      companies: 8,
      people: 10,
      affiliations: 10,
      meetings: 6,
      meetingParticipants: 10,
      notes: 9,
      tasks: 5,
      commitments: 4,
      needs: 5,
      capabilities: 4,
      introductionSuggestions: 4,
      aiProposals: 4,
      aiProposalItems: 6,
      voiceNotes: 4,
      sourceReferences: 17,
    });
    expect(firstCounts.auditLogs).toBeGreaterThanOrEqual(5);
  });

  it("covers V1 review-specific sources, archives, and voice retention", async () => {
    const { tenantId } = await seedV1ReviewDemoData(prisma);

    await expect(
      prisma.note.count({
        where: { tenantId, sourceType: "TEAMS_COPILOT_PASTE" },
      }),
    ).resolves.toBeGreaterThanOrEqual(1);
    await expect(
      prisma.note.count({
        where: { tenantId, sourceType: "LINKEDIN_USER_PROVIDED" },
      }),
    ).resolves.toBeGreaterThanOrEqual(1);
    await expect(
      prisma.person.count({
        where: { tenantId, linkedinUrl: { not: null } },
      }),
    ).resolves.toBeGreaterThanOrEqual(1);
    await expect(
      prisma.person.count({
        where: { tenantId, salesNavigatorUrl: { not: null } },
      }),
    ).resolves.toBeGreaterThanOrEqual(1);
    await expect(
      prisma.voiceNote.count({
        where: {
          tenantId,
          audioRetentionStatus: "NOT_STORED",
          audioStorageKey: null,
          rawAudioDeletedAt: { not: null },
        },
      }),
    ).resolves.toBeGreaterThanOrEqual(1);

    const archivedCounts = await Promise.all([
      prisma.person.count({ where: { tenantId, archivedAt: { not: null } } }),
      prisma.company.count({ where: { tenantId, archivedAt: { not: null } } }),
      prisma.note.count({ where: { tenantId, archivedAt: { not: null } } }),
      prisma.task.count({ where: { tenantId, archivedAt: { not: null } } }),
      prisma.voiceNote.count({ where: { tenantId, archivedAt: { not: null } } }),
    ]);

    expect(archivedCounts.every((count) => count > 0)).toBe(true);
  });

  it("uses safe synthetic audit metadata without exported content", async () => {
    const { tenantId } = await seedV1ReviewDemoData(prisma);
    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId },
      select: { metadata: true },
    });
    const serializedMetadata = JSON.stringify(auditLogs.map((log) => log.metadata));

    expect(serializedMetadata).not.toMatch(/sk-|secret|token|cookie|headers/i);
    expect(serializedMetadata).not.toMatch(/Teams\/Copilot paste:/);
    expect(serializedMetadata).not.toMatch(/Sofia wants practical partner/);
    expect(serializedMetadata).not.toMatch(/proposedPatch/i);
  });
});
