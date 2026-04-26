import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type ArchiveClient = PrismaClient | Prisma.TransactionClient;

export const ARCHIVE_RECORD_TYPES = [
  "people",
  "companies",
  "companyAffiliations",
  "meetings",
  "notes",
  "tasks",
  "commitments",
  "needs",
  "capabilities",
  "introductionSuggestions",
  "aiProposals",
  "voiceNotes",
] as const;

export type ArchiveRecordType = (typeof ARCHIVE_RECORD_TYPES)[number];

export type ArchiveRecordFilter = ArchiveRecordType | "all";

export type ArchivedByActor = {
  displayName: string;
  email: string | null;
  id: string | null;
};

export type ArchivedRecordSummary = {
  archivedAt: Date;
  archivedBy: ArchivedByActor | null;
  badges: string[];
  description: string | null;
  href: string | null;
  id: string;
  recordType: ArchiveRecordType;
  sensitivity: string | null;
  status: string | null;
  title: string;
  voiceRetention: {
    audioRetentionStatus: string;
    rawAudioDeletedAt: Date | null;
    retentionExpiresAt: Date | null;
    transcriptPresent: boolean;
    editedTranscriptPresent: boolean;
  } | null;
};

export type ArchivedRecordList = {
  records: ArchivedRecordSummary[];
  truncated: boolean;
};

export type RestoredArchivedRecord = {
  affectedPaths: string[];
  changedFields: string[];
  entityType: string;
  id: string;
  previousArchivedAt: Date;
  recordType: ArchiveRecordType;
  relationshipStatusChange?: {
    from: string;
    to: string;
  };
};

type ArchivedRecordWithoutActor = Omit<ArchivedRecordSummary, "archivedBy">;

const archiveConfig = {
  aiProposals: {
    archivedAction: "ai_proposal.dismissed",
    entityType: "AIProposal",
    label: "AI proposal",
    restoredAction: "ai_proposal.restored",
  },
  capabilities: {
    archivedAction: "capability.archived",
    entityType: "Capability",
    label: "Capability",
    restoredAction: "capability.restored",
  },
  commitments: {
    archivedAction: "commitment.archived",
    entityType: "Commitment",
    label: "Commitment",
    restoredAction: "commitment.restored",
  },
  companies: {
    archivedAction: "company.archived",
    entityType: "Company",
    label: "Company",
    restoredAction: "company.restored",
  },
  companyAffiliations: {
    archivedAction: "company_affiliation.archived",
    entityType: "CompanyAffiliation",
    label: "Company affiliation",
    restoredAction: "company_affiliation.restored",
  },
  introductionSuggestions: {
    archivedAction: "introduction_suggestion.archived",
    entityType: "IntroductionSuggestion",
    label: "Introduction suggestion",
    restoredAction: "introduction_suggestion.restored",
  },
  meetings: {
    archivedAction: "meeting.archived",
    entityType: "Meeting",
    label: "Meeting",
    restoredAction: "meeting.restored",
  },
  needs: {
    archivedAction: "need.archived",
    entityType: "Need",
    label: "Need",
    restoredAction: "need.restored",
  },
  notes: {
    archivedAction: "note.archived",
    entityType: "Note",
    label: "Note",
    restoredAction: "note.restored",
  },
  people: {
    archivedAction: "person.archived",
    entityType: "Person",
    label: "Person",
    restoredAction: "person.restored",
  },
  tasks: {
    archivedAction: "task.archived",
    entityType: "Task",
    label: "Task",
    restoredAction: "task.restored",
  },
  voiceNotes: {
    archivedAction: "voice_note.archived",
    entityType: "VoiceNote",
    label: "Voice note",
    restoredAction: "voice_note.restored",
  },
} satisfies Record<
  ArchiveRecordType,
  {
    archivedAction: string;
    entityType: string;
    label: string;
    restoredAction: string;
  }
>;

export function archiveRecordTypeLabel(recordType: ArchiveRecordType) {
  return archiveConfig[recordType].label;
}

export function archiveRecordEntityType(recordType: ArchiveRecordType) {
  return archiveConfig[recordType].entityType;
}

