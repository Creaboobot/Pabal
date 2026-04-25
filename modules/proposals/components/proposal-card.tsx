import Link from "next/link";
import { FileText, Mic, NotebookText } from "lucide-react";
import type {
  AIProposalItemStatus,
  AIProposalStatus,
  AIProposalType,
  RecordSourceType,
  VoiceNoteStatus,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  ConfidenceBadge,
  ProposalStatusBadge,
  ProposalTypeBadge,
} from "@/modules/proposals/components/proposal-badges";

export type ProposalCardProposal = {
  _count: {
    items: number;
  };
  confidence: number | null;
  createdAt: Date;
  explanation: string | null;
  id: string;
  items: Array<{
    status: AIProposalItemStatus;
  }>;
  proposalType: AIProposalType;
  sourceMeeting: {
    id: string;
    occurredAt: Date | null;
    sourceType: RecordSourceType;
    title: string;
  } | null;
  sourceNote: {
    id: string;
    noteType: string;
    sourceType: RecordSourceType;
    summary: string | null;
  } | null;
  sourceVoiceNote: {
    id: string;
    status: VoiceNoteStatus;
    title: string | null;
  } | null;
  status: AIProposalStatus;
  summary: string | null;
  title: string;
};

type ProposalCardProps = {
  proposal: ProposalCardProposal;
};

function preview(text: string | null) {
  if (!text) {
    return null;
  }

  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function reviewedCount(proposal: ProposalCardProposal) {
  return proposal.items.filter((item) => item.status !== "PENDING_REVIEW")
    .length;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const proposalPreview = preview(proposal.summary ?? proposal.explanation);

  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3">
        <div className="min-w-0">
          <Link
            className="rounded-sm text-base font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            href={`/proposals/${proposal.id}`}
          >
            {proposal.title}
          </Link>
          <div className="mt-2 flex flex-wrap gap-2">
            <ProposalStatusBadge status={proposal.status} />
            <ProposalTypeBadge proposalType={proposal.proposalType} />
            <ConfidenceBadge confidence={proposal.confidence} />
            <Badge variant="outline">
              {reviewedCount(proposal)} of {proposal._count.items} reviewed
            </Badge>
          </div>
        </div>

        {proposalPreview ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {proposalPreview}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {proposal.sourceNote ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/notes/${proposal.sourceNote.id}`}
              >
                <FileText aria-hidden="true" className="size-3.5" />
                {proposal.sourceNote.summary ??
                  `${proposal.sourceNote.noteType} note`}
              </Link>
            </Badge>
          ) : null}
          {proposal.sourceMeeting ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/meetings/${proposal.sourceMeeting.id}`}
              >
                <NotebookText aria-hidden="true" className="size-3.5" />
                {proposal.sourceMeeting.title}
              </Link>
            </Badge>
          ) : null}
          {proposal.sourceVoiceNote ? (
            <Badge variant="outline">
              <span className="flex items-center gap-1">
                <Mic aria-hidden="true" className="size-3.5" />
                {proposal.sourceVoiceNote.title ??
                  `${proposal.sourceVoiceNote.status} voice note`}
              </span>
            </Badge>
          ) : null}
          {!proposal.sourceNote &&
          !proposal.sourceMeeting &&
          !proposal.sourceVoiceNote ? (
            <Badge variant="secondary">No source context</Badge>
          ) : null}
        </div>
      </div>
    </article>
  );
}
