import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MeetingForm } from "@/modules/meetings/components/meeting-form";
import { listTenantCompanies } from "@/server/services/companies";
import { getTenantMeeting } from "@/server/services/meetings";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type EditMeetingPageProps = {
  params: Promise<{
    meetingId: string;
  }>;
};

export default async function EditMeetingPage({ params }: EditMeetingPageProps) {
  const [{ meetingId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/meetings/${meetingId}/edit`);
  }

  const [meeting, companies] = await Promise.all([
    getTenantMeeting(context, meetingId),
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
        description="Meeting basics, timing, company context, and source."
        eyebrow="Edit meeting"
        title={meeting.title}
      />

      <Card className="p-4">
        <MeetingForm
          companies={companies.map((company) => ({
            id: company.id,
            name: company.name,
          }))}
          initialValues={{
            endedAt: meeting.endedAt,
            location: meeting.location,
            occurredAt: meeting.occurredAt,
            primaryCompanyId: meeting.primaryCompanyId,
            sourceType: meeting.sourceType,
            summary: meeting.summary,
            title: meeting.title,
          }}
          meetingId={meeting.id}
          mode="edit"
        />
      </Card>
    </div>
  );
}
