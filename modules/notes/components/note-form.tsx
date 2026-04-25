"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NoteType, RecordSourceType, Sensitivity } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  initialNotesActionState,
  type NotesActionState,
} from "@/modules/notes/action-state";
import {
  createMeetingNoteAction,
  createNoteAction,
  updateNoteAction,
} from "@/modules/notes/actions";
import { FieldError } from "@/modules/notes/components/field-error";
import {
  editableNoteTypes,
  editableSensitivityTypes,
  noteTypeLabel,
  recordSourceTypeLabel,
  sensitivityLabel,
} from "@/modules/notes/labels";
import { editableRecordSourceTypes } from "@/modules/meetings/labels";

export type NoteFormPerson = {
  id: string;
  name: string;
};

export type NoteFormCompany = {
  id: string;
  name: string;
};

export type NoteFormMeeting = {
  id: string;
  title: string;
};

export type NoteFormInitialValues = {
  body?: string;
  companyId?: string | null;
  meetingId?: string | null;
  noteType?: NoteType;
  personId?: string | null;
  sensitivity?: Sensitivity;
  sourceType?: RecordSourceType;
  summary?: string | null;
};

type NoteFormProps = {
  companies: NoteFormCompany[];
  initialValues?: NoteFormInitialValues;
  lockedMeeting?: NoteFormMeeting;
  meetings: NoteFormMeeting[];
  mode: "create" | "edit";
  noteId?: string;
  people: NoteFormPerson[];
};

function firstError(state: NotesActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

export function NoteForm({
  companies,
  initialValues,
  lockedMeeting,
  meetings,
  mode,
  noteId,
  people,
}: NoteFormProps) {
  const router = useRouter();
  const [state, setState] = useState<NotesActionState>(
    initialNotesActionState,
  );
  const [pending, startTransition] = useTransition();
  const cancelHref =
    noteId && mode === "edit"
      ? `/notes/${noteId}`
      : lockedMeeting
        ? `/meetings/${lockedMeeting.id}`
        : "/capture";
  const defaultNoteType =
    initialValues?.noteType ?? (lockedMeeting ? "MEETING" : "GENERAL");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        mode === "edit"
          ? await updateNoteAction(noteId ?? "", formData)
          : lockedMeeting
            ? await createMeetingNoteAction(lockedMeeting.id, formData)
            : await createNoteAction(formData);

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

      {lockedMeeting ? (
        <div className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
          Linked to meeting:{" "}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href={`/meetings/${lockedMeeting.id}`}
          >
            {lockedMeeting.title}
          </Link>
        </div>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Note body</span>
        <Textarea
          aria-describedby="body-error"
          aria-invalid={Boolean(firstError(state, "body"))}
          defaultValue={initialValues?.body ?? ""}
          name="body"
          required
          rows={10}
        />
        <FieldError id="body-error" message={firstError(state, "body")} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">
          Manual summary
        </span>
        <Textarea
          aria-describedby="summary-error"
          aria-invalid={Boolean(firstError(state, "summary"))}
          defaultValue={initialValues?.summary ?? ""}
          name="summary"
          rows={4}
        />
        <FieldError
          id="summary-error"
          message={firstError(state, "summary")}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Type</span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 md:text-sm"
            defaultValue={defaultNoteType}
            disabled={Boolean(lockedMeeting)}
            name="noteType"
          >
            {editableNoteTypes.map((noteType) => (
              <option key={noteType} value={noteType}>
                {noteTypeLabel(noteType)}
              </option>
            ))}
          </select>
          {lockedMeeting ? (
            <input name="noteType" type="hidden" value="MEETING" />
          ) : null}
          <FieldError
            id="noteType-error"
            message={firstError(state, "noteType")}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Sensitivity
          </span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues?.sensitivity ?? "NORMAL"}
            name="sensitivity"
          >
            {editableSensitivityTypes.map((sensitivity) => (
              <option key={sensitivity} value={sensitivity}>
                {sensitivityLabel(sensitivity)}
              </option>
            ))}
          </select>
          <FieldError
            id="sensitivity-error"
            message={firstError(state, "sensitivity")}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Source</span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues?.sourceType ?? "MANUAL"}
            name="sourceType"
          >
            {editableRecordSourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {recordSourceTypeLabel(sourceType)}
              </option>
            ))}
          </select>
          <FieldError
            id="sourceType-error"
            message={firstError(state, "sourceType")}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Person</span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues?.personId ?? ""}
            name="personId"
          >
            <option value="">No person link</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
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
            defaultValue={initialValues?.companyId ?? ""}
            name="companyId"
          >
            <option value="">No company link</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
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
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 md:text-sm"
            defaultValue={lockedMeeting?.id ?? initialValues?.meetingId ?? ""}
            disabled={Boolean(lockedMeeting)}
            name="meetingId"
          >
            <option value="">No meeting link</option>
            {(lockedMeeting ? [lockedMeeting] : meetings).map((meeting) => (
              <option key={meeting.id} value={meeting.id}>
                {meeting.title}
              </option>
            ))}
          </select>
          {lockedMeeting ? (
            <input name="meetingId" type="hidden" value={lockedMeeting.id} />
          ) : null}
          <FieldError
            id="meetingId-error"
            message={firstError(state, "meetingId")}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving" : "Save note"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
