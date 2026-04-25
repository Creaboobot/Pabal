import Link from "next/link";
import { Building2, Mail, UserRound } from "lucide-react";
import type { MeetingParticipantRole } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { removeMeetingParticipantAction } from "@/modules/meetings/actions";
import { MeetingActionButton } from "@/modules/meetings/components/meeting-action-button";
import { meetingParticipantRoleLabel } from "@/modules/meetings/labels";

export type ParticipantCardParticipant = {
  company: {
    id: string;
    name: string;
  } | null;
  companyId: string | null;
  emailSnapshot: string | null;
  id: string;
  nameSnapshot: string | null;
  participantRole: MeetingParticipantRole;
  person: {
    displayName: string;
    id: string;
  } | null;
  personId: string | null;
};

type ParticipantCardProps = {
  meetingId: string;
  participant: ParticipantCardParticipant;
  showActions?: boolean;
};

export function ParticipantCard({
  meetingId,
  participant,
  showActions = false,
}: ParticipantCardProps) {
  const displayName =
    participant.person?.displayName ??
    participant.nameSnapshot ??
    participant.emailSnapshot ??
    "Unnamed participant";

  return (
    <article className="rounded-md border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UserRound aria-hidden="true" className="size-4 text-primary" />
            {participant.person ? (
              <Link
                className="rounded-sm font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/${participant.person.id}`}
              >
                {displayName}
              </Link>
            ) : (
              <h2 className="font-semibold text-foreground">{displayName}</h2>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">
              {meetingParticipantRoleLabel(participant.participantRole)}
            </Badge>
            {participant.company ? (
              <Badge variant="outline">
                <Building2 aria-hidden="true" className="mr-1 size-3.5" />
                {participant.company.name}
              </Badge>
            ) : null}
            {participant.emailSnapshot ? (
              <Badge variant="outline">
                <Mail aria-hidden="true" className="mr-1 size-3.5" />
                {participant.emailSnapshot}
              </Badge>
            ) : null}
          </div>
        </div>

        {showActions ? (
          <MeetingActionButton
            action={removeMeetingParticipantAction.bind(
              null,
              meetingId,
              participant.id,
            )}
            confirmLabel="Remove participant"
            description="Only the meeting participant link will be removed. The person, company, meeting, notes, and source references stay intact."
            label="Remove"
            pendingLabel="Removing"
            title="Remove this participant?"
          />
        ) : null}
      </div>
    </article>
  );
}
