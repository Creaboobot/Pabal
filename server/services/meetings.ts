import {
  type MeetingParticipantRole,
  type RecordSourceType,
} from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { findCompanyById } from "@/server/repositories/companies";
import {
  createMeetingParticipant,
  deleteMeetingParticipant,
  findKnownPersonMeetingParticipant,
  findMeetingParticipantById,
} from "@/server/repositories/meeting-participants";
import {
  createMeeting,
  findMeetingById,
  findMeetingProfileById,
  listMeetingsForTenantWithSummaries,
  updateMeeting,
} from "@/server/repositories/meetings";
import { findPersonById } from "@/server/repositories/people";
import { writeAuditLog } from "@/server/services/audit-log";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

type MeetingMutationInput = {
  endedAt?: Date | null;
  location?: string | null;
  occurredAt?: Date | null;
  primaryCompanyId?: string | null;
  sourceType?: RecordSourceType;
  summary?: string | null;
  title: string;
};

type MeetingParticipantMutationInput = {
  companyId?: string | null;
  emailSnapshot?: string | null;
  meetingId: string;
  nameSnapshot?: string | null;
  participantRole?: MeetingParticipantRole;
  personId?: string | null;
};

export class DuplicateMeetingParticipantError extends Error {
  constructor(meetingId: string, personId: string) {
    super(`Person ${personId} is already a participant in meeting ${meetingId}`);
    this.name = "DuplicateMeetingParticipantError";
  }
}

export class InvalidMeetingParticipantInputError extends Error {
  constructor() {
    super("Meeting participant requires a known person or snapshot");
    this.name = "InvalidMeetingParticipantInputError";
  }
}

export async function createTenantMeeting(
  context: TenantContext,
  data: MeetingMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    if (data.primaryCompanyId) {
      const company = await findCompanyById(
        {
          tenantId: context.tenantId,
          companyId: data.primaryCompanyId,
        },
        tx,
      );

      if (!company) {
        throw new TenantScopedEntityNotFoundError(
          "COMPANY",
          data.primaryCompanyId,
        );
      }
    }

    const meeting = await createMeeting(
      {
        tenantId: context.tenantId,
        data: {
          ...data,
          createdByUserId: context.userId,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "meeting.created",
        entityType: "Meeting",
        entityId: meeting.id,
        metadata: {
          primaryCompanyId: meeting.primaryCompanyId,
          source: "manual-form",
          sourceType: meeting.sourceType,
        },
      },
      tx,
    );

    return meeting;
  });
}

export async function getTenantMeeting(
  context: TenantContext,
  meetingId: string,
) {
  await requireTenantAccess(context);

  return findMeetingById({
    tenantId: context.tenantId,
    meetingId,
  });
}

export async function getTenantMeetingProfile(
  context: TenantContext,
  meetingId: string,
) {
  await requireTenantAccess(context);

  return findMeetingProfileById({
    tenantId: context.tenantId,
    meetingId,
  });
}

export async function listTenantMeetings(context: TenantContext) {
  await requireTenantAccess(context);

  return listMeetingsForTenantWithSummaries(context.tenantId);
}

export async function updateTenantMeeting(
  context: TenantContext,
  meetingId: string,
  data: MeetingMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findMeetingById(
      {
        tenantId: context.tenantId,
        meetingId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("MEETING", meetingId);
    }

    if (data.primaryCompanyId) {
      const company = await findCompanyById(
        {
          tenantId: context.tenantId,
          companyId: data.primaryCompanyId,
        },
        tx,
      );

      if (!company) {
        throw new TenantScopedEntityNotFoundError(
          "COMPANY",
          data.primaryCompanyId,
        );
      }
    }

    const changedFields = Object.keys(data).filter(
      (field) => data[field as keyof typeof data] !== undefined,
    );
    const meeting = await updateMeeting(
      {
        tenantId: context.tenantId,
        meetingId,
        data: {
          ...data,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "meeting.updated",
        entityType: "Meeting",
        entityId: meeting.id,
        metadata: {
          changedFields,
        },
      },
      tx,
    );

    return meeting;
  });
}

