import { Prisma, type Sensitivity } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { findCompanyById } from "@/server/repositories/companies";
import { createMeetingParticipant } from "@/server/repositories/meeting-participants";
import { createMeeting } from "@/server/repositories/meetings";
import { createNote } from "@/server/repositories/notes";
import { findPersonById } from "@/server/repositories/people";
import { createSourceReference } from "@/server/repositories/source-references";
import { writeAuditLog } from "@/server/services/audit-log";
import { DuplicateMeetingParticipantError } from "@/server/services/meetings";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

type PastedMeetingCaptureInput = {
  body: string;
  endedAt?: Date | null;
  occurredAt: Date;
  participantPersonIds?: string[];
  primaryCompanyId?: string | null;
  sensitivity: Sensitivity;
  summary?: string | null;
  title: string;
};

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

export async function createTenantPastedMeetingCapture(
  context: TenantContext,
  data: PastedMeetingCaptureInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(
    async (tx) => {
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

      const participantPersonIds = uniqueIds(data.participantPersonIds ?? []);
      const people = [];

      for (const personId of participantPersonIds) {
        const person = await findPersonById(
          {
            tenantId: context.tenantId,
            personId,
          },
          tx,
        );

        if (!person) {
          throw new TenantScopedEntityNotFoundError("PERSON", personId);
        }

        people.push(person);
      }

      const meeting = await createMeeting(
        {
          tenantId: context.tenantId,
          data: {
            endedAt: data.endedAt ?? null,
            occurredAt: data.occurredAt,
            primaryCompanyId: data.primaryCompanyId ?? null,
            sourceType: "TEAMS_COPILOT_PASTE",
            summary: data.summary ?? null,
            title: data.title,
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
            hasSummary: Boolean(meeting.summary),
            primaryCompanyId: meeting.primaryCompanyId,
            source: "pasted-capture",
            sourceType: meeting.sourceType,
          },
        },
        tx,
      );

      for (const person of people) {
        const participant = await createMeetingParticipant(
          {
            tenantId: context.tenantId,
            data: {
              emailSnapshot: person.email,
              meetingId: meeting.id,
              nameSnapshot: person.displayName,
              participantRole: "ATTENDEE",
              personId: person.id,
              createdByUserId: context.userId,
              updatedByUserId: context.userId,
            },
          },
          tx,
        ).catch((error: unknown) => {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            throw new DuplicateMeetingParticipantError(meeting.id, person.id);
          }

          throw error;
        });

        await writeAuditLog(
          {
            tenantId: context.tenantId,
            actorUserId: context.userId,
            action: "meeting_participant.added",
            entityType: "MeetingParticipant",
            entityId: participant.id,
            metadata: {
              meetingId: participant.meetingId,
              participantRole: participant.participantRole,
              personId: participant.personId,
              source: "pasted-capture",
            },
          },
          tx,
        );
      }

      const note = await createNote(
        {
          tenantId: context.tenantId,
          data: {
            body: data.body,
            companyId: data.primaryCompanyId ?? null,
            meetingId: meeting.id,
            noteType: "MEETING",
            sensitivity: data.sensitivity,
            sourceType: "TEAMS_COPILOT_PASTE",
            summary: data.summary ?? null,
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
          action: "note.created",
          entityType: "Note",
          entityId: note.id,
          metadata: {
            bodyLength: note.body.length,
            companyId: note.companyId,
            hasSummary: Boolean(note.summary),
            meetingId: note.meetingId,
            noteType: note.noteType,
            sensitivity: note.sensitivity,
            source: "pasted-capture",
            sourceType: note.sourceType,
          },
        },
        tx,
      );

      const sourceReference = await createSourceReference(
        {
          tenantId: context.tenantId,
          data: {
            label: "teams-copilot-paste",
            reason: "Manual pasted meeting note stored as source evidence.",
            sourceEntityId: note.id,
            sourceEntityType: "NOTE",
            targetEntityId: meeting.id,
            targetEntityType: "MEETING",
            createdByUserId: context.userId,
          },
        },
        tx,
      );

      await writeAuditLog(
        {
          tenantId: context.tenantId,
          actorUserId: context.userId,
          action: "capture.meeting_note_pasted",
          entityType: "Meeting",
          entityId: meeting.id,
          metadata: {
            bodyLength: note.body.length,
            hasSummary: Boolean(note.summary),
            meetingId: meeting.id,
            noteId: note.id,
            participantCount: people.length,
            sourceType: "TEAMS_COPILOT_PASTE",
          },
        },
        tx,
      );

      return {
        meeting,
        note,
        sourceReference,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
