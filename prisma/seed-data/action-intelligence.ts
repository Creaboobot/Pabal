import { type Prisma, type PrismaClient } from "@prisma/client";

import { seedRelationshipBackboneDemoData } from "./relationship-backbone";

type SeedClient = PrismaClient | Prisma.TransactionClient;

export async function seedActionIntelligenceDemoData(db: SeedClient) {
  const { tenantId, userId } = await seedRelationshipBackboneDemoData(db);

  const need = await db.need.upsert({
    where: { id: "demo-need-mbse-practical-training" },
    create: {
      id: "demo-need-mbse-practical-training",
      tenantId,
      title: "Practical MBSE training examples",
      description:
        "Peter needs practical MBSE training examples and a sample three-day agenda.",
      needType: "REQUIREMENT",
      status: "OPEN",
      priority: "HIGH",
      sensitivity: "NORMAL",
      personId: "demo-person-peter",
      companyId: "demo-company-vestas-energy",
      meetingId: "demo-meeting-mbse-readiness",
      noteId: "demo-note-meeting-mbse",
      confidence: 0.88,
      createdByUserId: userId,
      updatedByUserId: userId,
    },
    update: {
      title: "Practical MBSE training examples",
      description:
        "Peter needs practical MBSE training examples and a sample three-day agenda.",
      needType: "REQUIREMENT",
      status: "OPEN",
      priority: "HIGH",
      sensitivity: "NORMAL",
      confidence: 0.88,
      updatedByUserId: userId,
    },
  });

  const capability = await db.capability.upsert({
    where: { id: "demo-capability-laura-mbse-agenda" },
    create: {
      id: "demo-capability-laura-mbse-agenda",
      tenantId,
      title: "Laura can shape a practical MBSE agenda",
      description:
        "Laura can help translate the MBSE discussion into a practical training outline.",
      capabilityType: "EXPERIENCE",
      status: "ACTIVE",
      sensitivity: "NORMAL",
      personId: "demo-person-laura",
      companyId: "demo-company-nordic-industrials",
      noteId: "demo-note-meeting-mbse",
      confidence: 0.82,
      createdByUserId: userId,
      updatedByUserId: userId,
    },
    update: {
      title: "Laura can shape a practical MBSE agenda",
      description:
        "Laura can help translate the MBSE discussion into a practical training outline.",
      capabilityType: "EXPERIENCE",
      status: "ACTIVE",
      sensitivity: "NORMAL",
      confidence: 0.82,
      updatedByUserId: userId,
    },
  });

  const commitment = await db.commitment.upsert({
    where: { id: "demo-commitment-send-mbse-agenda" },
    create: {
      id: "demo-commitment-send-mbse-agenda",
      tenantId,
      ownerType: "ME",
      counterpartyPersonId: "demo-person-peter",
      counterpartyCompanyId: "demo-company-vestas-energy",
      title: "Send sample three-day MBSE agenda",
      description:
        "Prepare and send a practical three-day training outline for Peter.",
      dueAt: new Date("2026-02-10T09:00:00.000Z"),
      dueWindowStart: new Date("2026-02-09T00:00:00.000Z"),
      dueWindowEnd: new Date("2026-02-13T23:59:59.000Z"),
      status: "OPEN",
      sensitivity: "NORMAL",
      meetingId: "demo-meeting-mbse-readiness",
      noteId: "demo-note-meeting-mbse",
      createdByUserId: userId,
      updatedByUserId: userId,
    },
    update: {
      title: "Send sample three-day MBSE agenda",
      description:
        "Prepare and send a practical three-day training outline for Peter.",
      dueAt: new Date("2026-02-10T09:00:00.000Z"),
      dueWindowStart: new Date("2026-02-09T00:00:00.000Z"),
      dueWindowEnd: new Date("2026-02-13T23:59:59.000Z"),
      status: "OPEN",
      sensitivity: "NORMAL",
      updatedByUserId: userId,
    },
  });

  const introductionSuggestion = await db.introductionSuggestion.upsert({
    where: { id: "demo-introduction-laura-peter-mbse" },
    create: {
      id: "demo-introduction-laura-peter-mbse",
      tenantId,
      needId: need.id,
      capabilityId: capability.id,
      fromPersonId: "demo-person-laura",
      toPersonId: "demo-person-peter",
      fromCompanyId: "demo-company-nordic-industrials",
      toCompanyId: "demo-company-vestas-energy",
      rationale:
        "Laura can help turn Peter's MBSE training need into a practical agenda.",
      confidence: 0.78,
      status: "PROPOSED",
      createdByUserId: userId,
      updatedByUserId: userId,
    },
    update: {
      needId: need.id,
      capabilityId: capability.id,
      rationale:
        "Laura can help turn Peter's MBSE training need into a practical agenda.",
      confidence: 0.78,
      status: "PROPOSED",
      updatedByUserId: userId,
    },
  });

  const task = await db.task.upsert({
    where: { id: "demo-task-follow-up-peter-mbse-agenda" },
    create: {
      id: "demo-task-follow-up-peter-mbse-agenda",
      tenantId,
      title: "Follow up with Peter about MBSE agenda",
      description:
        "Share the draft agenda and ask whether it matches the training need.",
      status: "OPEN",
      priority: "HIGH",
      taskType: "COMMITMENT",
      dueAt: new Date("2026-02-10T09:00:00.000Z"),
      reminderAt: new Date("2026-02-09T09:00:00.000Z"),
      whyNowRationale:
        "Peter asked for a practical MBSE agenda in the readiness discussion.",
      confidence: 0.84,
      personId: "demo-person-peter",
      companyId: "demo-company-vestas-energy",
      meetingId: "demo-meeting-mbse-readiness",
      noteId: "demo-note-meeting-mbse",
      commitmentId: commitment.id,
      introductionSuggestionId: introductionSuggestion.id,
      createdByUserId: userId,
      updatedByUserId: userId,
    },
    update: {
      title: "Follow up with Peter about MBSE agenda",
      description:
        "Share the draft agenda and ask whether it matches the training need.",
      status: "OPEN",
      priority: "HIGH",
      taskType: "COMMITMENT",
      dueAt: new Date("2026-02-10T09:00:00.000Z"),
      reminderAt: new Date("2026-02-09T09:00:00.000Z"),
      whyNowRationale:
        "Peter asked for a practical MBSE agenda in the readiness discussion.",
      confidence: 0.84,
      commitmentId: commitment.id,
      introductionSuggestionId: introductionSuggestion.id,
      updatedByUserId: userId,
    },
  });

  const sourceReferences = [
    {
      id: "demo-source-meeting-note-to-need",
      sourceEntityType: "NOTE" as const,
      sourceEntityId: "demo-note-meeting-mbse",
      targetEntityType: "NEED" as const,
      targetEntityId: need.id,
      label: "need-evidence",
      reason: "Meeting note captures Peter's practical MBSE training need.",
      confidence: 0.88,
    },
    {
      id: "demo-source-meeting-note-to-commitment",
      sourceEntityType: "NOTE" as const,
      sourceEntityId: "demo-note-meeting-mbse",
      targetEntityType: "COMMITMENT" as const,
      targetEntityId: commitment.id,
      label: "commitment-evidence",
      reason: "Meeting note captures the promised follow-up agenda.",
      confidence: 0.84,
    },
    {
      id: "demo-source-meeting-note-to-capability",
      sourceEntityType: "NOTE" as const,
      sourceEntityId: "demo-note-meeting-mbse",
      targetEntityType: "CAPABILITY" as const,
      targetEntityId: capability.id,
      label: "capability-evidence",
      reason: "Meeting note indicates Laura can help shape the agenda.",
      confidence: 0.82,
    },
    {
      id: "demo-source-need-to-introduction",
      sourceEntityType: "NEED" as const,
      sourceEntityId: need.id,
      targetEntityType: "INTRODUCTION_SUGGESTION" as const,
      targetEntityId: introductionSuggestion.id,
      label: "brokerage-rationale",
      reason: "The introduction suggestion is grounded in Peter's need.",
      confidence: 0.78,
    },
    {
      id: "demo-source-commitment-to-task",
      sourceEntityType: "COMMITMENT" as const,
      sourceEntityId: commitment.id,
      targetEntityType: "TASK" as const,
      targetEntityId: task.id,
      label: "task-from-commitment",
      reason: "The task tracks the follow-up required by the commitment.",
      confidence: 0.84,
    },
  ];

  await Promise.all(
    sourceReferences.map((sourceReference) =>
      db.sourceReference.upsert({
        where: { id: sourceReference.id },
        create: {
          ...sourceReference,
          tenantId,
          createdByUserId: userId,
        },
        update: {
          label: sourceReference.label,
          reason: sourceReference.reason,
          confidence: sourceReference.confidence,
        },
      }),
    ),
  );

  return {
    tenantId,
    userId,
  };
}
