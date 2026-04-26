import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import {
  NoteSourceBadge,
  NoteTypeBadge,
  SensitivityBadge,
} from "@/modules/notes/components/note-badges";
import { formatNoteDateTime, notePreview } from "@/modules/notes/labels";
import { getCurrentUserContext } from "@/server/services/session";
import { listTenantNotes } from "@/server/services/notes";

export const dynamic = "force-dynamic";

const NOTES_INDEX_LIMIT = 25;

export default async function NotesPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/notes");
  }

  const notes = (await listTenantNotes(context)).slice(0, NOTES_INDEX_LIMIT);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/notes/new">
              <Plus aria-hidden="true" className="mr-2 size-4" />
              Create note
            </Link>
          </Button>
        }
        description="Recent tenant-scoped notes from manual capture, meetings, and user-provided sources."
        eyebrow="Knowledge"
        title="Notes"
      />

      <CockpitCard
        title="Recent notes"
        value={notes.length}
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Notes are listed newest first and remain scoped to the active
          workspace. This index does not run AI summaries, semantic search, or
          imports.
        </p>
      </CockpitCard>

      {notes.length > 0 ? (
        <section className="grid gap-3 lg:grid-cols-2" aria-label="Recent notes">
          {notes.map((note) => (
            <article
              className="rounded-md border border-border bg-card p-4 shadow-sm"
              key={note.id}
            >
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <FileText aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-foreground">
                      {note.summary?.trim() || "Note"}
                    </h2>
                    <time
                      className="text-sm text-muted-foreground"
                      dateTime={note.updatedAt.toISOString()}
                    >
                      Updated {formatNoteDateTime(note.updatedAt)}
                    </time>
                  </div>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  {notePreview(note)}
                </p>

                <div className="flex flex-wrap gap-2">
                  <NoteTypeBadge noteType={note.noteType} />
                  <NoteSourceBadge sourceType={note.sourceType} />
                  <SensitivityBadge sensitivity={note.sensitivity} />
                </div>

                <div>
                  <Button asChild variant="outline">
                    <Link href={`/notes/${note.id}`}>
                      Open note
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
              <Link href="/notes/new">Create first note</Link>
            </Button>
          }
          description="Create a manual note, paste Teams/Copilot meeting notes, or add LinkedIn user-provided context from a person or company page."
          icon={FileText}
          title="No notes yet"
        />
      )}
    </div>
  );
}
