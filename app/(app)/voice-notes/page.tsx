import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Mic, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import {
  VoiceNoteStatusBadge,
  VoiceRetentionBadge,
} from "@/modules/voice-notes/components/voice-note-badges";
import {
  formatVoiceDateTime,
  formatVoiceDuration,
} from "@/modules/voice-notes/labels";
import { getCurrentUserContext } from "@/server/services/session";
import { listTenantVoiceNotes } from "@/server/services/voice-notes";

export const dynamic = "force-dynamic";

const VOICE_NOTES_INDEX_LIMIT = 25;

function transcriptPreview(input: {
  editedTranscriptText: string | null;
  transcriptText: string | null;
}) {
  const text =
    input.editedTranscriptText?.trim() ||
    input.transcriptText?.trim() ||
    "Transcript unavailable.";

  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

export default async function VoiceNotesPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/voice-notes");
  }

  const voiceNotes = (await listTenantVoiceNotes(context)).slice(
    0,
    VOICE_NOTES_INDEX_LIMIT,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/capture/voice">
              <Plus aria-hidden="true" className="mr-2 size-4" />
              Record voice note
            </Link>
          </Button>
        }
        description="Recent tenant-scoped voice notes and transcript review records."
        eyebrow="Voice capture"
        title="Voice notes"
      />

      <CockpitCard title="Transcript review" value={voiceNotes.length}>
        <p className="text-sm leading-6 text-muted-foreground">
          Raw audio is not retained by default. This index shows stored
          transcripts and retention metadata only; re-transcription and bulk
          actions are not available here.
        </p>
      </CockpitCard>

      {voiceNotes.length > 0 ? (
        <section
          aria-label="Recent voice notes"
          className="grid gap-3 lg:grid-cols-2"
        >
          {voiceNotes.map((voiceNote) => (
            <article
              className="rounded-md border border-border bg-card p-4 shadow-sm"
              key={voiceNote.id}
            >
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <Mic aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-foreground">
                      {voiceNote.title?.trim() || "Voice note"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {formatVoiceDateTime(voiceNote.updatedAt)} -{" "}
                      {formatVoiceDuration(voiceNote.audioDurationSeconds)}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  {transcriptPreview(voiceNote)}
                </p>

                <div className="flex flex-wrap gap-2">
                  <VoiceNoteStatusBadge status={voiceNote.status} />
                  <VoiceRetentionBadge status={voiceNote.audioRetentionStatus} />
                </div>

                <div>
                  <Button asChild variant="outline">
                    <Link href={`/voice-notes/${voiceNote.id}`}>
                      Open voice note
                      <ArrowRight aria-hidden="true" className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/capture/voice">Record first voice note</Link>
            </Button>
          }
          description="Record a short voice note, transcribe it through the configured provider, then review the stored transcript."
          icon={Mic}
          title="No voice notes yet"
        />
      )}
    </div>
  );
}