export async function archiveTenantMeeting(
  context: TenantContext,
  meetingId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findMeetingById(
      {
        tenantId: context.tenantId,
        meetingId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("MEETING", meetingId);
    }

    const meeting = await updateMeeting(
      {
        tenantId: context.tenantId,
        meetingId,
        data: {
          archivedAt: new Date(),
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "meeting.archived",
        entityType: "Meeting",
        entityId: meeting.id,
        metadata: {
          source: "manual-form",
        },
      },
      tx,
    );

    return meeting;
  });
}

export async function createTenantMeetingParticipant(
  context: TenantContext,
  data: MeetingParticipantMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const meeting = await findMeetingById(
      {
        tenantId: context.tenantId,
        meetingId: data.meetingId,
      },
      tx,
    );

    if (!meeting) {
      throw new TenantScopedEntityNotFoundError("MEETING", data.meetingId);
    }

    let nameSnapshot = data.nameSnapshot ?? null;
    let emailSnapshot = data.emailSnapshot ?? null;

    if (!data.personId && !nameSnapshot && !emailSnapshot) {
      throw new InvalidMeetingParticipantInputError();
    }

    if (data.personId) {
      const person = await findPersonById(
        {
          tenantId: context.tenantId,
          personId: data.personId,
        },
        tx,
      );

      if (!person) {
        throw new TenantScopedEntityNotFoundError("PERSON", data.personId);
      }

      const existingParticipant = await findKnownPersonMeetingParticipant(
        {
          tenantId: context.tenantId,
          meetingId: data.meetingId,
          personId: data.personId,
        },
        tx,
      );

      if (existingParticipant) {
        throw new DuplicateMeetingParticipantError(
          data.meetingId,
          data.personId,
        );
      }

      nameSnapshot = nameSnapshot ?? person.displayName;
      emailSnapshot = emailSnapshot ?? person.email;
    }

    if (data.companyId) {
      const company = await findCompanyById(
        {
          tenantId: context.tenantId,
          companyId: data.companyId,
        },
        tx,
      );

      if (!company) {
        throw new TenantScopedEntityNotFoundError("COMPANY", data.companyId);
      }
    }

    const participant = await createMeetingParticipant(
      {
        tenantId: context.tenantId,
        data: {
          ...data,
          emailSnapshot,
          nameSnapshot,
          createdByUserId: context.userId,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "meeting_participant.added",
        entityType: "MeetingParticipant",
        entityId: participant.id,
        metadata: {
          companyId: participant.companyId,
          meetingId: participant.meetingId,
          participantRole: participant.participantRole,
          personId: participant.personId,
          source: "manual-form",
        },
      },
      tx,
    );

    return participant;
  });
}

export async function removeTenantMeetingParticipant(
  context: TenantContext,
  meetingId: string,
  meetingParticipantId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const meeting = await findMeetingById(
      {
        tenantId: context.tenantId,
        meetingId,
      },
      tx,
    );

    if (!meeting) {
      throw new TenantScopedEntityNotFoundError("MEETING", meetingId);
    }

    const participant = await findMeetingParticipantById(
      {
        tenantId: context.tenantId,
        meetingParticipantId,
      },
      tx,
    );

    if (!participant || participant.meetingId !== meetingId) {
      throw new TenantScopedEntityNotFoundError(
        "MEETING_PARTICIPANT",
        meetingParticipantId,
      );
    }

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "meeting_participant.removed",
        entityType: "MeetingParticipant",
        entityId: participant.id,
        metadata: {
          companyId: participant.companyId,
          meetingId: participant.meetingId,
          participantRole: participant.participantRole,
          personId: participant.personId,
          source: "manual-form",
        },
      },
      tx,
    );

    return deleteMeetingParticipant(
      {
        tenantId: context.tenantId,
        meetingParticipantId,
      },
      tx,
    );
  });
}
