"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  initialVoiceNotesActionState,
  type VoiceNotesActionState,
} from "@/modules/voice-notes/action-state";
import { updateVoiceNoteAction } from "@/modules/voice-notes/actions";
import { FieldError } from "@/modules/voice-notes/components/field-error";

export type VoiceNoteFormOption = {
  id: string;
  label: string;
};

export type VoiceNoteFormInitialValues = {
  companyId?: string | null;
  editedTranscriptText?: string | null;
  meetingId?: string | null;
  noteId?: string | null;
  personId?: string | null;
  title?: string | null;
  transcriptText?: string | null;
};

type VoiceNoteFormProps = {
  companies: VoiceNoteFormOption[];
  initialValues: VoiceNoteFormInitialValues;
  meetings: VoiceNoteFormOption[];
  notes: VoiceNoteFormOption[];
  people: VoiceNoteFormOption[];
  voiceNoteId: string;
};

function firstError(state: VoiceNotesActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

export function VoiceNoteForm({
  companies,
  initialValues,
  meetings,
  notes,
  people,
  voiceNoteId,
}: VoiceNoteFormProps) {
  const router = useRouter();
  const [state, setState] = useState<VoiceNotesActionState>(
    initialVoiceNotesActionState,
  );
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateVoiceNoteAction(voiceNoteId, formData);

      setState(result);

      if (result.status === "success" && result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      {state.message ? (
        <div className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
          {state.message}
        </div>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Title</span>
        <Input
          aria-describedby="title-error"
          aria-invalid={Boolean(firstError(state, "title"))}
          defaultValue={initialValues.title ?? ""}
          name="title"
          placeholder="Optional voice note title"
        />
        <FieldError id="title-error" message={firstError(state, "title")} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">
          Reviewed transcript
        </span>
        <Textarea
          aria-describedby="editedTranscriptText-error"
          aria-invalid={Boolean(firstError(state, "editedTranscriptText"))}
          defaultValue={
            initialValues.editedTranscriptText ??
            initialValues.transcriptText ??
            ""
          }
          name="editedTranscriptText"
          rows={14}
        />
        <FieldError
          id="editedTranscriptText-error"
          message={firstError(state, "editedTranscriptText")}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Person</span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues.personId ?? ""}
            name="personId"
          >
            <option value="">No person link</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
          <FieldError
            id="personId-error"
            message={firstError(state, "personId")}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Company</span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues.companyId ?? ""}
            name="companyId"
          >
            <option value="">No company link</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.label}
              </option>
            ))}
          </select>
          <FieldError
            id="companyId-error"
            message={firstError(state, "companyId")}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Meeting</span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues.meetingId ?? ""}
            name="meetingId"
          >
            <option value="">No meeting link</option>
            {meetings.map((meeting) => (
              <option key={meeting.id} value={meeting.id}>
                {meeting.label}
              </option>
            ))}
          </select>
          <FieldError
            id="meetingId-error"
            message={firstError(state, "meetingId")}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Note</span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues.noteId ?? ""}
            name="noteId"
          >
            <option value="">No note link</option>
            {notes.map((note) => (
              <option key={note.id} value={note.id}>
                {note.label}
              </option>
            ))}
          </select>
          <FieldError id="noteId-error" message={firstError(state, "noteId")} />
        </label>
      </div>

      <div className="rounded-md border border-border bg-muted p-3 text-sm leading-6 text-muted-foreground">
        Saving marks this transcript as reviewed. It does not structure the
        transcript, create proposals, or update linked records.
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving" : "Save review"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href={`/voice-notes/${voiceNoteId}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
