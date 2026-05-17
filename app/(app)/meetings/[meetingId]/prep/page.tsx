import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  Building2,
  CalendarDays,
  FileText,
  HeartPulse,
  Link2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CompanyPrepCard,
  ParticipantPrepCard,
} from "@/modules/meeting-prep/components/prep-context-card";
import {
  PrepRecordList,
  type PrepRecordListItem,
} from "@/modules/meeting-prep/components/prep-record-list";
import { SourceBadge } from "@/modules/meetings/components/source-badge";
import { formatMeetingDateTime } from "@/modules/meetings/labels";
import {
  commitmentDueLabel,
  commitmentOwnerTypeLabel,
  commitmentStatusLabel,
  sensitivityLabel as commitmentSensitivityLabel,
} from "@/modules/commitments/labels";
import {
  capabilityStatusLabel,
  capabilityTypeLabel,
  confidenceLabel,
  needStatusLabel,
  needTypeLabel,
  priorityLabel,
  sensitivityLabel as opportunitySensitivityLabel,
} from "@/modules/opportunities/labels";
import {
  proposalStatusLabel,
  proposalTypeLabel,
  sourceEntityTypeLabel,
} from "@/modules/proposals/labels";
import {
  noteTypeLabel,
  recordSourceTypeLabel,
  sensitivityLabel as noteSensitivityLabel,
} from "@/modules/notes/labels";
import {
  taskPriorityLabel,
  taskStatusLabel,
  taskTypeLabel,
} from "@/modules/tasks/labels";
import { getTenantMeetingPrepBrief } from "@/server/services/meeting-prep";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type MeetingPrepPageProps = {
  params: Promise<{
    meetingId: string;
  }>;
};

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function taskRecords(
  brief: Awaited<ReturnType<typeof getTenantMeetingPrepBrief>>,
): PrepRecordListItem[] {
  return (
    brief?.records.tasks.map((task) => ({
      badges: [
        taskStatusLabel(task.status),
        taskPriorityLabel(task.priority),
        taskTypeLabel(task.taskType),
      ],
      dateLabel: task.dueAt ? `Due ${formatDate(task.dueAt)}` : "No due date",
      href: task.href,
      id: task.id,
      title: task.title,
    })) ?? []
  );
}

function commitmentRecords(
  brief: Awaited<ReturnType<typeof getTenantMeetingPrepBrief>>,
): PrepRecordListItem[] {
  return (
    brief?.records.commitments.map((commitment) => ({
      badges: [
        commitmentStatusLabel(commitment.status),
        commitmentOwnerTypeLabel(commitment.ownerType),
        commitmentSensitivityLabel(commitment.sensitivity),
      ],
      dateLabel: commitmentDueLabel(commitment),
      href: commitment.href,
      id: commitment.id,
      title: commitment.title,
    })) ?? []
  );
}

function needRecords(
  brief: Awaited<ReturnType<typeof getTenantMeetingPrepBrief>>,
): PrepRecordListItem[] {
  return (
    brief?.records.needs.map((need) => ({
      badges: [
        needStatusLabel(need.status),
        needTypeLabel(need.needType),
        priorityLabel(need.priority),
        opportunitySensitivityLabel(need.sensitivity),
        confidenceLabel(need.confidence),
      ],
      href: need.href,
      id: need.id,
      title: need.title,
    })) ?? []
  );
}

function capabilityRecords(
  brief: Awaited<ReturnType<typeof getTenantMeetingPrepBrief>>,
): PrepRecordListItem[] {
  return (
    brief?.records.capabilities.map((capability) => ({
      badges: [
        capabilityStatusLabel(capability.status),
        capabilityTypeLabel(capability.capabilityType),
        opportunitySensitivityLabel(capability.sensitivity),
        confidenceLabel(capability.confidence),
      ],
      href: capability.href,
      id: capability.id,
      title: capability.title,
    })) ?? []
  );
}

function proposalRecords(
  brief: Awaited<ReturnType<typeof getTenantMeetingPrepBrief>>,
): PrepRecordListItem[] {
  return (
    brief?.records.proposals.map((proposal) => ({
      badges: [
        proposalStatusLabel(proposal.status),
        proposalTypeLabel(proposal.proposalType),
        "Review only",
      ],
      description:
        "Status-only suggested update context. Nothing is applied here.",
      href: proposal.href,
      id: proposal.id,
      title: proposal.title,
    })) ?? []
  );
}

