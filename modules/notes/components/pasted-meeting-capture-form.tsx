"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTimeLocal } from "@/modules/meetings/labels";
import {
  initialNotesActionState,
  type NotesActionState,
} from "@/modules/notes/action-state";
import { createPastedMeetingCaptureAction } from "@/modules/notes/actions";
import { FieldError } from "@/modules/notes/components/field-error";
import {
  editableSensitivityTypes,
  sensitivityLabel,
} from "@/modules/notes/labels";

export type PastedCaptureCompany = {
  id: string;
  name: string;
};

export type PastedCapturePerson = {
  email: string | null;
  id: string;
  name: string;
};

type PastedMeetingCaptureFormProps = {
  companies: PastedCaptureCompany[];
  people: PastedCapturePerson[];
};

function firstError(state: NotesActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

export function PastedMeetingCaptureForm({
  companies,
  people,
}: PastedMeetingCaptureFormProps) {
  const router = useRouter();
  const [state, setState] = useState<NotesActionState>(
    initialNotesActionState,
  );
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createPastedMeetingCaptureAction(formData);

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

      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
        Pasted notes are stored exactly as provided. This flow does not parse,
        summarise, extract actions, create AI proposals, or call Microsoft
        services.
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">
          Meeting title
        </span>
        <Input
          aria-describedby="title-error"
          aria-invalid={Boolean(firstError(state, "title"))}
          name="title"
          required
        />
        <FieldError id="title-error" message={firstError(state, "title")} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Start time
          </span>
          <Input
            aria-describedby="occurredAt-error"
            aria-invalid={Boolean(firstError(state, "occurredAt"))}
            defaultValue={formatDateTimeLocal(new Date())}
            name="occurredAt"
            required
            type="datetime-local"
          />
          <FieldError
            id="occurredAt-error"
            message={firstError(state, "occurredAt")}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">End time</span>
          <Input
            aria-describedby="endedAt-error"
            aria-invalid={Boolean(firstError(state, "endedAt"))}
            name="endedAt"
            type="datetime-local"
          />
          <FieldError
            id="endedAt-error"
            message={firstError(state, "endedAt")}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Primary company
          </span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            name="primaryCompanyId"
          >
            <option value="">No primary company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <FieldError
            id="primaryCompanyId-error"
            message={firstError(state, "primaryCompanyId")}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Sensitivity
          </span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue="NORMAL"
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
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium text-foreground">
          Known participants
        </legend>
        {people.length > 0 ? (
          <div className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
            {people.map((person) => (
              <label
                className="flex min-h-11 items-start gap-3 rounded-md px-2 py-2 text-sm text-foreground"
                key={person.id}
              >
                <input
                  className="mt-1 size-4"
                  name="participantPersonIds"
                  type="checkbox"
                  value={person.id}
                />
                <span>
                  {person.name}
                  {person.email ? (
                    <span className="block text-muted-foreground">
                      {person.email}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
            Add people first to link known participants during pasted capture.
          </p>
        )}
        <FieldError
          id="participantPersonIds-error"
          message={firstError(state, "participantPersonIds")}
        />
      </fieldset>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">
          Manual summary
        </span>
        <Textarea
          aria-describedby="summary-error"
          aria-invalid={Boolean(firstError(state, "summary"))}
          name="summary"
          rows={4}
        />
        <FieldError
          id="summary-error"
          message={firstError(state, "summary")}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">
          Pasted Teams/Copilot notes
        </span>
        <Textarea
          aria-describedby="body-error"
          aria-invalid={Boolean(firstError(state, "body"))}
          name="body"
          required
          rows={16}
        />
        <FieldError id="body-error" message={firstError(state, "body")} />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving" : "Save pasted meeting note"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href="/capture">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
