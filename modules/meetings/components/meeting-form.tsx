"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RecordSourceType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  initialMeetingActionState,
  type MeetingActionState,
} from "@/modules/meetings/action-state";
import {
  createMeetingAction,
  updateMeetingAction,
} from "@/modules/meetings/actions";
import { FieldError } from "@/modules/meetings/components/field-error";
import {
  editableRecordSourceTypes,
  formatDateTimeLocal,
  recordSourceTypeLabel,
} from "@/modules/meetings/labels";

export type MeetingFormCompany = {
  id: string;
  name: string;
};

export type MeetingFormInitialValues = {
  endedAt?: Date | null;
  location?: string | null;
  occurredAt?: Date | null;
  primaryCompanyId?: string | null;
  sourceAIProposalId?: string | null;
  sourceAIProposalItemId?: string | null;
  sourceType?: RecordSourceType;
  summary?: string | null;
  title?: string;
};

type MeetingFormProps = {
  companies: MeetingFormCompany[];
  initialValues?: MeetingFormInitialValues;
  meetingId?: string;
  mode: "create" | "edit";
};

function firstError(state: MeetingActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

export function MeetingForm({
  companies,
  initialValues,
  meetingId,
  mode,
}: MeetingFormProps) {
  const router = useRouter();
  const [state, setState] = useState<MeetingActionState>(
    initialMeetingActionState,
  );
  const [pending, startTransition] = useTransition();
  const cancelHref = meetingId ? `/meetings/${meetingId}` : "/meetings";
  const defaultOccurredAt = initialValues?.occurredAt ?? new Date();
  const defaultSourceType = editableRecordSourceTypes.some(
    (sourceType) => sourceType === initialValues?.sourceType,
  )
    ? initialValues?.sourceType
    : "MANUAL";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createMeetingAction(formData)
          : await updateMeetingAction(meetingId ?? "", formData);

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
          <span className="text-sm font-medium text-foreground">
            Start time
          </span>
          <Input
            aria-describedby="occurredAt-error"
            aria-invalid={Boolean(firstError(state, "occurredAt"))}
            defaultValue={formatDateTimeLocal(defaultOccurredAt)}
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
            defaultValue={formatDateTimeLocal(initialValues?.endedAt)}
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
            defaultValue={initialValues?.primaryCompanyId ?? ""}
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
          <span className="text-sm font-medium text-foreground">Source</span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={defaultSourceType}
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

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Location</span>
        <Input
          defaultValue={initialValues?.location ?? ""}
          name="location"
          placeholder="Teams, Copenhagen office, client site"
        />
        <FieldError
          id="location-error"
          message={firstError(state, "location")}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Summary</span>
        <Textarea
          defaultValue={initialValues?.summary ?? ""}
          name="summary"
          rows={6}
        />
        <FieldError id="summary-error" message={firstError(state, "summary")} />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving" : "Save meeting"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
