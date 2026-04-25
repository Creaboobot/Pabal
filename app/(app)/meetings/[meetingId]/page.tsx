import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit,
  FileText,
  MapPin,
  Plus,
  UsersRound,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { archiveMeetingAction } from "@/modules/meetings/actions";
import { MeetingActionButton } from "@/modules/meetings/components/meeting-action-button";
import { ParticipantCard } from "@/modules/meetings/components/participant-card";
import { SourceBadge } from "@/modules/meetings/components/source-badge";
import { formatMeetingDateTime } from "@/modules/meetings/labels";
import { getTenantMeetingProfile } from "@/server/services/meetings";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type MeetingDetailPageProps = {
  params: Promise<{
    meetingId: string;
  }>;
};

export default async function MeetingDetailPage({
  params,
}: MeetingDetailPageProps) {
  const [{ meetingId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/meetings/${meetingId}`);
  }

  const meeting = await getTenantMeetingProfile(context, meetingId);

  if (!meeting) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/meetings">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Meetings
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/meetings/${meeting.id}/edit`}>
                <Edit aria-hidden="true" className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
          </div>
        }
        description={formatMeetingDateTime(meeting.occurredAt)}
        eyebrow="Meeting"
        title={meeting.title}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <CockpitCard title="Meeting context">
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <div className="flex flex-wrap gap-2">
              <SourceBadge sourceType={meeting.sourceType} />
              <Badge variant="secondary">
                <UsersRound aria-hidden="true" className="mr-1 size-3.5" />
                {meeting._count.participants} participants
              </Badge>
              <Badge variant="secondary">
                <FileText aria-hidden="true" className="mr-1 size-3.5" />
                {meeting._count.notes} notes
              </Badge>
            </div>

            <span className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-4" />
              {formatMeetingDateTime(meeting.occurredAt)}
            </span>
            {meeting.endedAt ? (
              <span className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="size-4" />
                Ends {formatMeetingDateTime(meeting.endedAt)}
              </span>
            ) : null}
            {meeting.location ? (
              <span className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-4" />
                {meeting.location}
              </span>
            ) : null}
            {meeting.primaryCompany ? (
              <Link
                className="flex items-center gap-2 rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/companies/${meeting.primaryCompany.id}`}
              >
                <Building2 aria-hidden="true" className="size-4" />
                {meeting.primaryCompany.name}
              </Link>
            ) : null}
          </div>
        </CockpitCard>

        <CockpitCard title="Source and notes">
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-muted-foreground">
              The meeting keeps a clear source label and read-only note count.
            </p>
            <div className="flex flex-wrap gap-2">
              <SourceBadge sourceType={meeting.sourceType} />
              <Badge variant="outline">{meeting._count.notes} note links</Badge>
            </div>
          </div>
        </CockpitCard>
      </section>

      {meeting.summary ? (
        <CockpitCard title="Summary">
          <p className="text-sm leading-6 text-muted-foreground">
            {meeting.summary}
          </p>
        </CockpitCard>
      ) : null}

      <CockpitCard title="Participants" value={meeting.participants.length}>
        {meeting.participants.length > 0 ? (
          <div className="grid gap-3">
            {meeting.participants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                meetingId={meeting.id}
                participant={participant}
                showActions
              />
            ))}
          </div>
        ) : (
          <EmptyState
            action={
              <Button asChild>
                <Link href={`/meetings/${meeting.id}/participants/new`}>
                  <Plus aria-hidden="true" className="mr-2 size-4" />
                  Add participant
                </Link>
              </Button>
            }
            description="Link people or a snapshot participant to make this meeting useful in relationship context."
            icon={UsersRound}
            title="No participants yet"
          />
        )}
      </CockpitCard>

      {meeting.participants.length > 0 ? (
        <Button asChild>
          <Link href={`/meetings/${meeting.id}/participants/new`}>
            <Plus aria-hidden="true" className="mr-2 size-4" />
            Add participant
          </Link>
        </Button>
      ) : null}

      <MeetingActionButton
        action={archiveMeetingAction.bind(null, meeting.id)}
        confirmLabel="Archive meeting"
        description="The meeting will be hidden from active lists. Participant links, notes, and source references stay intact."
        label="Archive"
        pendingLabel="Archiving"
        title="Archive this meeting?"
      />
    </div>
  );
}