export function archiveRecordRestoreAction(recordType: ArchiveRecordType) {
  return archiveConfig[recordType].restoredAction;
}

function baseRecord(input: {
  archivedAt: Date;
  badges?: string[];
  description?: string | null;
  href?: string | null;
  id: string;
  recordType: ArchiveRecordType;
  sensitivity?: string | null;
  status?: string | null;
  title: string;
  voiceRetention?: ArchivedRecordSummary["voiceRetention"];
}): ArchivedRecordWithoutActor {
  return {
    archivedAt: input.archivedAt,
    badges: input.badges ?? [],
    description: input.description ?? null,
    href: input.href ?? null,
    id: input.id,
    recordType: input.recordType,
    sensitivity: input.sensitivity ?? null,
    status: input.status ?? null,
    title: input.title,
    voiceRetention: input.voiceRetention ?? null,
  };
}

function requireArchivedDate(value: Date | null) {
  if (!value) {
    throw new Error("Archive query returned a record without archivedAt");
  }

  return value;
}

function noteTitle(note: {
  id: string;
  noteType: string;
  sourceType: string;
  summary: string | null;
}) {
  return note.summary?.trim() || `${note.noteType} note`;
}

function affiliationTitle(affiliation: {
  affiliationTitle: string | null;
  company: { name: string } | null;
  department: string | null;
  person: { displayName: string } | null;
}) {
  const person = affiliation.person?.displayName ?? "Person";
  const company = affiliation.company?.name ?? "Company";
  const title = affiliation.affiliationTitle ?? affiliation.department;

  return title ? `${person} at ${company} (${title})` : `${person} at ${company}`;
}

function introductionTitle(suggestion: {
  capability: { title: string } | null;
  fromCompany: { name: string } | null;
  fromPerson: { displayName: string } | null;
  need: { title: string } | null;
  toCompany: { name: string } | null;
  toPerson: { displayName: string } | null;
}) {
  if (suggestion.need && suggestion.capability) {
    return `${suggestion.need.title} <> ${suggestion.capability.title}`;
  }

  const from =
    suggestion.fromPerson?.displayName ?? suggestion.fromCompany?.name ?? null;
  const to = suggestion.toPerson?.displayName ?? suggestion.toCompany?.name ?? null;

  if (from && to) {
    return `${from} <> ${to}`;
  }

  return "Introduction suggestion";
}

async function listPeople(
  tenantId: string,
  take: number,
  db: ArchiveClient,
) {
  const records = await db.person.findMany({
    orderBy: {
      archivedAt: "desc",
    },
    select: {
      archivedAt: true,
      displayName: true,
      email: true,
      id: true,
      jobTitle: true,
      relationshipStatus: true,
      relationshipTemperature: true,
    },
    take,
    where: {
      archivedAt: {
        not: null,
      },
      tenantId,
    },
  });

  return records.map((record) =>
    baseRecord({
      archivedAt: requireArchivedDate(record.archivedAt),
      badges: [record.relationshipTemperature],
      description: record.email ?? record.jobTitle,
      id: record.id,
      recordType: "people",
      status: record.relationshipStatus,
      title: record.displayName,
    }),
  );
}

async function listCompanies(
  tenantId: string,
  take: number,
  db: ArchiveClient,
) {
  const records = await db.company.findMany({
    orderBy: {
      archivedAt: "desc",
    },
    select: {
      archivedAt: true,
      id: true,
      industry: true,
      name: true,
      website: true,
    },
    take,
    where: {
      archivedAt: {
        not: null,
      },
      tenantId,
    },
  });

  return records.map((record) =>
    baseRecord({
      archivedAt: requireArchivedDate(record.archivedAt),
      description: record.website ?? record.industry,
      id: record.id,
      recordType: "companies",
      title: record.name,
    }),
  );
}

