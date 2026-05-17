import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

const SEARCH_QUERY_MAX_LENGTH = 120;
const SEARCH_GROUP_LIMIT = 5;

const searchQuerySchema = z
  .string()
  .trim()
  .transform((value) =>
    value.replace(/\s+/g, " ").slice(0, SEARCH_QUERY_MAX_LENGTH),
  );

export type StructuredSearchResultKind =
  | "people"
  | "companies"
  | "meetings"
  | "notes"
  | "tasks"
  | "commitments"
  | "needs"
  | "capabilities"
  | "proposals"
  | "voiceNotes";

export type StructuredSearchResult = {
  badges: string[];
  description: string;
  href: string;
  id: string;
  kind: StructuredSearchResultKind;
  title: string;
  updatedAt: Date;
};

export type StructuredSearchGroup = {
  kind: StructuredSearchResultKind;
  label: string;
  results: StructuredSearchResult[];
};

export type StructuredSearchResponse = {
  boundary: {
    usesAI: false;
    usesEmbeddings: false;
    usesExternalSearch: false;
    usesSemanticRanking: false;
  };
  groups: StructuredSearchGroup[];
  query: string;
  resultCount: number;
};

const groupLabels: Record<StructuredSearchResultKind, string> = {
  capabilities: "Capabilities",
  commitments: "Commitments",
  companies: "Companies",
  meetings: "Meetings",
  needs: "Needs",
  notes: "Notes",
  people: "People",
  proposals: "Suggested updates",
  tasks: "Tasks",
  voiceNotes: "Voice notes",
};

function normalizeSearchQuery(rawQuery: string | undefined) {
  return searchQuerySchema.parse(rawQuery ?? "");
}

