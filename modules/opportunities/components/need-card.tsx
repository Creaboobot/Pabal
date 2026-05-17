import Link from "next/link";
import {
  Building2,
  CalendarDays,
  FileText,
  RotateCcw,
  UserRound,
} from "lucide-react";
import type {
  NeedStatus,
  NeedType,
  Sensitivity,
  TaskPriority,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { NeedBadges } from "@/modules/opportunities/components/opportunity-badges";
import { formatNeedReviewDate } from "@/modules/opportunities/labels";

export type NeedCardNeed = {
  company: { id: string; name: string } | null;
  confidence: number | null;
  description: string | null;
  id: string;
  meeting: { id: string; occurredAt: Date | null; title: string } | null;
  needType: NeedType;
  note: {
    id: string;
    noteType: string;
    sensitivity: Sensitivity;
    sourceType: string;
    summary: string | null;
  } | null;
  person: { displayName: string; id: string } | null;
  priority: TaskPriority;
  reviewAfter: Date | null;
  sensitivity: Sensitivity;
  status: NeedStatus;
  title: string;
};

type NeedCardProps = {
  need: NeedCardNeed;
};

function preview(text: string | null) {
  if (!text) {
    return null;
  }

  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

export function NeedCard({ need }: NeedCardProps) {
  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3">
        <div className="min-w-0">
          <Link
            className="rounded-sm text-base font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            href={`/opportunities/needs/${need.id}`}
          >
            {need.title}
          </Link>
          <div className="mt-2">
            <NeedBadges
              confidence={need.confidence}
              needType={need.needType}
              priority={need.priority}
              sensitivity={need.sensitivity}
              status={need.status}
            />
          </div>
        </div>

        {preview(need.description) ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {preview(need.description)}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {need.person ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/${need.person.id}`}
              >
                <UserRound aria-hidden="true" className="size-3.5" />
                {need.person.displayName}
              </Link>
            </Badge>
          ) : null}
          {need.company ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/companies/${need.company.id}`}
              >
                <Building2 aria-hidden="true" className="size-3.5" />
                {need.company.name}
              </Link>
            </Badge>
          ) : null}
          {need.meeting ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/meetings/${need.meeting.id}`}
              >
                <CalendarDays aria-hidden="true" className="size-3.5" />
                {need.meeting.title}
              </Link>
            </Badge>
          ) : null}
          {need.note ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/notes/${need.note.id}`}
              >
                <FileText aria-hidden="true" className="size-3.5" />
                {need.note.summary ?? `${need.note.noteType} note`}
              </Link>
            </Badge>
          ) : null}
          {need.reviewAfter ? (
            <Badge variant="secondary">
              <span className="flex items-center gap-1">
                <RotateCcw aria-hidden="true" className="size-3.5" />
                Review after {formatNeedReviewDate(need.reviewAfter)}
              </span>
            </Badge>
          ) : null}
        </div>
      </div>
    </article>
  );
}