async function listCompanyAffiliations(
  tenantId: string,
  take: number,
  db: ArchiveClient,
) {
  const records = await db.companyAffiliation.findMany({
    include: {
      company: {
        select: {
          name: true,
        },
      },
      person: {
        select: {
          displayName: true,
        },
      },
    },
    orderBy: {
      archivedAt: "desc",
    },
    take,
    where: {
      archivedAt: {
        not: null,
      },
      tenantId,
    },
  });

  return records.map((record) =>
    baseRecord({
      archivedAt: requireArchivedDate(record.archivedAt),
      description: record.isPrimary ? "Primary affiliation" : record.department,
      id: record.id,
      recordType: "companyAffiliations",
      status: record.endsAt ? "ENDED" : "ACTIVE",
      title: affiliationTitle(record),
    }),
  );
}

async function listMeetings(
  tenantId: string,
  take: number,
  db: ArchiveClient,
) {
  const records = await db.meeting.findMany({
    orderBy: {
      archivedAt: "desc",
    },
    select: {
      archivedAt: true,
      id: true,
      occurredAt: true,
      sourceType: true,
      title: true,
    },
    take,
    where: {
      archivedAt: {
        not: null,
      },
      tenantId,
    },
  });

  return records.map((record) =>
    baseRecord({
      archivedAt: requireArchivedDate(record.archivedAt),
      badges: [record.sourceType],
      description: record.occurredAt?.toISOString() ?? null,
      id: record.id,
      recordType: "meetings",
      title: record.title,
    }),
  );
}

async function listNotes(tenantId: string, take: number, db: ArchiveClient) {
  const records = await db.note.findMany({
    orderBy: {
      archivedAt: "desc",
    },
    select: {
      archivedAt: true,
      id: true,
      noteType: true,
      sensitivity: true,
      sourceType: true,
      summary: true,
    },
    take,
    where: {
      archivedAt: {
        not: null,
      },
      tenantId,
    },
  });

  return records.map((record) =>
    baseRecord({
      archivedAt: requireArchivedDate(record.archivedAt),
      badges: [record.sourceType],
      id: record.id,
      recordType: "notes",
      sensitivity: record.sensitivity,
      status: record.noteType,
      title: noteTitle(record),
    }),
  );
}

async function listTasks(tenantId: string, take: number, db: ArchiveClient) {
  const records = await db.task.findMany({
    orderBy: {
      archivedAt: "desc",
    },
    select: {
      archivedAt: true,
      id: true,
      priority: true,
      status: true,
      taskType: true,
      title: true,
    },
    take,
    where: {
      archivedAt: {
        not: null,
      },
      tenantId,
    },
  });

  return records.map((record) =>
    baseRecord({
      archivedAt: requireArchivedDate(record.archivedAt),
      badges: [record.priority, record.taskType],
      id: record.id,
      recordType: "tasks",
      status: record.status,
      title: record.title,
    }),
  );
}

async function listCommitments(
  tenantId: string,
  take: number,
  db: ArchiveClient,
) {
  const records = await db.commitment.findMany({
    orderBy: {
      archivedAt: "desc",
    },
    select: {
      archivedAt: true,
      id: true,
      ownerType: true,
      sensitivity: true,
      status: true,
      title: true,
    },
    take,
    where: {
      archivedAt: {
        not: null,
      },
      tenantId,
    },
  });

  return records.map((record) =>
    baseRecord({
      archivedAt: requireArchivedDate(record.archivedAt),
      badges: [record.ownerType],
      id: record.id,
      recordType: "commitments",
      sensitivity: record.sensitivity,
      status: record.status,
      title: record.title,
    }),
  );
}

async function listNeeds(tenantId: string, take: number, db: ArchiveClient) {
  const records = await db.need.findMany({
    orderBy: {
      archivedAt: "desc",
    },
    select: {
      archivedAt: true,
      id: true,
      needType: true,
      priority: true,
      sensitivity: true,
      status: true,
      title: true,
    },
    take,
    where: {
      archivedAt: {
        not: null,
      },
      tenantId,
    },
  });

  return records.map((record) =>
    baseRecord({
      archivedAt: requireArchivedDate(record.archivedAt),
      badges: [record.priority, record.needType],
      id: record.id,
      recordType: "needs",
      sensitivity: record.sensitivity,
      status: record.status,
      title: record.title,
    }),
  );
}