function noteRecords(
  brief: Awaited<ReturnType<typeof getTenantMeetingPrepBrief>>,
): PrepRecordListItem[] {
  return (
    brief?.records.notes.map((note) => ({
      badges: [
        noteTypeLabel(note.noteType),
        recordSourceTypeLabel(note.sourceType),
        noteSensitivityLabel(note.sensitivity),
      ],
      dateLabel: formatDate(note.updatedAt),
      description: note.preview,
      href: note.href,
      id: note.id,
      title: "Linked note",
    })) ?? []
  );
}

function recentMeetingRecords(
  brief: Awaited<ReturnType<typeof getTenantMeetingPrepBrief>>,
): PrepRecordListItem[] {
  return (
    brief?.records.recentMeetings.map((meeting) => ({
      badges: meeting.primaryCompanyName ? [meeting.primaryCompanyName] : [],
      dateLabel: formatMeetingDateTime(meeting.occurredAt),
      href: meeting.href,
      id: meeting.id,
      title: meeting.title,
    })) ?? []
  );
}

function healthReasonRecords(
  brief: Awaited<ReturnType<typeof getTenantMeetingPrepBrief>>,
): PrepRecordListItem[] {
  if (!brief) {
    return [];
  }

  const seen = new Set<string>();
  const reasons = [...brief.participants, ...brief.companies]
    .flatMap((context) => context.health?.reasons ?? [])
    .filter((reason) => {
      const key = `${reason.type}-${reason.relatedEntityId}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return Boolean(reason.href);
    })
    .slice(0, 8);

  return reasons.map((reason) => {
    const record: PrepRecordListItem = {
      badges: [reason.severity],
      description: reason.explanation,
      href: reason.href ?? "#",
      id: `${reason.type}-${reason.relatedEntityId}`,
      title: reason.label,
    };

    if (reason.date) {
      record.dateLabel = formatDate(reason.date);
    }

    return record;
  });
}

export default async function MeetingPrepPage({
  params,
}: MeetingPrepPageProps) {
  const [{ meetingId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/meetings/${meetingId}/prep`);
  }

  const brief = await getTenantMeetingPrepBrief(context, meetingId);

  if (!brief) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href={`/meetings/${brief.meeting.id}`}>
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Meeting
              </Link>
            </Button>
          </div>
        }
        description={formatMeetingDateTime(brief.meeting.occurredAt)}
        eyebrow="Meeting prep"
        title={`Prepare: ${brief.meeting.title}`}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <CockpitCard title="Meeting overview">
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <div className="flex flex-wrap gap-2">
              <SourceBadge sourceType={brief.meeting.sourceType} />
              <Badge variant="secondary">
                <UsersRound aria-hidden="true" className="mr-1 size-3.5" />
                {brief.participants.length} participants
              </Badge>
              <Badge variant="secondary">
                <FileText aria-hidden="true" className="mr-1 size-3.5" />
                {brief.records.notes.length} linked notes
              </Badge>
            </div>
            <span className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-4" />
              {formatMeetingDateTime(brief.meeting.occurredAt)}
            </span>
            {brief.meeting.endedAt ? (
              <span className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="size-4" />
                Ends {formatMeetingDateTime(brief.meeting.endedAt)}
              </span>
            ) : null}
            {brief.meeting.primaryCompany ? (
              <Link
                className="flex items-center gap-2 rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                href={brief.meeting.primaryCompany.href ?? "#"}
              >
                <Building2 aria-hidden="true" className="size-4" />
                {brief.meeting.primaryCompany.label}
              </Link>
            ) : null}
            {brief.meeting.summary ? (
              <p>{brief.meeting.summary}</p>
            ) : (
              <p>No manual meeting summary yet.</p>
            )}
          </div>
        </CockpitCard>

        <CockpitCard title="Read-only brief">
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="size-4" />
              Deterministic and source-linked.
            </div>
            <div className="flex items-center gap-2">
              <HeartPulse aria-hidden="true" className="size-4" />
              Uses existing relationship health signals.
            </div>
            <div className="flex items-center gap-2">
              <BookOpenCheck aria-hidden="true" className="size-4" />
              No AI generation, sync, or record mutation.
            </div>
          </div>
        </CockpitCard>
      </section>

      <CockpitCard title="Participants" value={brief.participants.length}>
        {brief.participants.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {brief.participants.map((participant) => (
              <ParticipantPrepCard
                key={participant.id}
                participant={participant}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Add participants to the meeting to make prep context richer."
            icon={UsersRound}
            title="No participants yet"
          />
        )}
      </CockpitCard>

      <CockpitCard title="Company context" value={brief.companies.length}>
        {brief.companies.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {brief.companies.map((company) => (
              <CompanyPrepCard company={company} key={company.id} />
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            No primary or participant company is linked to this meeting yet.
          </p>
        )}
      </CockpitCard>

      <section className="grid gap-3 lg:grid-cols-2">
        <CockpitCard title="Open tasks" value={brief.records.tasks.length}>
          <PrepRecordList
            emptyDescription="No open or snoozed tasks are explicitly linked to this meeting context."
            records={taskRecords(brief)}
          />
        </CockpitCard>

        <CockpitCard
          title="Open commitments"
          value={brief.records.commitments.length}
        >
          <PrepRecordList
            emptyDescription="No open or waiting commitments are explicitly linked to this meeting context."
            records={commitmentRecords(brief)}
          />
        </CockpitCard>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <CockpitCard title="Active needs" value={brief.records.needs.length}>
          <PrepRecordList
            emptyDescription="No active needs are explicitly linked to this meeting context."
            records={needRecords(brief)}
          />
        </CockpitCard>

        <CockpitCard
          title="Active capabilities"
          value={brief.records.capabilities.length}
        >
          <PrepRecordList
            emptyDescription="No active capabilities are explicitly linked to participants, companies, or notes."
            records={capabilityRecords(brief)}
          />
        </CockpitCard>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <CockpitCard
          title="Pending suggested updates"
          value={brief.records.proposals.length}
        >
          <PrepRecordList
            emptyDescription="No pending or in-review suggested updates are linked to this meeting context."
            records={proposalRecords(brief)}
          />
        </CockpitCard>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <CockpitCard title="Related notes" value={brief.records.notes.length}>
          <PrepRecordList
            emptyDescription="No notes are linked directly to this meeting."
            records={noteRecords(brief)}
          />
        </CockpitCard>

        <CockpitCard
          title="Recent interactions"
          value={brief.records.recentMeetings.length}
        >
          <PrepRecordList
            emptyDescription="No recent explicit interactions found for participants or companies."
            records={recentMeetingRecords(brief)}
          />
        </CockpitCard>
      </section>

      <CockpitCard title="Relationship health reasons">
        <PrepRecordList
          emptyDescription="No additional deterministic health reasons are available yet."
          records={healthReasonRecords(brief)}
        />
      </CockpitCard>

      <CockpitCard
        title="Source and provenance"
        value={brief.records.sourceReferences.length}
      >
        {brief.records.sourceReferences.length > 0 ? (
          <div className="grid gap-3">
            {brief.records.sourceReferences.map((reference) => (
              <div
                className="rounded-md border border-border bg-background p-3 text-sm leading-6"
                key={reference.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{reference.label}</Badge>
                  {reference.confidence !== null ? (
                    <Badge variant="outline">
                      {confidenceLabel(reference.confidence)}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-muted-foreground">
                  {sourceEntityTypeLabel(reference.source.entityType)} to{" "}
                  {sourceEntityTypeLabel(reference.target.entityType)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reference.source.href ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={reference.source.href}>
                        <Link2 aria-hidden="true" className="mr-2 size-4" />
                        Source
                      </Link>
                    </Button>
                  ) : null}
                  {reference.target.href ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={reference.target.href}>
                        <Link2 aria-hidden="true" className="mr-2 size-4" />
                        Target
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            This brief still links back to its source records. No additional
            SourceReference rows are attached to the meeting yet.
          </p>
        )}
      </CockpitCard>
    </div>
  );
}
