"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  NeedStatus,
  NeedType,
  Sensitivity,
  TaskPriority,
} from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  initialOpportunitiesActionState,
  type OpportunitiesActionState,
} from "@/modules/opportunities/action-state";
import { createNeedAction, updateNeedAction } from "@/modules/opportunities/actions";
import { FieldError } from "@/modules/opportunities/components/field-error";
import {
  editableNeedStatuses,
  editableNeedTypes,
  editablePriorities,
  editableSensitivities,
  formatDateInput,
  needStatusLabel,
  needTypeLabel,
  priorityLabel,
  sensitivityLabel,
} from "@/modules/opportunities/labels";

export type OpportunityFormPerson = {
  displayName: string;
  id: string;
};

export type OpportunityFormCompany = {
  id: string;
  name: string;
};

export type OpportunityFormMeeting = {
  id: string;
  title: string;
};

export type OpportunityFormNote = {
  id: string;
  noteType: string;
  summary: string | null;
};

export type OpportunityFormNeed = {
  id: string;
  title: string;
};

export type OpportunityFormCapability = {
  id: string;
  title: string;
};

export type OpportunityFormOptions = {
  capabilities: OpportunityFormCapability[];
  companies: OpportunityFormCompany[];
  meetings: OpportunityFormMeeting[];
  needs: OpportunityFormNeed[];
  notes: OpportunityFormNote[];
  people: OpportunityFormPerson[];
};

export type NeedFormInitialValues = {
  companyId?: string | null;
  confidence?: number | null;
  description?: string | null;
  meetingId?: string | null;
  needType?: NeedType;
  noteId?: string | null;
  personId?: string | null;
  priority?: TaskPriority;
  reviewAfter?: Date | null;
  sensitivity?: Sensitivity;
  status?: NeedStatus;
  title?: string;
};

type NeedFormProps = {
  initialValues?: NeedFormInitialValues;
  mode: "create" | "edit";
  needId?: string;
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

export function NeedForm({
  initialValues,
  mode,
  needId,
  options,
}: NeedFormProps) {
  const router = useRouter();
  const [state, setState] = useState<OpportunitiesActionState>(
    initialOpportunitiesActionState,
  );
  const [pending, startTransition] = useTransition();
  const cancelHref = needId ? `/opportunities/needs/${needId}` : "/opportunities/needs";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createNeedAction(formData)
          : await updateNeedAction(needId ?? "", formData);

      setState(result);

      if (result.status === "success" && result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <form aria-label="Need form" className="grid gap-5" onSubmit={onSubmit}>
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
          defaultValue={initialValues?.title ?? ""}
          name="title"
          required
        />
        <FieldError id="title-error" message={firstError(state, "title")} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Type</span>
          <select
            className={selectClass}
            defaultValue={initialValues?.needType ?? "UNKNOWN"}
            name="needType"
          >
            {editableNeedTypes.map((needType) => (
              <option key={needType} value={needType}>
                {needTypeLabel(needType)}
              </option>
            ))}
          </select>
          <FieldError id="needType-error" message={firstError(state, "needType")} />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Status</span>
          <select
            className={selectClass}
            defaultValue={initialValues?.status ?? "OPEN"}
            name="status"
          >
            {editableNeedStatuses.map((status) => (
              <option key={status} value={status}>
                {needStatusLabel(status)}
              </option>
            ))}
          </select>
          <FieldError id="status-error" message={firstError(state, "status")} />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Priority</span>
          <select
            className={selectClass}
            defaultValue={initialValues?.priority ?? "MEDIUM"}
            name="priority"
          >
            {editablePriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabel(priority)}
              </option>
            ))}
          </select>
          <FieldError id="priority-error" message={firstError(state, "priority")} />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Sensitivity</span>
          <select
            className={selectClass}
            defaultValue={initialValues?.sensitivity ?? "NORMAL"}
            name="sensitivity"
          >
            {editableSensitivities.map((sensitivity) => (
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

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Review after</span>
        <Input
          aria-describedby="reviewAfter-error"
          aria-invalid={Boolean(firstError(state, "reviewAfter"))}
          defaultValue={formatDateInput(initialValues?.reviewAfter)}
          name="reviewAfter"
          type="date"
        />
        <FieldError
          id="reviewAfter-error"
          message={firstError(state, "reviewAfter")}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Description</span>
        <Textarea
          defaultValue={initialValues?.description ?? ""}
          name="description"
          rows={5}
        />
        <FieldError
          id="description-error"
          message={firstError(state, "description")}
        />
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

      <section className="grid gap-4 rounded-md border border-border bg-muted/40 p-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Context links
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            These links are provenance and context only. No extraction,
            matching, or recommendations run from this form.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Person</span>
            <select
              className={selectClass}
              defaultValue={initialValues?.personId ?? ""}
              name="personId"
            >
              <option value="">No person</option>
              {options.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
            <FieldError id="personId-error" message={firstError(state, "personId")} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Company</span>
            <select
              className={selectClass}
              defaultValue={initialValues?.companyId ?? ""}
              name="companyId"
            >
              <option value="">No company</option>
              {options.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <FieldError id="companyId-error" message={firstError(state, "companyId")} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Meeting</span>
            <select
              className={selectClass}
              defaultValue={initialValues?.meetingId ?? ""}
              name="meetingId"
            >
              <option value="">No meeting</option>
              {options.meetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.title}
                </option>
              ))}
            </select>
            <FieldError id="meetingId-error" message={firstError(state, "meetingId")} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Note</span>
            <select
              className={selectClass}
              defaultValue={initialValues?.noteId ?? ""}
              name="noteId"
            >
              <option value="">No note</option>
              {options.notes.map((note) => (
                <option key={note.id} value={note.id}>
                  {optionPreview(note.summary, `${note.noteType} note`)}
                </option>
              ))}
            </select>
            <FieldError id="noteId-error" message={firstError(state, "noteId")} />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving" : "Save need"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
