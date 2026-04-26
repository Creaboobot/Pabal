import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Edit,
  FileText,
  Handshake,
  Lightbulb,
  Plus,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { archiveNoteAction } from "@/modules/notes/actions";
import {
  NoteSourceBadge,
  NoteTypeBadge,
  SensitivityBadge,
} from "@/modules/notes/components/note-badges";
import { NoteActionButton } from "@/modules/notes/components/note-action-button";
import {
  formatNoteDateTime,
  noteTypeLabel,
  recordSourceTypeLabel,
} from "@/modules/notes/labels";
import { getTenantNoteProfile } from "@/server/services/notes";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type NoteDetailPageProps = {
  params: Promise<{
    noteId: string;
  }>;
};

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const [{ noteId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/notes/${noteId}`);
  }

  const note = await getTenantNoteProfile(context, noteId);

  if (!note) {
    notFound();
  }

  const backHref = note.meetingId
    ? `/meetings/${note.meetingId}`
    : note.personId
      ? `/people/${note.personId}`
      : note.companyId
        ? `/people/companies/${note.companyId}`
        : "/capture";

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href={backHref}>
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Context
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/notes/${note.id}/edit`}>
                <Edit aria-hidden="true" className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/tasks/new?noteId=${note.id}`}>
                <Plus aria-hidden="true" className="mr-2 size-4" />
                Create task
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/commitments/new?noteId=${note.id}`}>
                <Handshake aria-hidden="true" className="mr-2 size-4" />
                Create commitment
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/opportunities/needs/new?noteId=${note.id}`}>
                <Lightbulb aria-hidden="true" className="mr-2 size-4" />
                Create need
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/opportunities/capabilities/new?noteId=${note.id}`}
              >
                <BadgeCheck aria-hidden="true" className="mr-2 size-4" />
                Create capability
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/opportunities/introductions/new?sourceNoteId=${note.id}`}
              >
                <Handshake aria-hidden="true" className="mr-2 size-4" />
                Create introduction
              </Link>
            </Button>
          </div>
        }
        description={formatNoteDateTime(note.createdAt)}
        eyebrow="Note"
        title={noteTypeLabel(note.noteType)}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <CockpitCard title="Note context">
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <NoteTypeBadge noteType={note.noteType} />
              <NoteSourceBadge sourceType={note.sourceType} />
              <SensitivityBadge sensitivity={note.sensitivity} />
            </div>

            <div className="grid gap-2 text-sm text-muted-foreground">
              {note.meeting ? (
                <Link
                  className="flex items-center gap-2 rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/meetings/${note.meeting.id}`}
                >
                  <CalendarDays aria-hidden="true" className="size-4" />
                  {note.meeting.title}
                </Link>
              ) : null}
              {note.person ? (
                <Link
                  className="flex items-center gap-2 rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/${note.person.id}`}
                >
                  <UserRound aria-hidden="true" className="size-4" />
                  {note.person.displayName}
                </Link>
              ) : null}
              {note.company ? (
                <Link
                  className="flex items-center gap-2 rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/companies/${note.company.id}`}
                >
                  <Building2 aria-hidden="true" className="size-4" />
                  {note.company.name}
                </Link>
              ) : null}
            </div>
          </div>
        </CockpitCard>

        <CockpitCard title="Source references">
          <div className="grid gap-3 text-sm text-muted-foreground">
            <p>
              Source references record provenance only. They do not trigger
              extraction or mutation.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {note.sourceReferences.length} outgoing
              </Badge>
              <Badge variant="outline">
                {note.targetReferences.length} incoming
              </Badge>
            </div>
            {note.sourceReferences.map((reference) => (
              <div
                className="rounded-md border border-border bg-background p-3"
                key={reference.id}
              >
                <p className="font-medium text-foreground">
                  {reference.sourceEntityType} to {reference.targetEntityType}
                </p>
                {reference.label ? (
                  <p className="mt-1">{reference.label}</p>
                ) : null}
              </div>
            ))}
          </div>
        </CockpitCard>
      </section>

      {note.summary ? (
        <CockpitCard title="Manual summary">
          <p className="text-sm leading-6 text-muted-foreground">
            {note.summary}
          </p>
        </CockpitCard>
      ) : null}

      <CockpitCard title="Body">
        <div className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {note.body}
        </div>
      </CockpitCard>

      <NoteActionButton
        action={archiveNoteAction.bind(null, note.id)}
        confirmLabel="Archive note"
        description={`The note will be hidden from active views. ${recordSourceTypeLabel(
          note.sourceType,
        )} source metadata and related records stay intact.`}
        label="Archive"
        pendingLabel="Archiving"
        title="Archive this note?"
      />
    </div>
  );
}
