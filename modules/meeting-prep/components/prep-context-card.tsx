import Link from "next/link";
import { Building2, FileText, Mail, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatRelationshipDate,
  relationshipHealthSignalLabel,
  relationshipHealthSignalVariant,
} from "@/modules/relationship-health/labels";
import type {
  MeetingPrepCompanyContext,
  MeetingPrepParticipantContext,
} from "@/server/services/meeting-prep";

type ParticipantPrepCardProps = {
  participant: MeetingPrepParticipantContext;
};

type CompanyPrepCardProps = {
  company: MeetingPrepCompanyContext;
};

function NotePreviewList({
  notes,
}: {
  notes: MeetingPrepParticipantContext["recentNotes"];
}) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-2">
      {notes.map((note) => (
        <Link
          className="flex gap-2 rounded-md border border-border bg-muted/30 p-2 text-xs leading-5 text-muted-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
          href={note.href}
          key={note.id}
        >
          <FileText aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>{note.preview}</span>
        </Link>
      ))}
    </div>
  );
}

function HealthSummary({
  health,
}: {
  health: MeetingPrepCompanyContext["health"];
}) {
  if (!health) {
    return (
      <Badge variant="outline">No deterministic health signal yet</Badge>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Badge variant={relationshipHealthSignalVariant(health.signal)}>
          {relationshipHealthSignalLabel(health.signal)}
        </Badge>
        <Badge variant="outline">
          Last interaction {formatRelationshipDate(health.lastInteractionAt)}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{health.counts.openTasks} tasks</Badge>
        <Badge variant="secondary">
          {health.counts.openCommitments} commitments
        </Badge>
        <Badge variant="secondary">{health.counts.activeNeeds} needs</Badge>
        <Badge variant="secondary">
          {health.counts.activeCapabilities} capabilities
        </Badge>
        <Badge variant="secondary">
          {health.counts.activeIntroductions} introductions
        </Badge>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        {health.explanation}
      </p>
    </div>
  );
}

export function ParticipantPrepCard({
  participant,
}: ParticipantPrepCardProps) {
  const name = participant.person ? (
    <Link
      className="rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
      href={participant.person.href ?? "#"}
    >
      {participant.name}
    </Link>
  ) : (
    participant.name
  );

  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3">
        <div className="flex items-start gap-3">
          <UserRound
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-primary"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground">
              {name}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{participant.participantRole}</Badge>
              <Badge variant={participant.isKnownPerson ? "secondary" : "outline"}>
                {participant.isKnownPerson ? "Known person" : "Snapshot only"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          {participant.emailSnapshot ? (
            <span className="flex items-center gap-2">
              <Mail aria-hidden="true" className="size-4" />
              {participant.emailSnapshot}
            </span>
          ) : null}
          {participant.company ? (
            <Link
              className="flex items-center gap-2 rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
              href={participant.company.href ?? "#"}
            >
              <Building2 aria-hidden="true" className="size-4" />
              {participant.company.label}
            </Link>
          ) : null}
        </div>

        <HealthSummary health={participant.health} />
        <NotePreviewList notes={participant.recentNotes} />
      </div>
    </article>
  );
}

export function CompanyPrepCard({ company }: CompanyPrepCardProps) {
  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3">
        <div className="flex items-start gap-3">
          <Building2
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-primary"
          />
          <div className="min-w-0 flex-1">
            <Link
              className="rounded-sm text-base font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
              href={`/people/companies/${company.id}`}
            >
              {company.name}
            </Link>
            {company.isPrimary ? (
              <div className="mt-2">
                <Badge variant="secondary">Primary company</Badge>
              </div>
            ) : null}
          </div>
        </div>

        <HealthSummary health={company.health} />
        <NotePreviewList notes={company.recentNotes} />
      </div>
    </article>
  );
}