async function listCapabilities(
  tenantId: string,
  take: number,
  db: ArchiveClient,
) {
  const records = await db.capability.findMany({
    orderBy: {
      archivedAt: "desc",
    },
    select: {
      archivedAt: true,
      capabilityType: true,
      id: true,
      sensitivity: true,
      status: true,
      title: true,
    },
    take,
    where: {
      archivedAt: {
        not: null,
      },
      tenantId,
    },
  });

  return records.map((record) =>
    baseRecord({
      archivedAt: requireArchivedDate(record.archivedAt),
      badges: [record.capabilityType],
      id: record.id,
      recordType: "capabilities",
      sensitivity: record.sensitivity,
      status: record.status,
      title: record.title,
    }),
  );
}

async function listIntroductionSuggestions(
  tenantId: string,
  take: number,
  db: ArchiveClient,
) {
  const records = await db.introductionSuggestion.findMany({
    include: {
      capability: {
        select: {
          title: true,
        },
      },
      fromCompany: {
        select: {
          name: true,
        },
      },
      fromPerson: {
        select: {
          displayName: true,
        },
      },
      need: {
        select: {
          title: true,
        },
      },
      toCompany: {
        select: {
          name: true,
        },
      },
      toPerson: {
        select: {
          displayName: true,
        },
      },
    },
    orderBy: {
      archivedAt: "desc",
    },
    take,
    where: {
      archivedAt: {
        not: null,
      },
      tenantId,
    },
  });

  return records.map((record) =>
    baseRecord({
      archivedAt: requireArchivedDate(record.archivedAt),
      id: record.id,
      recordType: "introductionSuggestions",
      status: record.status,
      title: introductionTitle(record),
    }),
  );
}

async function listAIProposals(
  tenantId: string,
  take: number,
  db: ArchiveClient,
) {
  const records = await db.aIProposal.findMany({
    orderBy: {
      archivedAt: "desc",
    },
    select: {
      archivedAt: true,
      id: true,
      proposalType: true,
      status: true,
      title: true,
    },
    take,
    where: {
      archivedAt: {
        not: null,
      },
      tenantId,
    },
  });

  return records.map((record) =>
    baseRecord({
      archivedAt: requireArchivedDate(record.archivedAt),
      badges: [record.proposalType],
      id: record.id,
      recordType: "aiProposals",
      status: record.status,
      title: record.title,
    }),
  );
}

async function listVoiceNotes(
  tenantId: string,
  take: number,
  db: ArchiveClient,
) {
  const records = await db.voiceNote.findMany({
    orderBy: {
      archivedAt: "desc",
    },
    select: {
      archivedAt: true,
      audioRetentionStatus: true,
      editedTranscriptText: true,
      id: true,
      language: true,
      rawAudioDeletedAt: true,
      retentionExpiresAt: true,
      status: true,
      title: true,
      transcriptText: true,
    },
    take,
    where: {
      archivedAt: {
        not: null,
      },
      tenantId,
    },
  });

  return records.map((record) =>
    baseRecord({
      archivedAt: requireArchivedDate(record.archivedAt),
      badges: record.language ? [record.language] : [],
      id: record.id,
      recordType: "voiceNotes",
      status: record.status,
      title: record.title?.trim() || "Voice note",
      voiceRetention: {
        audioRetentionStatus: record.audioRetentionStatus,
        editedTranscriptPresent: Boolean(record.editedTranscriptText),
        rawAudioDeletedAt: record.rawAudioDeletedAt,
        retentionExpiresAt: record.retentionExpiresAt,
        transcriptPresent: Boolean(record.transcriptText),
      },
    }),
  );
}

async function listRecordsByType(
  recordType: ArchiveRecordType,
  tenantId: string,
  take: number,
  db: ArchiveClient,
) {
  switch (recordType) {
    case "people":
      return listPeople(tenantId, take, db);
    case "companies":
      return listCompanies(tenantId, take, db);
    case "companyAffiliations":
      return listCompanyAffiliations(tenantId, take, db);
    case "meetings":
      return listMeetings(tenantId, take, db);
    case "notes":
      return listNotes(tenantId, take, db);
    case "tasks":
      return listTasks(tenantId, take, db);
    case "commitments":
      return listCommitments(tenantId, take, db);
    case "needs":
      return listNeeds(tenantId, take, db);
    case "capabilities":
      return listCapabilities(tenantId, take, db);
    case "introductionSuggestions":
      return listIntroductionSuggestions(tenantId, take, db);
    case "aiProposals":
      return listAIProposals(tenantId, take, db);
    case "voiceNotes":
      return listVoiceNotes(tenantId, take, db);
  }
}

