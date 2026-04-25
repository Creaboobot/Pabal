import Link from "next/link";
import { Building2, CalendarDays, FileText, MapPin, UsersRound } from "lucide-react";
import type { RecordSourceType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { SourceBadge } from "@/modules/meetings/components/source-badge";
import { formatMeetingDateTime } from "@/modules/meetings/labels";

export type MeetingCardMeeting = {
  id: string;
  location: string | null;
  noteCount: number;
  occurredAt: Date | null;
  participantCount: number;
  primaryCompanyName: string | null;
  sourceType: RecordSourceType;
  summary: string | null;
  title: string;
};

type MeetingCardProps = {
  meeting: MeetingCardMeeting;
};

function preview(text: string) {
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            className="rounded-sm text-base font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            href={`/meetings/${meeting.id}`}
          >
            {meeting.title}
          </Link>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays aria-hidden="true" className="size-4" />
            {formatMeetingDateTime(meeting.occurredAt)}
          </p>
        </div>
        <SourceBadge sourceType={meeting.sourceType} />
      </div>

      {meeting.summary ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {preview(meeting.summary)}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {meeting.primaryCompanyName ? (
          <Badge variant="outline">
            <Building2 aria-hidden="true" className="mr-1 size-3.5" />
            {meeting.primaryCompanyName}
          </Badge>
        ) : null}
        {meeting.location ? (
          <Badge variant="outline">
            <MapPin aria-hidden="true" className="mr-1 size-3.5" />
            {meeting.location}
          </Badge>
        ) : null}
        <Badge variant="secondary">
          <UsersRound aria-hidden="true" className="mr-1 size-3.5" />
          {meeting.participantCount} participants
        </Badge>
        <Badge variant="secondary">
          <FileText aria-hidden="true" className="mr-1 size-3.5" />
          {meeting.noteCount} notes
        </Badge>
      </div>
    </article>
  );
}
