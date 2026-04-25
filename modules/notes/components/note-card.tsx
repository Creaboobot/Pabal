import Link from "next/link";
import { FileText } from "lucide-react";
import type { NoteType, RecordSourceType, Sensitivity } from "@prisma/client";

import {
  NoteSourceBadge,
  NoteTypeBadge,
  SensitivityBadge,
} from "@/modules/notes/components/note-badges";
import { formatNoteDateTime, notePreview } from "@/modules/notes/labels";

export type NoteCardNote = {
  body?: string | null;
  createdAt: Date;
  id: string;
  noteType: NoteType;
  sensitivity: Sensitivity;
  sourceType: RecordSourceType;
  summary: string | null;
};

type NoteCardProps = {
  note: NoteCardNote;
};

export function NoteCard({ note }: NoteCardProps) {
  return (
    <article className="rounded-md border border-border bg-background p-3">
      <div className="flex items-start gap-3">
        <FileText aria-hidden="true" className="mt-0.5 size-5 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="rounded-sm font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
              href={`/notes/${note.id}`}
            >
              {notePreview({ body: note.body, summary: note.summary })}
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNoteDateTime(note.createdAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <NoteTypeBadge noteType={note.noteType} />
            <NoteSourceBadge sourceType={note.sourceType} />
            <SensitivityBadge sensitivity={note.sensitivity} />
          </div>
        </div>
      </div>
    </article>
  );
}
