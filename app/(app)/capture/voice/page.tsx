import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { PrivacyRetentionNotice } from "@/modules/voice-notes/components/privacy-retention-notice";
import {
  SourceContextChips,
  type VoiceSourceContextChip,
} from "@/modules/voice-notes/components/source-context-chips";
import { VoiceRecorder } from "@/modules/voice-notes/components/voice-recorder";
import { getTenantCompany } from "@/server/services/companies";
import { getTenantMeeting } from "@/server/services/meetings";
import { getTenantNote } from "@/server/services/notes";
import { getTenantPerson } from "@/server/services/people";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type VoiceCapturePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function safeResolve<T>(callback: () => Promise<T | null>) {
  try {
    return await callback();
  } catch {
    return null;
  }
}

export default async function VoiceCapturePage({
  searchParams,
}: VoiceCapturePageProps) {
  const [params, context] = await Promise.all([
    searchParams,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect("/sign-in?callbackUrl=/capture/voice");
  }

  const hintedIds = {
    companyId: firstSearchParam(params.companyId),
    meetingId: firstSearchParam(params.meetingId),
    noteId: firstSearchParam(params.noteId),
    personId: firstSearchParam(params.personId),
  };

  const [person, company, meeting, note] = await Promise.all([
    hintedIds.personId
      ? safeResolve(() => getTenantPerson(context, hintedIds.personId!))
      : null,
    hintedIds.companyId
      ? safeResolve(() => getTenantCompany(context, hintedIds.companyId!))
      : null,
    hintedIds.meetingId
      ? safeResolve(() => getTenantMeeting(context, hintedIds.meetingId!))
      : null,
    hintedIds.noteId
      ? safeResolve(() => getTenantNote(context, hintedIds.noteId!))
      : null,
  ]);

  const sourceChips: VoiceSourceContextChip[] = [
    person
      ? {
          href: `/people/${person.id}`,
          id: person.id,
          label: person.displayName,
          type: "person" as const,
        }
      : null,
    company
      ? {
          href: `/people/companies/${company.id}`,
          id: company.id,
          label: company.name,
          type: "company" as const,
        }
      : null,
    meeting
      ? {
          href: `/meetings/${meeting.id}`,
          id: meeting.id,
          label: meeting.title,
          type: "meeting" as const,
        }
      : null,
    note
      ? {
          href: `/notes/${note.id}`,
          id: note.id,
          label: note.summary ?? "Linked note",
          type: "note" as const,
        }
      : null,
  ].filter((chip): chip is VoiceSourceContextChip => Boolean(chip));

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href="/capture">
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Capture
            </Link>
          </Button>
        }
        description="Record audio in your browser, submit it for transcription, then review the stored transcript."
        eyebrow="Voice capture"
        title="Record voice note"
      />

      <VoiceRecorder
        context={{
          companyId: company?.id ?? null,
          meetingId: meeting?.id ?? null,
          noteId: note?.id ?? null,
          personId: person?.id ?? null,
        }}
        sourceChips={sourceChips}
      />

      <CockpitCard title="Source context">
        <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
          <p>
            Query parameters are treated as hints only. This page shows and
            submits only context that belongs to the current workspace.
          </p>
          <SourceContextChips chips={sourceChips} />
        </div>
      </CockpitCard>

      <PrivacyRetentionNotice />
    </div>
  );
}
