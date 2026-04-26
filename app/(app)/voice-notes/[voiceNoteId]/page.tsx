import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  HardDrive,
  Languages,
  Mic,
  Sparkles,
  Timer,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  archiveVoiceNoteAction,
  createProposalFromVoiceNoteAction,
} from "@/modules/voice-notes/actions";
import { PrivacyRetentionNotice } from "@/modules/voice-notes/components/privacy-retention-notice";
import {
  SourceContextChips,
  type VoiceSourceContextChip,
} from "@/modules/voice-notes/components/source-context-chips";
import { VoiceNoteActionButton } from "@/modules/voice-notes/components/voice-note-action-button";
import {
  VoiceNoteStatusBadge,
  VoiceRetentionBadge,
} from "@/modules/voice-notes/components/voice-note-badges";
import {
  formatVoiceConfidence,
  formatVoiceDateTime,
  formatVoiceDuration,
} from "@/modules/voice-notes/labels";
import { getCurrentUserContext } from "@/server/services/session";
import { getTenantVoiceNoteProfile } from "@/server/services/voice-notes";

export const dynamic = "force-dynamic";

type VoiceNoteDetailPageProps = {
  params: Promise<{
    voiceNoteId: string;
  }>;
};

function sourceChipsForVoiceNote(voiceNote: Awaited<ReturnType<typeof getTenantVoiceNoteProfile>>) {
  if (!voiceNote) {
    return [];
  }

  const chips: Array<VoiceSourceContextChip | null> = [
    voiceNote.person
      ? {
          href: `/people/${voiceNote.person.id}`,
          id: voiceNote.person.id,
          label: voiceNote.person.displayName,
          type: "person",
        }
      : null,
    voiceNote.company
      ? {
          href: `/people/companies/${voiceNote.company.id}`,
          id: voiceNote.company.id,
          label: voiceNote.company.name,
          type: "company",
        }
      : null,
    voiceNote.meeting
      ? {
          href: `/meetings/${voiceNote.meeting.id}`,
          id: voiceNote.meeting.id,
          label: voiceNote.meeting.title,
          type: "meeting",
        }
      : null,
    voiceNote.note
      ? {
          href: `/notes/${voiceNote.note.id}`,
          id: voiceNote.note.id,
          label: voiceNote.note.summary ?? "Linked note",
          type: "note",
        }
      : null,
  ];

  return chips.filter((chip): chip is VoiceSourceContextChip => Boolean(chip));
}

export default async function VoiceNoteDetailPage({
  params,
}: VoiceNoteDetailPageProps) {
  const [{ voiceNoteId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/voice-notes/${voiceNoteId}`);
  }

  const voiceNote = await getTenantVoiceNoteProfile(context, voiceNoteId);

  if (!voiceNote) {
    notFound();
  }

  const sourceChips = sourceChipsForVoiceNote(voiceNote);
  const linkedProposals = voiceNote.aiProposals ?? [];
  const hasUsableTranscript = Boolean(
    voiceNote.editedTranscriptText?.trim() || voiceNote.transcriptText?.trim(),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/capture">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Capture
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/voice-notes/${voiceNote.id}/edit`}>
                <Edit aria-hidden="true" className="mr-2 size-4" />
                Edit review
              </Link>
            </Button>
          </div>
        }
        description={`Created ${formatVoiceDateTime(voiceNote.createdAt)}`}
        eyebrow="Voice note"
        title={voiceNote.title ?? "Voice note"}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <CockpitCard title="Transcript status">
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <div className="flex flex-wrap gap-2">
              <VoiceNoteStatusBadge status={voiceNote.status} />
              <VoiceRetentionBadge status={voiceNote.audioRetentionStatus} />
              <Badge variant="outline">
                {formatVoiceConfidence(voiceNote.transcriptConfidence)}
              </Badge>
            </div>
            <span className="flex items-center gap-2">
              <Languages aria-hidden="true" className="size-4" />
              {voiceNote.language ?? "Language unavailable"}
            </span>
            <span className="flex items-center gap-2">
              <Timer aria-hidden="true" className="size-4" />
              {formatVoiceDuration(voiceNote.audioDurationSeconds)}
            </span>
          </div>
        </CockpitCard>

        <CockpitCard title="Audio retention">
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <span className="flex items-center gap-2">
              <Mic aria-hidden="true" className="size-4" />
              {voiceNote.audioMimeType ?? "Audio type unavailable"}
            </span>
            <span className="flex items-center gap-2">
              <HardDrive aria-hidden="true" className="size-4" />
              {voiceNote.audioSizeBytes
                ? `${voiceNote.audioSizeBytes.toLocaleString()} bytes processed`
                : "Audio size unavailable"}
            </span>
            <p>
              Raw audio is not retained by default. The transcript remains as
              the stored source record.
            </p>
          </div>
        </CockpitCard>
      </section>

      <CockpitCard title="Source context">
        <SourceContextChips chips={sourceChips} />
      </CockpitCard>

      <CockpitCard title="Transcript">
        <div className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {voiceNote.transcriptText ?? "Transcript unavailable."}
        </div>
      </CockpitCard>

      {voiceNote.editedTranscriptText ? (
        <CockpitCard title="Reviewed transcript">
          <div className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {voiceNote.editedTranscriptText}
          </div>
        </CockpitCard>
      ) : null}

      <CockpitCard title="Proposal from transcript">
        <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles aria-hidden="true" className="size-4 text-foreground" />
            <span>
              Structure this transcript into review-only proposal items.
            </span>
          </div>
          <p>
            The transcript is sent to the configured AI provider for
            structuring. Proposed changes are review-only: no records are
            updated automatically, and approving proposal items still does not
            apply them.
          </p>
          {linkedProposals.length > 0 ? (
            <div className="grid gap-2">
              <p className="font-medium text-foreground">Linked proposals</p>
              <div className="flex flex-wrap gap-2">
                {linkedProposals.map((proposal) => (
                  <Button
                    asChild
                    key={proposal.id}
                    size="sm"
                    variant="outline"
                  >
                    <Link href={`/proposals/${proposal.id}`}>
                      {proposal.title}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {hasUsableTranscript ? (
            <VoiceNoteActionButton
              action={createProposalFromVoiceNoteAction.bind(
                null,
                voiceNote.id,
              )}
              confirmLabel="Send transcript"
              description="This sends the transcript to the configured AI provider for structuring. It creates AIProposal review records only. It will not update people, companies, tasks, commitments, opportunities, or any other target record."
              label="Create proposal from transcript"
              pendingLabel="Structuring"
              title="Create a review-only proposal?"
            />
          ) : (
            <p>No transcript is available to structure yet.</p>
          )}
        </div>
      </CockpitCard>

      <CockpitCard title="Review boundaries">
        <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
          <p>No automatic record updates were created.</p>
          <p>
            Any AI proposal created from this transcript remains review-only.
          </p>
          <p>No voice mention extraction was created.</p>
          <p>Updated {formatVoiceDateTime(voiceNote.updatedAt)}</p>
        </div>
      </CockpitCard>

      <PrivacyRetentionNotice />

      <VoiceNoteActionButton
        action={archiveVoiceNoteAction.bind(null, voiceNote.id)}
        confirmLabel="Archive voice note"
        description="The voice note will be hidden from active views. Transcript text remains protected by workspace access and no linked records are changed."
        label="Archive"
        pendingLabel="Archiving"
        title="Archive this voice note?"
      />
    </div>
  );
}
