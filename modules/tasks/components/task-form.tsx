"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TaskPriority, TaskStatus, TaskType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  initialTasksActionState,
  type TasksActionState,
} from "@/modules/tasks/action-state";
import { createTaskAction, updateTaskAction } from "@/modules/tasks/actions";
import { FieldError } from "@/modules/tasks/components/field-error";
import {
  editableTaskPriorities,
  editableTaskTypes,
  formatDateTimeLocal,
  taskPriorityLabel,
  taskTypeLabel,
} from "@/modules/tasks/labels";

export type TaskFormPerson = {
  displayName: string;
  id: string;
};

export type TaskFormCompany = {
  id: string;
  name: string;
};

export type TaskFormMeeting = {
  id: string;
  title: string;
};

export type TaskFormNote = {
  id: string;
  noteType: string;
  summary: string | null;
};

export type TaskFormCommitment = {
  id: string;
  title: string;
};

export type TaskFormOptions = {
  commitments: TaskFormCommitment[];
  companies: TaskFormCompany[];
  meetings: TaskFormMeeting[];
  notes: TaskFormNote[];
  people: TaskFormPerson[];
};

export type TaskFormInitialValues = {
  commitmentId?: string | null;
  companyId?: string | null;
  description?: string | null;
  dueAt?: Date | null;
  introductionSuggestionId?: string | null;
  meetingId?: string | null;
  noteId?: string | null;
  personId?: string | null;
  priority?: TaskPriority;
  reminderAt?: Date | null;
  snoozedUntil?: Date | null;
  sourceAIProposalId?: string | null;
  sourceAIProposalItemId?: string | null;
  status?: TaskStatus;
  taskType?: TaskType;
  title?: string;
  whyNowRationale?: string | null;
};

type TaskFormProps = {
  initialValues?: TaskFormInitialValues;
  mode: "create" | "edit";
  options: TaskFormOptions;
  taskId?: string;
};

function firstError(state: TasksActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

function optionPreview(text: string | null, fallback: string) {
  if (!text) {
    return fallback;
  }

  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

export function TaskForm({
  initialValues,
  mode,
  options,
  taskId,
}: TaskFormProps) {
  const router = useRouter();
  const [state, setState] = useState<TasksActionState>(
    initialTasksActionState,
  );
  const [pending, startTransition] = useTransition();
  const cancelHref = taskId ? `/tasks/${taskId}` : "/tasks";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTaskAction(formData)
          : await updateTaskAction(taskId ?? "", formData);

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

      <input
        name="status"
        type="hidden"
        value={initialValues?.status ?? "OPEN"}
      />
      <input
        name="introductionSuggestionId"
        type="hidden"
        value={initialValues?.introductionSuggestionId ?? ""}
      />
      <input
        name="sourceAIProposalId"
        type="hidden"
        value={initialValues?.sourceAIProposalId ?? ""}
      />
      <input
        name="sourceAIProposalItemId"
        type="hidden"
        value={initialValues?.sourceAIProposalItemId ?? ""}
      />

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
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues?.taskType ?? "FOLLOW_UP"}
            name="taskType"
          >
            {editableTaskTypes.map((taskType) => (
              <option key={taskType} value={taskType}>
                {taskTypeLabel(taskType)}
              </option>
            ))}
          </select>
          <FieldError
            id="taskType-error"
            message={firstError(state, "taskType")}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Priority</span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues?.priority ?? "MEDIUM"}
            name="priority"
          >
            {editableTaskPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {taskPriorityLabel(priority)}
              </option>
            ))}
          </select>
          <FieldError
            id="priority-error"
            message={firstError(state, "priority")}
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
          <span className="text-sm font-medium text-foreground">Reminder</span>
          <Input
            aria-describedby="reminderAt-error"
            aria-invalid={Boolean(firstError(state, "reminderAt"))}
            defaultValue={formatDateTimeLocal(initialValues?.reminderAt)}
            name="reminderAt"
            type="datetime-local"
          />
          <FieldError
            id="reminderAt-error"
            message={firstError(state, "reminderAt")}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Snooze</span>
          <Input
            aria-describedby="snoozedUntil-error"
            aria-invalid={Boolean(firstError(state, "snoozedUntil"))}
            defaultValue={formatDateTimeLocal(initialValues?.snoozedUntil)}
            name="snoozedUntil"
            type="datetime-local"
          />
          <FieldError
            id="snoozedUntil-error"
            message={firstError(state, "snoozedUntil")}
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

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Why now</span>
        <Textarea
          defaultValue={initialValues?.whyNowRationale ?? ""}
          name="whyNowRationale"
          rows={4}
        />
        <FieldError
          id="whyNowRationale-error"
          message={firstError(state, "whyNowRationale")}
        />
      </label>

      <section className="grid gap-4 rounded-md border border-border bg-muted/40 p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Linked context
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Optional links are verified server-side inside the active
            workspace.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Person</span>
            <select
              className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
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
              <option value="">No company</option>
              {options.companies.map((company) => (
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

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              Commitment
            </span>
            <select
              className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              defaultValue={initialValues?.commitmentId ?? ""}
              name="commitmentId"
            >
              <option value="">No commitment</option>
              {options.commitments.map((commitment) => (
                <option key={commitment.id} value={commitment.id}>
                  {commitment.title}
                </option>
              ))}
            </select>
            <FieldError
              id="commitmentId-error"
              message={firstError(state, "commitmentId")}
            />
          </label>

        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving" : "Save task"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