function preview(value: string | null | undefined, fallback = "No preview.") {
  const text = value?.trim() || fallback;

  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

function groupsFromResults(
  resultsByKind: Record<StructuredSearchResultKind, StructuredSearchResult[]>,
): StructuredSearchGroup[] {
  return (Object.keys(groupLabels) as StructuredSearchResultKind[])
    .map((kind) => ({
      kind,
      label: groupLabels[kind],
      results: resultsByKind[kind],
    }))
    .filter((group) => group.results.length > 0);
}

export async function getTenantStructuredSearch(
  context: TenantContext,
  rawQuery: string | undefined,
): Promise<StructuredSearchResponse> {
  await requireTenantAccess(context);

  const query = normalizeSearchQuery(rawQuery);
  const boundary = {
    usesAI: false,
    usesEmbeddings: false,
    usesExternalSearch: false,
    usesSemanticRanking: false,
  } as const;

  if (!query) {
    return {
      boundary,
      groups: [],
      query,
      resultCount: 0,
    };
  }

  const contains = {
    contains: query,
    mode: "insensitive" as const,
  };

  const [
    people,
    companies,
    meetings,
    notes,
    tasks,
    commitments,
    needs,
    capabilities,
    proposals,
    voiceNotes,
  ] = await Promise.all([
    prisma.person.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: SEARCH_GROUP_LIMIT,
      where: {
        archivedAt: null,
        tenantId: context.tenantId,
        OR: [
          { displayName: contains },
          { email: contains },
          { firstName: contains },
          { jobTitle: contains },
          { lastName: contains },
        ],
      },
    }),
    prisma.company.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: SEARCH_GROUP_LIMIT,
      where: {
        archivedAt: null,
        tenantId: context.tenantId,
        OR: [
          { description: contains },
          { industry: contains },
          { name: contains },
          { website: contains },
        ],
      },
    }),
    prisma.meeting.findMany({
      orderBy: [{ occurredAt: "desc" }, { updatedAt: "desc" }],
      take: SEARCH_GROUP_LIMIT,
      where: {
        archivedAt: null,
        tenantId: context.tenantId,
        OR: [{ location: contains }, { summary: contains }, { title: contains }],
      },
    }),
    prisma.note.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: SEARCH_GROUP_LIMIT,
      where: {
        archivedAt: null,
        tenantId: context.tenantId,
        OR: [{ body: contains }, { summary: contains }],
      },
    }),
    prisma.task.findMany({
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: SEARCH_GROUP_LIMIT,
      where: {
        archivedAt: null,
        tenantId: context.tenantId,
        OR: [
          { description: contains },
          { title: contains },
          { whyNowRationale: contains },
        ],
      },
    }),
    prisma.commitment.findMany({
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: SEARCH_GROUP_LIMIT,
      where: {
        archivedAt: null,
        tenantId: context.tenantId,
        OR: [{ description: contains }, { title: contains }],
      },
    }),
    prisma.need.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: SEARCH_GROUP_LIMIT,
      where: {
        archivedAt: null,
        tenantId: context.tenantId,
        OR: [{ description: contains }, { title: contains }],
      },
    }),
    prisma.capability.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: SEARCH_GROUP_LIMIT,
      where: {
        archivedAt: null,
        tenantId: context.tenantId,
        OR: [{ description: contains }, { title: contains }],
      },
    }),
    prisma.aIProposal.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: SEARCH_GROUP_LIMIT,
      where: {
        archivedAt: null,
        tenantId: context.tenantId,
        OR: [
          { explanation: contains },
          { summary: contains },
          { title: contains },
        ],
      },
    }),
    prisma.voiceNote.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: SEARCH_GROUP_LIMIT,
      where: {
        archivedAt: null,
        tenantId: context.tenantId,
        OR: [
          { editedTranscriptText: contains },
          { title: contains },
          { transcriptText: contains },
        ],
      },
    }),
  ]);

  const resultsByKind: Record<
    StructuredSearchResultKind,
    StructuredSearchResult[]
  > = {
    capabilities: capabilities.map((capability) => ({
      badges: [capability.status, capability.capabilityType],
      description: preview(capability.description),
      href: `/opportunities/capabilities/${capability.id}`,
      id: capability.id,
      kind: "capabilities",
      title: capability.title,
      updatedAt: capability.updatedAt,
    })),
    commitments: commitments.map((commitment) => ({
      badges: [commitment.status, commitment.sensitivity],
      description: preview(commitment.description),
      href: `/commitments/${commitment.id}`,
      id: commitment.id,
      kind: "commitments",
      title: commitment.title,
      updatedAt: commitment.updatedAt,
    })),
    companies: companies.map((company) => ({
      badges: [company.industry ?? "Company"],
      description: preview(company.description ?? company.website),
      href: `/people/companies/${company.id}`,
      id: company.id,
      kind: "companies",
      title: company.name,
      updatedAt: company.updatedAt,
    })),
    meetings: meetings.map((meeting) => ({
      badges: [meeting.sourceType],
      description: preview(meeting.summary ?? meeting.location),
      href: `/meetings/${meeting.id}`,
      id: meeting.id,
      kind: "meetings",
      title: meeting.title,
      updatedAt: meeting.updatedAt,
    })),
    needs: needs.map((need) => ({
      badges: [need.status, need.priority],
      description: preview(need.description),
      href: `/opportunities/needs/${need.id}`,
      id: need.id,
      kind: "needs",
      title: need.title,
      updatedAt: need.updatedAt,
    })),
    notes: notes.map((note) => ({
      badges: [note.noteType, note.sourceType, note.sensitivity],
      description: preview(note.summary ?? note.body),
      href: `/notes/${note.id}`,
      id: note.id,
      kind: "notes",
      title: note.summary ? "Note summary" : "Note",
      updatedAt: note.updatedAt,
    })),
    people: people.map((person) => ({
      badges: [person.relationshipStatus, person.relationshipTemperature],
      description: preview(person.jobTitle ?? person.email, "Person record"),
      href: `/people/${person.id}`,
      id: person.id,
      kind: "people",
      title: person.displayName,
      updatedAt: person.updatedAt,
    })),
    proposals: proposals.map((proposal) => ({
      badges: [proposal.status, proposal.proposalType],
      description: preview(proposal.summary ?? proposal.explanation),
      href: `/proposals/${proposal.id}`,
      id: proposal.id,
      kind: "proposals",
      title: proposal.title,
      updatedAt: proposal.updatedAt,
    })),
    tasks: tasks.map((task) => ({
      badges: [task.status, task.priority],
      description: preview(task.description ?? task.whyNowRationale),
      href: `/tasks/${task.id}`,
      id: task.id,
      kind: "tasks",
      title: task.title,
      updatedAt: task.updatedAt,
    })),
    voiceNotes: voiceNotes.map((voiceNote) => ({
      badges: [voiceNote.status, voiceNote.audioRetentionStatus],
      description: preview(
        voiceNote.editedTranscriptText ?? voiceNote.transcriptText,
        "Voice note transcript unavailable.",
      ),
      href: `/voice-notes/${voiceNote.id}`,
      id: voiceNote.id,
      kind: "voiceNotes",
      title: voiceNote.title ?? "Voice note",
      updatedAt: voiceNote.updatedAt,
    })),
  };

  const groups = groupsFromResults(resultsByKind);

  return {
    boundary,
    groups,
    query,
    resultCount: groups.reduce((total, group) => total + group.results.length, 0),
  };
}
