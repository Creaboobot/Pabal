import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NoteForm } from "@/modules/notes/components/note-form";
import { noteTypeLabel } from "@/modules/notes/labels";
import { listTenantCompanies } from "@/server/services/companies";
import { listTenantMeetings } from "@/server/services/meetings";
import { getTenantNoteProfile } from "@/server/services/notes";
import { listTenantPeople } from "@/server/services/people";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type EditNotePageProps = {
  params: Promise<{
    noteId: string;
  }>;
};

export default async function EditNotePage({ params }: EditNotePageProps) {
  const [{ noteId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/notes/${noteId}/edit`);
  }

  const [note, companies, meetings, people] = await Promise.all([
    getTenantNoteProfile(context, noteId),
    listTenantCompanies(context),
    listTenantMeetings(context),
    listTenantPeople(context),
  ]);

  if (!note) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href={`/notes/${note.id}`}>
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Note
            </Link>
          </Button>
        }
        description="Update note content, source labels, sensitivity, and direct context links."
        eyebrow="Edit note"
        title={noteTypeLabel(note.noteType)}
      />

      <Card className="p-4">
        <NoteForm
          companies={companies.map((company) => ({
            id: company.id,
            name: company.name,
          }))}
          initialValues={{
            body: note.body,
            companyId: note.companyId,
            meetingId: note.meetingId,
            noteType: note.noteType,
            personId: note.personId,
            sensitivity: note.sensitivity,
            sourceType: note.sourceType,
            summary: note.summary,
          }}
          meetings={meetings.map((meeting) => ({
            id: meeting.id,
            title: meeting.title,
          }))}
          mode="edit"
          noteId={note.id}
          people={people.map((person) => ({
            id: person.id,
            name: person.displayName,
          }))}
        />
      </Card>
    </div>
  );
}
