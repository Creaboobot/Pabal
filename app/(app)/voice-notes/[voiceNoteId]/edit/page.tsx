import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrivacyRetentionNotice } from "@/modules/voice-notes/components/privacy-retention-notice";
import { VoiceNoteForm } from "@/modules/voice-notes/components/voice-note-form";
import { listTenantCompanies } from "@/server/services/companies";
import { listTenantMeetings } from "@/server/services/meetings";
import { listTenantNotes } from "@/server/services/notes";
import { listTenantPeople } from "@/server/services/people";
import { getCurrentUserContext } from "@/server/services/session";
import { getTenantVoiceNoteProfile } from "@/server/services/voice-notes";

export const dynamic = "force-dynamic";

type EditVoiceNotePageProps = {
  params: Promise<{
    voiceNoteId: string;
  }>;
};

export default async function EditVoiceNotePage({
  params,
}: EditVoiceNotePageProps) {
  const [{ voiceNoteId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/voice-notes/${voiceNoteId}/edit`);
  }

  const [voiceNote, companies, meetings, notes, people] = await Promise.all([
    getTenantVoiceNoteProfile(context, voiceNoteId),
    listTenantCompanies(context),
    listTenantMeetings(context),
    listTenantNotes(context),
    listTenantPeople(context),
  ]);

  if (!voiceNote) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href={`/voice-notes/${voiceNote.id}`}>
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Voice note
            </Link>
          </Button>
        }
        description="Review the transcript and adjust direct source links. This does not re-transcribe or structure the text."
        eyebrow="Edit voice note"
        title={voiceNote.title ?? "Voice note"}
      />

      <Card className="p-4">
        <VoiceNoteForm
          companies={companies.map((company) => ({
            id: company.id,
            label: company.name,
          }))}
          initialValues={{
            companyId: voiceNote.companyId,
            editedTranscriptText: voiceNote.editedTranscriptText,
            meetingId: voiceNote.meetingId,
            noteId: voiceNote.noteId,
            personId: voiceNote.personId,
            title: voiceNote.title,
            transcriptText: voiceNote.transcriptText,
          }}
          meetings={meetings.map((meeting) => ({
            id: meeting.id,
            label: meeting.title,
          }))}
          notes={notes.map((note) => ({
            id: note.id,
            label:
              note.summary ?? (note.body.slice(0, 64) || "Untitled note"),
          }))}
          people={people.map((person) => ({
            id: person.id,
            label: person.displayName,
          }))}
          voiceNoteId={voiceNote.id}
        />
      </Card>

      <PrivacyRetentionNotice />
    </div>
  );
}