function actorDisplay(record: {
  actor: { email: string | null; name: string | null } | null;
  actorUserId: string | null;
}) {
  if (!record.actorUserId) {
    return "System";
  }

  return record.actor?.name ?? record.actor?.email ?? "Unknown actor";
}

async function attachArchivedActors(
  tenantId: string,
  records: ArchivedRecordWithoutActor[],
  db: ArchiveClient,
): Promise<ArchivedRecordSummary[]> {
  if (records.length === 0) {
    return [];
  }

  const entityIds = records.map((record) => record.id);
  const archiveActions = ARCHIVE_RECORD_TYPES.map(
    (recordType) => archiveConfig[recordType].archivedAction,
  );
  const logs = await db.auditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      action: true,
      actor: {
        select: {
          email: true,
          name: true,
        },
      },
      actorUserId: true,
      entityId: true,
      entityType: true,
    },
    where: {
      action: {
        in: archiveActions,
      },
      entityId: {
        in: entityIds,
      },
      tenantId,
    },
  });
  const byEntity = new Map<string, ArchivedByActor>();

  for (const log of logs) {
    if (!log.entityId) {
      continue;
    }

    const key = `${log.entityType}:${log.entityId}`;

    if (!byEntity.has(key)) {
      byEntity.set(key, {
        displayName: actorDisplay(log),
        email: log.actor?.email ?? null,
        id: log.actorUserId,
      });
    }
  }

  return records.map((record) => ({
    ...record,
    archivedBy:
      byEntity.get(`${archiveConfig[record.recordType].entityType}:${record.id}`) ??
      null,
  }));
}

export async function listArchivedRecordsForTenant(
  input: {
    limit: number;
    recordType: ArchiveRecordFilter;
    tenantId: string;
  },
  db: ArchiveClient = prisma,
): Promise<ArchivedRecordList> {
  const take = input.limit + 1;
  const recordTypes =
    input.recordType === "all" ? ARCHIVE_RECORD_TYPES : [input.recordType];
  const allRecords = (
    await Promise.all(
      recordTypes.map((recordType) =>
        listRecordsByType(recordType, input.tenantId, take, db),
      ),
    )
  )
    .flat()
    .sort((left, right) => right.archivedAt.getTime() - left.archivedAt.getTime());
  const records = allRecords.slice(0, input.limit);

  return {
    records: await attachArchivedActors(input.tenantId, records, db),
    truncated: allRecords.length > input.limit,
  };
}

function pathsForRestoredRecord(
  recordType: ArchiveRecordType,
  record: {
    companyId?: string | null;
    id: string;
    meetingId?: string | null;
    noteId?: string | null;
    personId?: string | null;
  },
) {
  const paths = new Set<string>(["/settings/archive", "/settings/privacy"]);

  switch (recordType) {
    case "people":
      paths.add("/people");
      paths.add(`/people/${record.id}`);
      break;
    case "companies":
      paths.add("/people/companies");
      paths.add(`/people/companies/${record.id}`);
      break;
    case "companyAffiliations":
      if (record.personId) {
        paths.add(`/people/${record.personId}`);
      }
      if (record.companyId) {
        paths.add(`/people/companies/${record.companyId}`);
      }
      break;
    case "meetings":
      paths.add("/meetings");
      paths.add(`/meetings/${record.id}`);
      break;
    case "notes":
      paths.add("/notes");
      paths.add(`/notes/${record.id}`);
      break;
    case "tasks":
      paths.add("/tasks");
      paths.add(`/tasks/${record.id}`);
      break;
    case "commitments":
      paths.add("/commitments");
      paths.add(`/commitments/${record.id}`);
      break;
    case "needs":
      paths.add("/opportunities");
      paths.add("/opportunities/needs");
      paths.add(`/opportunities/needs/${record.id}`);
      break;
    case "capabilities":
      paths.add("/opportunities");
      paths.add("/opportunities/capabilities");
      paths.add(`/opportunities/capabilities/${record.id}`);
      break;
    case "introductionSuggestions":
      paths.add("/opportunities");
      paths.add("/opportunities/introductions");
      paths.add(`/opportunities/introductions/${record.id}`);
      break;
    case "aiProposals":
      paths.add("/proposals");
      paths.add(`/proposals/${record.id}`);
      paths.add("/today");
      break;
    case "voiceNotes":
      paths.add("/capture");
      paths.add(`/voice-notes/${record.id}`);
      break;
  }

  return [...paths];
}

