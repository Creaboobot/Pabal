import { CalendarDays, FileText } from "lucide-react";

import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";

type MeetingSummary = {
  id: string;
  location: string | null;
  occurredAt: Date | null;
  summary: string | null;
  title: string;
};

type NoteSummary = {
  createdAt: Date;
  id: string;
  noteType: string;
  sensitivity: string;
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

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sensitivityVariant(sensitivity: string): "outline" | "sensitive" {
  return sensitivity === "NORMAL" ? "outline" : "sensitive";
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
                    <h2 className="font-semibold text-foreground">
                      {meeting.title}
                    </h2>
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
            description="Meeting capture arrives later; this section will surface tenant-scoped meeting history when it exists."
            icon={CalendarDays}
            title="No related meetings"
          />
        )}
      </CockpitCard>

      <CockpitCard title="Latest notes" value={notes.length}>
        {notes.length > 0 ? (
          <div className="grid gap-3">
            {notes.map((note) => (
              <article
                className="rounded-md border border-border bg-background p-3"
                key={note.id}
              >
                <div className="flex items-start gap-3">
                  <FileText
                    aria-hidden="true"
                    className="mt-0.5 size-5 text-primary"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-foreground">
                        {label(note.noteType)}
                      </h2>
                      <Badge variant={sensitivityVariant(note.sensitivity)}>
                        {label(note.sensitivity)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(note.createdAt)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {note.summary ?? "No summary yet."}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Notes remain read-only here until the meeting and capture workflows are built."
            icon={FileText}
            title="No related notes"
          />
        )}
      </CockpitCard>
    </section>
  );
}
