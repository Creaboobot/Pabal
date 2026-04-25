"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  initialPeopleActionState,
  type PeopleActionState,
} from "@/modules/people/action-state";
import {
  createCompanyAction,
  updateCompanyAction,
} from "@/modules/people/actions";
import { FieldError } from "@/modules/people/components/field-error";

export type CompanyFormInitialValues = {
  description?: string | null;
  industry?: string | null;
  name?: string;
  website?: string | null;
};

type CompanyFormProps = {
  companyId?: string;
  initialValues?: CompanyFormInitialValues;
  mode: "create" | "edit";
};

function firstError(state: PeopleActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

export function CompanyForm({
  companyId,
  initialValues,
  mode,
}: CompanyFormProps) {
  const router = useRouter();
  const [state, setState] = useState<PeopleActionState>(
    initialPeopleActionState,
  );
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCompanyAction(formData)
          : await updateCompanyAction(companyId ?? "", formData);

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
        <span className="text-sm font-medium text-foreground">
          Company name
        </span>
        <Input
          aria-describedby="name-error"
          aria-invalid={Boolean(firstError(state, "name"))}
          defaultValue={initialValues?.name ?? ""}
          name="name"
          required
        />
        <FieldError id="name-error" message={firstError(state, "name")} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Website</span>
          <Input
            defaultValue={initialValues?.website ?? ""}
            name="website"
            placeholder="https://example.com"
            type="url"
          />
          <FieldError
            id="website-error"
            message={firstError(state, "website")}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Industry</span>
          <Input
            defaultValue={initialValues?.industry ?? ""}
            name="industry"
            placeholder="Energy, industrials, software"
          />
          <FieldError
            id="industry-error"
            message={firstError(state, "industry")}
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
          placeholder="Short context about what this company does and why it matters."
        />
        <FieldError
          id="description-error"
          message={firstError(state, "description")}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving" : "Save company"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link
            href={
              companyId ? `/people/companies/${companyId}` : "/people/companies"
            }
          >
            Cancel
          </Link>
        </Button>
      </div>
    </form>
  );
}