function restoreResult(input: {
  changedFields?: string[];
  previousArchivedAt: Date;
  record: {
    companyId?: string | null;
    id: string;
    meetingId?: string | null;
    noteId?: string | null;
    personId?: string | null;
  };
  recordType: ArchiveRecordType;
  relationshipStatusChange?:
    | RestoredArchivedRecord["relationshipStatusChange"]
    | undefined;
}): RestoredArchivedRecord {
  const result: RestoredArchivedRecord = {
    affectedPaths: pathsForRestoredRecord(input.recordType, input.record),
    changedFields: input.changedFields ?? ["archivedAt", "updatedByUserId"],
    entityType: archiveConfig[input.recordType].entityType,
    id: input.record.id,
    previousArchivedAt: input.previousArchivedAt,
    recordType: input.recordType,
  };

  if (input.relationshipStatusChange) {
    result.relationshipStatusChange = input.relationshipStatusChange;
  }

  return result;
}

async function restorePerson(
  tenantId: string,
  userId: string,
  recordId: string,
  db: ArchiveClient,
) {
  const existing = await db.person.findFirst({
    select: {
      archivedAt: true,
      id: true,
      relationshipStatus: true,
    },
    where: {
      archivedAt: {
        not: null,
      },
      id: recordId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  const relationshipStatusChange =
    existing.relationshipStatus === "ARCHIVED"
      ? {
          from: "ARCHIVED",
          to: "UNKNOWN",
        }
      : undefined;
  const data: Prisma.PersonUncheckedUpdateInput = {
    archivedAt: null,
    updatedByUserId: userId,
  };

  if (relationshipStatusChange) {
    data.relationshipStatus = "UNKNOWN";
  }

  const record = await db.person.update({
    data,
    select: {
      id: true,
    },
    where: {
      id_tenantId: {
        id: recordId,
        tenantId,
      },
    },
  });

  return restoreResult({
    changedFields: relationshipStatusChange
      ? ["archivedAt", "relationshipStatus", "updatedByUserId"]
      : ["archivedAt", "updatedByUserId"],
    previousArchivedAt: requireArchivedDate(existing.archivedAt),
    record,
    recordType: "people",
    relationshipStatusChange,
  });
}

async function restoreCompany(
  tenantId: string,
  userId: string,
  recordId: string,
  db: ArchiveClient,
) {
  const existing = await db.company.findFirst({
    select: {
      archivedAt: true,
      id: true,
    },
    where: {
      archivedAt: {
        not: null,
      },
      id: recordId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await db.company.update({
    data: {
      archivedAt: null,
      updatedByUserId: userId,
    },
    select: {
      id: true,
    },
    where: {
      id_tenantId: {
        id: recordId,
        tenantId,
      },
    },
  });

  return restoreResult({
    previousArchivedAt: requireArchivedDate(existing.archivedAt),
    record,
    recordType: "companies",
  });
}

async function restoreCompanyAffiliation(
  tenantId: string,
  userId: string,
  recordId: string,
  db: ArchiveClient,
) {
  const existing = await db.companyAffiliation.findFirst({
    select: {
      archivedAt: true,
      companyId: true,
      id: true,
      personId: true,
    },
    where: {
      archivedAt: {
        not: null,
      },
      id: recordId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await db.companyAffiliation.update({
    data: {
      archivedAt: null,
      updatedByUserId: userId,
    },
    select: {
      companyId: true,
      id: true,
      personId: true,
    },
    where: {
      id_tenantId: {
        id: recordId,
        tenantId,
      },
    },
  });

  return restoreResult({
    previousArchivedAt: requireArchivedDate(existing.archivedAt),
    record,
    recordType: "companyAffiliations",
  });
}

async function restoreMeeting(
  tenantId: string,
  userId: string,
  recordId: string,
  db: ArchiveClient,
) {
  const existing = await db.meeting.findFirst({
    select: {
      archivedAt: true,
      id: true,
    },
    where: {
      archivedAt: {
        not: null,
      },
      id: recordId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await db.meeting.update({
    data: {
      archivedAt: null,
      updatedByUserId: userId,
    },
    select: {
      id: true,
    },
    where: {
      id_tenantId: {
        id: recordId,
        tenantId,
      },
    },
  });

  return restoreResult({
    previousArchivedAt: requireArchivedDate(existing.archivedAt),
    record,
    recordType: "meetings",
  });
}

async function restoreNote(
  tenantId: string,
  userId: string,
  recordId: string,
  db: ArchiveClient,
) {
  const existing = await db.note.findFirst({
    select: {
      archivedAt: true,
      id: true,
    },
    where: {
      archivedAt: {
        not: null,
      },
      id: recordId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await db.note.update({
    data: {
      archivedAt: null,
      updatedByUserId: userId,
    },
    select: {
      id: true,
    },
    where: {
      id_tenantId: {
        id: recordId,
        tenantId,
      },
    },
  });

  return restoreResult({
    previousArchivedAt: requireArchivedDate(existing.archivedAt),
    record,
    recordType: "notes",
  });
}

async function restoreTask(
  tenantId: string,
  userId: string,
  recordId: string,
  db: ArchiveClient,
) {
  const existing = await db.task.findFirst({
    select: {
      archivedAt: true,
      id: true,
    },
    where: {
      archivedAt: {
        not: null,
      },
      id: recordId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await db.task.update({
    data: {
      archivedAt: null,
      updatedByUserId: userId,
    },
    select: {
      id: true,
    },
    where: {
      id_tenantId: {
        id: recordId,
        tenantId,
      },
    },
  });

  return restoreResult({
    previousArchivedAt: requireArchivedDate(existing.archivedAt),
    record,
    recordType: "tasks",
  });
}

async function restoreCommitment(
  tenantId: string,
  userId: string,
  recordId: string,
  db: ArchiveClient,
) {
  const existing = await db.commitment.findFirst({
    select: {
      archivedAt: true,
      id: true,
    },
    where: {
      archivedAt: {
        not: null,
      },
      id: recordId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await db.commitment.update({
    data: {
      archivedAt: null,
      updatedByUserId: userId,
    },
    select: {
      id: true,
    },
    where: {
      id_tenantId: {
        id: recordId,
        tenantId,
      },
    },
  });

  return restoreResult({
    previousArchivedAt: requireArchivedDate(existing.archivedAt),
    record,
    recordType: "commitments",
  });
}

async function restoreNeed(
  tenantId: string,
  userId: string,
  recordId: string,
  db: ArchiveClient,
) {
  const existing = await db.need.findFirst({
    select: {
      archivedAt: true,
      id: true,
    },
    where: {
      archivedAt: {
        not: null,
      },
      id: recordId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await db.need.update({
    data: {
      archivedAt: null,
      updatedByUserId: userId,
    },
    select: {
      id: true,
    },
    where: {
      id_tenantId: {
        id: recordId,
        tenantId,
      },
    },
  });

  return restoreResult({
    previousArchivedAt: requireArchivedDate(existing.archivedAt),
    record,
    recordType: "needs",
  });
}

async function restoreCapability(
  tenantId: string,
  userId: string,
  recordId: string,
  db: ArchiveClient,
) {
  const existing = await db.capability.findFirst({
    select: {
      archivedAt: true,
      id: true,
    },
    where: {
      archivedAt: {
        not: null,
      },
      id: recordId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await db.capability.update({
    data: {
      archivedAt: null,
      updatedByUserId: userId,
    },
    select: {
      id: true,
    },
    where: {
      id_tenantId: {
        id: recordId,
        tenantId,
      },
    },
  });

  return restoreResult({
    previousArchivedAt: requireArchivedDate(existing.archivedAt),
    record,
    recordType: "capabilities",
  });
}

async function restoreIntroductionSuggestion(
  tenantId: string,
  userId: string,
  recordId: string,
  db: ArchiveClient,
) {
  const existing = await db.introductionSuggestion.findFirst({
    select: {
      archivedAt: true,
      id: true,
    },
    where: {
      archivedAt: {
        not: null,
      },
      id: recordId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await db.introductionSuggestion.update({
    data: {
      archivedAt: null,
      updatedByUserId: userId,
    },
    select: {
      id: true,
    },
    where: {
      id_tenantId: {
        id: recordId,
        tenantId,
      },
    },
  });

  return restoreResult({
    previousArchivedAt: requireArchivedDate(existing.archivedAt),
    record,
    recordType: "introductionSuggestions",
  });
}

async function restoreAIProposal(
  tenantId: string,
  recordId: string,
  db: ArchiveClient,
) {
  const existing = await db.aIProposal.findFirst({
    select: {
      archivedAt: true,
      id: true,
    },
    where: {
      archivedAt: {
        not: null,
      },
      id: recordId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await db.aIProposal.update({
    data: {
      archivedAt: null,
    },
    select: {
      id: true,
    },
    where: {
      id_tenantId: {
        id: recordId,
        tenantId,
      },
    },
  });

  return restoreResult({
    changedFields: ["archivedAt"],
    previousArchivedAt: requireArchivedDate(existing.archivedAt),
    record,
    recordType: "aiProposals",
  });
}

async function restoreVoiceNote(
  tenantId: string,
  userId: string,
  recordId: string,
  db: ArchiveClient,
) {
  const existing = await db.voiceNote.findFirst({
    select: {
      archivedAt: true,
      id: true,
    },
    where: {
      archivedAt: {
        not: null,
      },
      id: recordId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await db.voiceNote.update({
    data: {
      archivedAt: null,
      updatedByUserId: userId,
    },
    select: {
      id: true,
    },
    where: {
      id_tenantId: {
        id: recordId,
        tenantId,
      },
    },
  });

  return restoreResult({
    previousArchivedAt: requireArchivedDate(existing.archivedAt),
    record,
    recordType: "voiceNotes",
  });
}

export async function restoreArchivedRecordForTenant(
  input: {
    recordId: string;
    recordType: ArchiveRecordType;
    tenantId: string;
    userId: string;
  },
  db: ArchiveClient = prisma,
) {
  switch (input.recordType) {
    case "people":
      return restorePerson(input.tenantId, input.userId, input.recordId, db);
    case "companies":
      return restoreCompany(input.tenantId, input.userId, input.recordId, db);
    case "companyAffiliations":
      return restoreCompanyAffiliation(
        input.tenantId,
        input.userId,
        input.recordId,
        db,
      );
    case "meetings":
      return restoreMeeting(input.tenantId, input.userId, input.recordId, db);
    case "notes":
      return restoreNote(input.tenantId, input.userId, input.recordId, db);
    case "tasks":
      return restoreTask(input.tenantId, input.userId, input.recordId, db);
    case "commitments":
      return restoreCommitment(input.tenantId, input.userId, input.recordId, db);
    case "needs":
      return restoreNeed(input.tenantId, input.userId, input.recordId, db);
    case "capabilities":
      return restoreCapability(input.tenantId, input.userId, input.recordId, db);
    case "introductionSuggestions":
      return restoreIntroductionSuggestion(
        input.tenantId,
        input.userId,
        input.recordId,
        db,
      );
    case "aiProposals":
      return restoreAIProposal(input.tenantId, input.recordId, db);
    case "voiceNotes":
      return restoreVoiceNote(input.tenantId, input.userId, input.recordId, db);
  }
}
