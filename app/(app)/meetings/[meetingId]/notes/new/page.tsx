import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NoteForm } from "@/modules/notes/components/note-form";
import { listTenantCompanies } from "@/server/services/companies";
import { getTenantMeeting } from "@/server/services/meetings";
import { listTenantPeople } from "@/server/services/people";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type NewMeetingNotePageProps = {
  params: Promise<{
    meetingId: string;
  }>;
};

export default async function NewMeetingNotePage({
  params,
}: NewMeetingNotePageProps) {
  const [{ meetingId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/meetings/${meetingId}/notes/new`);
  }

  const [meeting, companies, people] = await Promise.all([
    getTenantMeeting(context, meetingId),
    listTenantCompanies(context),
    listTenantPeople(context),
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
        description="Add a manual note to this meeting."
        eyebrow="Meeting note"
        title={meeting.title}
      />

      <Card className="p-4">
        <NoteForm
          companies={companies.map((company) => ({
            id: company.id,
            name: company.name,
          }))}
          initialValues={{
            companyId: meeting.primaryCompanyId,
            meetingId: meeting.id,
            noteType: "MEETING",
            sourceType: "MANUAL",
          }}
          lockedMeeting={{
            id: meeting.id,
            title: meeting.title,
          }}
          meetings={[]}
          mode="create"
          people={people.map((person) => ({
            id: person.id,
            name: person.displayName,
          }))}
        />
      </Card>
    </div>
  );
}
