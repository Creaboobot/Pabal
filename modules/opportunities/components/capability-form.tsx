"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  CapabilityStatus,
  CapabilityType,
  Sensitivity,
} from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  initialOpportunitiesActionState,
  type OpportunitiesActionState,
} from "@/modules/opportunities/action-state";
import {
  createCapabilityAction,
  updateCapabilityAction,
} from "@/modules/opportunities/actions";
import { FieldError } from "@/modules/opportunities/components/field-error";
import type { OpportunityFormOptions } from "@/modules/opportunities/components/need-form";
import {
  capabilityStatusLabel,
  capabilityTypeLabel,
  editableCapabilityStatuses,
  editableCapabilityTypes,
  editableSensitivities,
  sensitivityLabel,
} from "@/modules/opportunities/labels";

export type CapabilityFormInitialValues = {
  capabilityType?: CapabilityType;
  companyId?: string | null;
  confidence?: number | null;
  description?: string | null;
  noteId?: string | null;
  personId?: string | null;
  sensitivity?: Sensitivity;
  status?: CapabilityStatus;
  title?: string;
};

type CapabilityFormProps = {
  capabilityId?: string;
  initialValues?: CapabilityFormInitialValues;
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

export function CapabilityForm({
  capabilityId,
  initialValues,
  mode,
  options,
}: CapabilityFormProps) {
  const router = useRouter();
  const [state, setState] = useState<OpportunitiesActionState>(
    initialOpportunitiesActionState,
  );
  const [pending, startTransition] = useTransition();
  const cancelHref = capabilityId
    ? `/opportunities/capabilities/${capabilityId}`
    : "/opportunities/capabilities";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCapabilityAction(formData)
          : await updateCapabilityAction(capabilityId ?? "", formData);

      setState(result);

      if (result.status === "success" && result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <form
      aria-label="Capability form"
      className="grid gap-5"
      onSubmit={onSubmit}
    >
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
            defaultValue={initialValues?.capabilityType ?? "OTHER"}
            name="capabilityType"
          >
            {editableCapabilityTypes.map((capabilityType) => (
              <option key={capabilityType} value={capabilityType}>
                {capabilityTypeLabel(capabilityType)}
              </option>
            ))}
          </select>
          <FieldError
            id="capabilityType-error"
            message={firstError(state, "capabilityType")}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Status</span>
          <select
            className={selectClass}
            defaultValue={initialValues?.status ?? "ACTIVE"}
            name="status"
          >
            {editableCapabilityStatuses.map((status) => (
              <option key={status} value={status}>
                {capabilityStatusLabel(status)}
              </option>
            ))}
          </select>
          <FieldError id="status-error" message={firstError(state, "status")} />
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

      <section className="grid gap-4 rounded-md border border-border bg-muted/40 p-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Context links
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            These links are provenance and context only. No matching,
            recommendations, or AI generation run from this form.
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
          {pending ? "Saving" : "Save capability"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
