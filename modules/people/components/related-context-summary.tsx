import { CalendarDays, FileText } from "lucide-react";
import Link from "next/link";
import type { NoteType, RecordSourceType, Sensitivity } from "@prisma/client";

import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { NoteCard } from "@/modules/notes/components/note-card";

type MeetingSummary = {
  id: string;
  location: string | null;
  occurredAt: Date | null;
  summary: string | null;
  title: string;
};

type NoteSummary = {
  body: string;
  createdAt: Date;
  id: string;
  noteType: NoteType;
  sensitivity: Sensitivity;
  sourceType: RecordSourceType;
  summary: string | null;
};

type RelatedContextSummaryProps = {
  meetings: MeetingSummary[];
  notes: NoteSummary[];
};

function formatDate(date: Date | null) {
  return date
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
      }).format(date)
    : "No date";
}

export function RelatedContextSummary({
  meetings,
  notes,
}: RelatedContextSummaryProps) {
  return (
    <section className="grid gap-3 lg:grid-cols-2">
      <CockpitCard title="Latest meetings" value={meetings.length}>
        {meetings.length > 0 ? (
          <div className="grid gap-3">
            {meetings.map((meeting) => (
              <article
                className="rounded-md border border-border bg-background p-3"
                key={meeting.id}
              >
                <div className="flex items-start gap-3">
                  <CalendarDays
                    aria-hidden="true"
                    className="mt-0.5 size-5 text-primary"
                  />
                  <div className="min-w-0">
                    <Link
                      className="rounded-sm font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                      href={`/meetings/${meeting.id}`}
                    >
                      {meeting.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(meeting.occurredAt)}
                      {meeting.location ? ` at ${meeting.location}` : ""}
                    </p>
                    {meeting.summary ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {meeting.summary}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Related meetings will appear here when this record has tenant-scoped meeting history."
            icon={CalendarDays}
            title="No related meetings"
          />
        )}
      </CockpitCard>

      <CockpitCard title="Latest notes" value={notes.length}>
        {notes.length > 0 ? (
          <div className="grid gap-3">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Linked notes will appear here when this record has manually captured context."
            icon={FileText}
            title="No related notes"
          />
        )}
      </CockpitCard>
    </section>
  );
}
