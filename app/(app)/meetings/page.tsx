import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { MeetingCard } from "@/modules/meetings/components/meeting-card";
import { listTenantMeetings } from "@/server/services/meetings";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/meetings");
  }

  const meetings = await listTenantMeetings(context);
  const meetingCards = meetings.map((meeting) => ({
    id: meeting.id,
    location: meeting.location,
    noteCount: meeting._count.notes,
    occurredAt: meeting.occurredAt,
    participantCount: meeting._count.participants,
    primaryCompanyName: meeting.primaryCompany?.name ?? null,
    sourceType: meeting.sourceType,
    summary: meeting.summary,
    title: meeting.title,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/meetings/new">
              <Plus aria-hidden="true" className="mr-2 size-4" />
              New meeting
            </Link>
          </Button>
        }
        description="Manual meeting memory, participants, and source metadata before later note and AI workflows."
        eyebrow="Relationship memory"
        title="Meetings"
      />

      <CockpitCard
        eyebrow="Meetings"
        title="Active meeting records"
        value={meetings.length}
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Tenant-scoped meetings visible in this workspace.
        </p>
      </CockpitCard>

      {meetingCards.length > 0 ? (
        <section aria-label="Meeting list" className="grid gap-3">
          {meetingCards.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </section>
      ) : (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/meetings/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                Create meeting
              </Link>
            </Button>
          }
          description="Create a manual meeting record to preserve context, participants, and source metadata."
          icon={CalendarDays}
          title="No meetings yet"
        />
      )}
    </div>
  );
}
