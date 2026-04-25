import Link from "next/link";
import {
  Building2,
  CalendarDays,
  FileText,
  UserRound,
} from "lucide-react";
import type {
  CommitmentOwnerType,
  CommitmentStatus,
  Sensitivity,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { CommitmentBadges } from "@/modules/commitments/components/commitment-badges";

export type CommitmentCardCommitment = {
  counterpartyCompany: { id: string; name: string } | null;
  counterpartyPerson: { displayName: string; id: string } | null;
  description: string | null;
  dueAt: Date | null;
  dueWindowEnd: Date | null;
  dueWindowStart: Date | null;
  id: string;
  meeting: { id: string; occurredAt: Date | null; title: string } | null;
  note: { id: string; noteType: string; summary: string | null } | null;
  ownerCompany: { id: string; name: string } | null;
  ownerPerson: { displayName: string; id: string } | null;
  ownerType: CommitmentOwnerType;
  sensitivity: Sensitivity;
  status: CommitmentStatus;
  title: string;
};

type CommitmentCardProps = {
  commitment: CommitmentCardCommitment;
};

function preview(text: string) {
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

export function CommitmentCard({ commitment }: CommitmentCardProps) {
  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3">
        <div className="min-w-0">
          <Link
            className="rounded-sm text-base font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            href={`/commitments/${commitment.id}`}
          >
            {commitment.title}
          </Link>
          <div className="mt-2">
            <CommitmentBadges
              dueAt={commitment.dueAt}
              dueWindowEnd={commitment.dueWindowEnd}
              dueWindowStart={commitment.dueWindowStart}
              ownerType={commitment.ownerType}
              sensitivity={commitment.sensitivity}
              status={commitment.status}
            />
          </div>
        </div>

        {commitment.description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {preview(commitment.description)}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {commitment.ownerPerson ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/${commitment.ownerPerson.id}`}
              >
                <UserRound aria-hidden="true" className="size-3.5" />
                Owner: {commitment.ownerPerson.displayName}
              </Link>
            </Badge>
          ) : null}
          {commitment.ownerCompany ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/companies/${commitment.ownerCompany.id}`}
              >
                <Building2 aria-hidden="true" className="size-3.5" />
                Owner: {commitment.ownerCompany.name}
              </Link>
            </Badge>
          ) : null}
          {commitment.counterpartyPerson ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/${commitment.counterpartyPerson.id}`}
              >
                <UserRound aria-hidden="true" className="size-3.5" />
                With: {commitment.counterpartyPerson.displayName}
              </Link>
            </Badge>
          ) : null}
          {commitment.counterpartyCompany ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/companies/${commitment.counterpartyCompany.id}`}
              >
                <Building2 aria-hidden="true" className="size-3.5" />
                With: {commitment.counterpartyCompany.name}
              </Link>
            </Badge>
          ) : null}
          {commitment.meeting ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/meetings/${commitment.meeting.id}`}
              >
                <CalendarDays aria-hidden="true" className="size-3.5" />
                {commitment.meeting.title}
              </Link>
            </Badge>
          ) : null}
          {commitment.note ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/notes/${commitment.note.id}`}
              >
                <FileText aria-hidden="true" className="size-3.5" />
                {commitment.note.summary ?? `${commitment.note.noteType} note`}
              </Link>
            </Badge>
          ) : null}
        </div>
      </div>
    </article>
  );
}
