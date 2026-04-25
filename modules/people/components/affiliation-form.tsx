"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  initialPeopleActionState,
  type PeopleActionState,
} from "@/modules/people/action-state";
import {
  createCompanyAffiliationAction,
  createPersonAffiliationAction,
  updateAffiliationAction,
} from "@/modules/people/actions";
import { FieldError } from "@/modules/people/components/field-error";

type Option = {
  id: string;
  label: string;
};

export type AffiliationFormInitialValues = {
  affiliationTitle?: string | null;
  companyId?: string;
  department?: string | null;
  endsAt?: Date | null;
  isPrimary?: boolean;
  startsAt?: Date | null;
};

type AffiliationFormProps =
  | {
      cancelHref: string;
      companyOptions: Option[];
      initialValues?: AffiliationFormInitialValues;
      mode: "create-person";
      personId: string;
    }
  | {
      cancelHref: string;
      companyId: string;
      initialValues?: AffiliationFormInitialValues;
      mode: "create-company";
      personOptions: Option[];
    }
  | {
      affiliationId: string;
      cancelHref: string;
      companyOptions: Option[];
      initialValues: AffiliationFormInitialValues;
      mode: "edit";
      personId: string;
    };

function firstError(state: PeopleActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

function formatDateInput(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function AffiliationForm(props: AffiliationFormProps) {
  const router = useRouter();
  const [state, setState] = useState<PeopleActionState>(
    initialPeopleActionState,
  );
  const [pending, startTransition] = useTransition();

  const companyOptions =
    props.mode === "create-company" ? [] : props.companyOptions;
  const personOptions =
    props.mode === "create-company" ? props.personOptions : [];

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        props.mode === "create-person"
          ? await createPersonAffiliationAction(props.personId, formData)
          : props.mode === "create-company"
            ? await createCompanyAffiliationAction(props.companyId, formData)
            : await updateAffiliationAction(
                props.personId,
                props.affiliationId,
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
    <form className="grid gap-5" onSubmit={onSubmit}>
      {state.message ? (
        <div className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
          {state.message}
        </div>
      ) : null}

      {props.mode === "create-company" ? (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Person</span>
          <select
            aria-describedby="personId-error"
            aria-invalid={Boolean(firstError(state, "personId"))}
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            name="personId"
            required
          >
            <option value="">Choose a person</option>
            {personOptions.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
          <FieldError id="personId-error" message={firstError(state, "personId")} />
        </label>
      ) : (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Company</span>
          <select
            aria-describedby="companyId-error"
            aria-invalid={Boolean(firstError(state, "companyId"))}
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={props.initialValues?.companyId ?? ""}
            name="companyId"
            required
          >
            <option value="">Choose a company</option>
            {companyOptions.map((company) => (
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
      )}

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">
          Title or role
        </span>
        <Input
          defaultValue={props.initialValues?.affiliationTitle ?? ""}
          name="affiliationTitle"
          placeholder="Advisor, sponsor, programme lead"
        />
        <FieldError
          id="affiliationTitle-error"
          message={firstError(state, "affiliationTitle")}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Department</span>
        <Input
          defaultValue={props.initialValues?.department ?? ""}
          name="department"
          placeholder="Transformation, engineering, IT"
        />
        <FieldError
          id="department-error"
          message={firstError(state, "department")}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Start date
          </span>
          <Input
            defaultValue={formatDateInput(props.initialValues?.startsAt)}
            name="startsAt"
            type="date"
          />
          <FieldError
            id="startsAt-error"
            message={firstError(state, "startsAt")}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">End date</span>
          <Input
            defaultValue={formatDateInput(props.initialValues?.endsAt)}
            name="endsAt"
            type="date"
          />
          <FieldError id="endsAt-error" message={firstError(state, "endsAt")} />
        </label>
      </div>

      <label className="flex min-h-11 items-start gap-3 rounded-md border border-border bg-card p-3">
        <input
          className="mt-1 size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
          defaultChecked={Boolean(props.initialValues?.isPrimary)}
          name="isPrimary"
          type="checkbox"
        />
        <span className="grid gap-1">
          <span className="text-sm font-medium text-foreground">
            Primary affiliation
          </span>
          <span className="text-sm leading-6 text-muted-foreground">
            Makes this the main company link for the person and unsets other
            active primary affiliations.
          </span>
        </span>
      </label>
      <FieldError id="isPrimary-error" message={firstError(state, "isPrimary")} />

      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving" : "Save affiliation"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href={props.cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
