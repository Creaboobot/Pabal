"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { IntroductionSuggestionStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  initialOpportunitiesActionState,
  type OpportunitiesActionState,
} from "@/modules/opportunities/action-state";
import {
  createIntroductionSuggestionAction,
  updateIntroductionSuggestionAction,
} from "@/modules/opportunities/actions";
import { FieldError } from "@/modules/opportunities/components/field-error";
import type { OpportunityFormOptions } from "@/modules/opportunities/components/need-form";
import {
  editableIntroductionStatuses,
  introductionStatusLabel,
} from "@/modules/opportunities/labels";

export type IntroductionSuggestionFormInitialValues = {
  capabilityId?: string | null;
  confidence?: number | null;
  fromCompanyId?: string | null;
  fromPersonId?: string | null;
  needId?: string | null;
  rationale?: string;
  sourceMeetingId?: string | null;
  sourceNoteId?: string | null;
  status?: IntroductionSuggestionStatus;
  toCompanyId?: string | null;
  toPersonId?: string | null;
};

type IntroductionSuggestionFormProps = {
  initialValues?: IntroductionSuggestionFormInitialValues;
  introductionSuggestionId?: string;
  mode: "create" | "edit";
  options: OpportunityFormOptions;
};

const selectClass =
  "min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

function firstError(state: OpportunitiesActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

function optionPreview(text: string | null, fallback: string) {
  if (!text) {
    return fallback;
  }

  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

export function IntroductionSuggestionForm({
  initialValues,
  introductionSuggestionId,
  mode,
  options,
}: IntroductionSuggestionFormProps) {
  const router = useRouter();
  const [state, setState] = useState<OpportunitiesActionState>(
    initialOpportunitiesActionState,
  );
  const [pending, startTransition] = useTransition();
  const cancelHref = introductionSuggestionId
    ? `/opportunities/introductions/${introductionSuggestionId}`
    : "/opportunities/introductions";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createIntroductionSuggestionAction(formData)
          : await updateIntroductionSuggestionAction(
              introductionSuggestionId ?? "",
              formData,
            );

      setState(result);

      if (result.status === "success" && result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <form
      aria-label="Introduction suggestion form"
      className="grid gap-5"
      onSubmit={onSubmit}
    >
      {state.message ? (
        <div className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
          {state.message}
        </div>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Rationale</span>
        <Textarea
          aria-describedby="rationale-error"
          aria-invalid={Boolean(firstError(state, "rationale"))}
          defaultValue={initialValues?.rationale ?? ""}
          name="rationale"
          required
          rows={6}
        />
        <FieldError
          id="rationale-error"
          message={firstError(state, "rationale")}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Status</span>
          <select
            className={selectClass}
            defaultValue={initialValues?.status ?? "PROPOSED"}
            name="status"
          >
            {editableIntroductionStatuses.map((status) => (
              <option key={status} value={status}>
                {introductionStatusLabel(status)}
              </option>
            ))}
          </select>
          <FieldError id="status-error" message={firstError(state, "status")} />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Confidence
          </span>
          <Input
            defaultValue={initialValues?.confidence ?? ""}
            max="1"
            min="0"
            name="confidence"
            placeholder="0.75"
            step="0.01"
            type="number"
          />
          <FieldError
            id="confidence-error"
            message={firstError(state, "confidence")}
          />
        </label>
      </div>

      <section className="grid gap-4 rounded-md border border-border bg-muted/40 p-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Introduction context
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Pick at least two linked records. These links are manual context
            only; no matching, scoring, message drafting, or AI generation runs
            from this form.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Need</span>
            <select
              className={selectClass}
              defaultValue={initialValues?.needId ?? ""}
              name="needId"
            >
              <option value="">No need</option>
              {options.needs.map((need) => (
                <option key={need.id} value={need.id}>
                  {need.title}
                </option>
              ))}
            </select>
            <FieldError id="needId-error" message={firstError(state, "needId")} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              Capability
            </span>
            <select
              className={selectClass}
              defaultValue={initialValues?.capabilityId ?? ""}
              name="capabilityId"
            >
              <option value="">No capability</option>
              {options.capabilities.map((capability) => (
                <option key={capability.id} value={capability.id}>
                  {capability.title}
                </option>
              ))}
            </select>
            <FieldError
              id="capabilityId-error"
              message={firstError(state, "capabilityId")}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-border bg-muted/40 p-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            From and to
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Select people or companies the introduction might connect. The app
            stores the suggestion only; it does not send outreach.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              From person
            </span>
            <select
              className={selectClass}
              defaultValue={initialValues?.fromPersonId ?? ""}
              name="fromPersonId"
            >
              <option value="">No person</option>
              {options.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
            <FieldError
              id="fromPersonId-error"
              message={firstError(state, "fromPersonId")}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              To person
            </span>
            <select
              className={selectClass}
              defaultValue={initialValues?.toPersonId ?? ""}
              name="toPersonId"
            >
              <option value="">No person</option>
              {options.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
            <FieldError
              id="toPersonId-error"
              message={firstError(state, "toPersonId")}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              From company
            </span>
            <select
              className={selectClass}
              defaultValue={initialValues?.fromCompanyId ?? ""}
              name="fromCompanyId"
            >
              <option value="">No company</option>
              {options.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <FieldError
              id="fromCompanyId-error"
              message={firstError(state, "fromCompanyId")}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              To company
            </span>
            <select
              className={selectClass}
              defaultValue={initialValues?.toCompanyId ?? ""}
              name="toCompanyId"
            >
              <option value="">No company</option>
              {options.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <FieldError
              id="toCompanyId-error"
              message={firstError(state, "toCompanyId")}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-border bg-muted/40 p-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Provenance
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Optional source links explain where the idea came from. They do not
            parse notes or meetings.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              Source meeting
            </span>
            <select
              className={selectClass}
              defaultValue={initialValues?.sourceMeetingId ?? ""}
              name="sourceMeetingId"
            >
              <option value="">No meeting</option>
              {options.meetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.title}
                </option>
              ))}
            </select>
            <FieldError
              id="sourceMeetingId-error"
              message={firstError(state, "sourceMeetingId")}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              Source note
            </span>
            <select
              className={selectClass}
              defaultValue={initialValues?.sourceNoteId ?? ""}
              name="sourceNoteId"
            >
              <option value="">No note</option>
              {options.notes.map((note) => (
                <option key={note.id} value={note.id}>
                  {optionPreview(note.summary, `${note.noteType} note`)}
                </option>
              ))}
            </select>
            <FieldError
              id="sourceNoteId-error"
              message={firstError(state, "sourceNoteId")}
            />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving" : "Save introduction"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
