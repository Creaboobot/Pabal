"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  CommitmentOwnerType,
  CommitmentStatus,
  Sensitivity,
} from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  initialCommitmentsActionState,
  type CommitmentsActionState,
} from "@/modules/commitments/action-state";
import {
  createCommitmentAction,
  updateCommitmentAction,
} from "@/modules/commitments/actions";
import { FieldError } from "@/modules/commitments/components/field-error";
import {
  commitmentOwnerTypeLabel,
  commitmentFormStatuses,
  commitmentStatusLabel,
  editableCommitmentOwnerTypes,
  editableCommitmentSensitivities,
  formatDateTimeLocal,
  sensitivityLabel,
} from "@/modules/commitments/labels";

export type CommitmentFormPerson = {
  displayName: string;
  id: string;
};

export type CommitmentFormCompany = {
  id: string;
  name: string;
};

export type CommitmentFormMeeting = {
  id: string;
  title: string;
};

export type CommitmentFormNote = {
  id: string;
  noteType: string;
  summary: string | null;
};

export type CommitmentFormOptions = {
  companies: CommitmentFormCompany[];
  meetings: CommitmentFormMeeting[];
  notes: CommitmentFormNote[];
  people: CommitmentFormPerson[];
};

export type CommitmentFormInitialValues = {
  counterpartyCompanyId?: string | null;
  counterpartyPersonId?: string | null;
  description?: string | null;
  dueAt?: Date | null;
  dueWindowEnd?: Date | null;
  dueWindowStart?: Date | null;
  meetingId?: string | null;
  noteId?: string | null;
  ownerCompanyId?: string | null;
  ownerPersonId?: string | null;
  ownerType?: CommitmentOwnerType;
  sensitivity?: Sensitivity;
  status?: CommitmentStatus;
  title?: string;
};

type CommitmentFormProps = {
  commitmentId?: string;
  initialValues?: CommitmentFormInitialValues;
  mode: "create" | "edit";
  options: CommitmentFormOptions;
};

function firstError(state: CommitmentsActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

function optionPreview(text: string | null, fallback: string) {
  if (!text) {
    return fallback;
  }

  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

export function CommitmentForm({
  commitmentId,
  initialValues,
  mode,
  options,
}: CommitmentFormProps) {
  const router = useRouter();
  const [state, setState] = useState<CommitmentsActionState>(
    initialCommitmentsActionState,
  );
  const [pending, startTransition] = useTransition();
  const cancelHref = commitmentId
    ? `/commitments/${commitmentId}`
    : "/commitments";
  const lifecycleLockedStatus =
    initialValues?.status === "DONE" || initialValues?.status === "CANCELLED";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCommitmentAction(formData)
          : await updateCommitmentAction(commitmentId ?? "", formData);

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
          defaultValue={initialValues?.title ?? ""}
          name="title"
          required
        />
        <FieldError id="title-error" message={firstError(state, "title")} />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Owner</span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues?.ownerType ?? "ME"}
            name="ownerType"
          >
            {editableCommitmentOwnerTypes.map((ownerType) => (
              <option key={ownerType} value={ownerType}>
                {commitmentOwnerTypeLabel(ownerType)}
              </option>
            ))}
          </select>
          <FieldError
            id="ownerType-error"
            message={firstError(state, "ownerType")}
          />
        </label>

        {mode === "edit" && !lifecycleLockedStatus ? (
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Status</span>
            <select
              className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              defaultValue={initialValues?.status ?? "OPEN"}
              name="status"
            >
              {commitmentFormStatuses.map((status) => (
                <option key={status} value={status}>
                  {commitmentStatusLabel(status)}
                </option>
              ))}
            </select>
            <FieldError
              id="status-error"
              message={firstError(state, "status")}
            />
          </label>
        ) : (
          <div className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Status</span>
            <input
              name="status"
              type="hidden"
              value={initialValues?.status ?? "OPEN"}
            />
            <div className="min-h-11 rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
              {commitmentStatusLabel(initialValues?.status ?? "OPEN")}
            </div>
          </div>
        )}

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Sensitivity
          </span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues?.sensitivity ?? "NORMAL"}
            name="sensitivity"
          >
            {editableCommitmentSensitivities.map((sensitivity) => (
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

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Due</span>
          <Input
            aria-describedby="dueAt-error"
            aria-invalid={Boolean(firstError(state, "dueAt"))}
            defaultValue={formatDateTimeLocal(initialValues?.dueAt)}
            name="dueAt"
            type="datetime-local"
          />
          <FieldError id="dueAt-error" message={firstError(state, "dueAt")} />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Window start
          </span>
          <Input
            aria-describedby="dueWindowStart-error"
            aria-invalid={Boolean(firstError(state, "dueWindowStart"))}
            defaultValue={formatDateTimeLocal(initialValues?.dueWindowStart)}
            name="dueWindowStart"
            type="datetime-local"
          />
          <FieldError
            id="dueWindowStart-error"
            message={firstError(state, "dueWindowStart")}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Window end
          </span>
          <Input
            aria-describedby="dueWindowEnd-error"
            aria-invalid={Boolean(firstError(state, "dueWindowEnd"))}
            defaultValue={formatDateTimeLocal(initialValues?.dueWindowEnd)}
            name="dueWindowEnd"
            type="datetime-local"
          />
          <FieldError
            id="dueWindowEnd-error"
            message={firstError(state, "dueWindowEnd")}
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">
          Description
        </span>
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

      <section className="grid gap-4 rounded-md border border-border bg-muted/40 p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Owner and counterparty
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Owner rules and all record links are verified server-side in the
            active workspace.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              Owner person
            </span>
            <select
              className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              defaultValue={initialValues?.ownerPersonId ?? ""}
              name="ownerPersonId"
            >
              <option value="">No owner person</option>
              {options.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
            <FieldError
              id="ownerPersonId-error"
              message={firstError(state, "ownerPersonId")}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              Owner company
            </span>
            <select
              className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              defaultValue={initialValues?.ownerCompanyId ?? ""}
              name="ownerCompanyId"
            >
              <option value="">No owner company</option>
              {options.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <FieldError
              id="ownerCompanyId-error"
              message={firstError(state, "ownerCompanyId")}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              Counterparty person
            </span>
            <select
              className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              defaultValue={initialValues?.counterpartyPersonId ?? ""}
              name="counterpartyPersonId"
            >
              <option value="">No counterparty person</option>
              {options.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
            <FieldError
              id="counterpartyPersonId-error"
              message={firstError(state, "counterpartyPersonId")}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              Counterparty company
            </span>
            <select
              className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              defaultValue={initialValues?.counterpartyCompanyId ?? ""}
              name="counterpartyCompanyId"
            >
              <option value="">No counterparty company</option>
              {options.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <FieldError
              id="counterpartyCompanyId-error"
              message={firstError(state, "counterpartyCompanyId")}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-border bg-muted/40 p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Source context
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Optional meeting and note links keep the promise traceable.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Meeting</span>
            <select
              className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
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
            <FieldError
              id="meetingId-error"
              message={firstError(state, "meetingId")}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Note</span>
            <select
              className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
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
          {pending ? "Saving" : "Save commitment"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
