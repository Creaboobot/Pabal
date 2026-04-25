import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MeetingParticipantForm } from "@/modules/meetings/components/meeting-participant-form";
import { listTenantCompanies } from "@/server/services/companies";
import { getTenantMeeting } from "@/server/services/meetings";
import { listTenantPeople } from "@/server/services/people";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type NewMeetingParticipantPageProps = {
  params: Promise<{
    meetingId: string;
  }>;
};

export default async function NewMeetingParticipantPage({
  params,
}: NewMeetingParticipantPageProps) {
  const [{ meetingId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/meetings/${meetingId}/participants/new`);
  }

  const [meeting, people, companies] = await Promise.all([
    getTenantMeeting(context, meetingId),
    listTenantPeople(context),
    listTenantCompanies(context),
  ]);

  if (!meeting) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href={`/meetings/${meeting.id}`}>
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Meeting
            </Link>
          </Button>
        }
        description="Add a known person or snapshot participant to this meeting."
        eyebrow="Meeting participant"
        title={meeting.title}
      />

      <Card className="p-4">
        <MeetingParticipantForm
          companies={companies.map((company) => ({
            id: company.id,
            name: company.name,
          }))}
          meetingId={meeting.id}
          people={people.map((person) => ({
            email: person.email,
            id: person.id,
            name: person.displayName,
          }))}
        />
      </Card>
    </div>
  );
}
