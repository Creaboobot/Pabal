import { prisma } from "@/server/db/prisma";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export type AppShellSummary = Awaited<ReturnType<typeof getAppShellSummary>>;

export async function getAppShellSummary(context: TenantContext) {
  await requireTenantAccess(context);

  const now = new Date();

  const [
    openTasks,
    openCommitments,
    upcomingMeetings,
    pendingProposals,
    people,
    companies,
    notes,
    voiceNotes,
    needs,
    capabilities,
    introductionSuggestions,
  ] = await Promise.all([
    prisma.task.count({
      where: {
        tenantId: context.tenantId,
        archivedAt: null,
        status: {
          in: ["OPEN", "SNOOZED"],
        },
      },
    }),
    prisma.commitment.count({
      where: {
        tenantId: context.tenantId,
        archivedAt: null,
        status: {
          in: ["OPEN", "WAITING", "OVERDUE"],
        },
      },
    }),
    prisma.meeting.count({
      where: {
        tenantId: context.tenantId,
        archivedAt: null,
        occurredAt: {
          gte: now,
        },
      },
    }),
    prisma.aIProposal.count({
      where: {
        tenantId: context.tenantId,
        archivedAt: null,
        status: {
          in: ["PENDING_REVIEW", "IN_REVIEW"],
        },
      },
    }),
    prisma.person.count({
      where: {
        tenantId: context.tenantId,
        archivedAt: null,
      },
    }),
    prisma.company.count({
      where: {
        tenantId: context.tenantId,
        archivedAt: null,
      },
    }),
    prisma.note.count({
      where: {
        tenantId: context.tenantId,
        archivedAt: null,
      },
    }),
    prisma.voiceNote.count({
      where: {
        tenantId: context.tenantId,
        archivedAt: null,
      },
    }),
    prisma.need.count({
      where: {
        tenantId: context.tenantId,
        archivedAt: null,
        status: {
          in: ["OPEN", "IN_PROGRESS", "PARKED"],
        },
      },
    }),
    prisma.capability.count({
      where: {
        tenantId: context.tenantId,
        archivedAt: null,
        status: {
          in: ["ACTIVE", "PARKED"],
        },
      },
    }),
    prisma.introductionSuggestion.count({
      where: {
        tenantId: context.tenantId,
        archivedAt: null,
        status: {
          in: ["PROPOSED", "ACCEPTED", "OPT_IN_REQUESTED", "INTRO_SENT"],
        },
      },
    }),
  ]);

  return {
    action: {
      openTasks,
      openCommitments,
      pendingProposals,
      upcomingMeetings,
    },
    capture: {
      notes,
      voiceNotes,
      pendingProposals,
    },
    people: {
      people,
      companies,
    },
    opportunities: {
      needs,
      capabilities,
      introductionSuggestions,
    },
  };
}
