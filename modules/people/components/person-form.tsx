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
  createPersonAction,
  updatePersonAction,
} from "@/modules/people/actions";
import { FieldError } from "@/modules/people/components/field-error";
import {
  editableRelationshipStatuses,
  editableRelationshipTemperatures,
  relationshipStatusLabel,
  relationshipTemperatureLabel,
} from "@/modules/people/labels";

export type PersonFormInitialValues = {
  displayName?: string;
  email?: string | null;
  firstName?: string | null;
  jobTitle?: string | null;
  lastName?: string | null;
  linkedinUrl?: string | null;
  phone?: string | null;
  relationshipStatus?: (typeof editableRelationshipStatuses)[number];
  relationshipTemperature?: (typeof editableRelationshipTemperatures)[number];
  salesNavigatorUrl?: string | null;
};

type PersonFormProps = {
  initialValues?: PersonFormInitialValues;
  mode: "create" | "edit";
  personId?: string;
};

function firstError(state: PeopleActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

export function PersonForm({
  initialValues,
  mode,
  personId,
}: PersonFormProps) {
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
          ? await createPersonAction(formData)
          : await updatePersonAction(personId ?? "", formData);

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
          Display name
        </span>
        <Input
          aria-describedby="displayName-error"
          aria-invalid={Boolean(firstError(state, "displayName"))}
          defaultValue={initialValues?.displayName ?? ""}
          name="displayName"
          required
        />
        <FieldError
          id="displayName-error"
          message={firstError(state, "displayName")}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            First name
          </span>
          <Input defaultValue={initialValues?.firstName ?? ""} name="firstName" />
          <FieldError
            id="firstName-error"
            message={firstError(state, "firstName")}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Last name
          </span>
          <Input defaultValue={initialValues?.lastName ?? ""} name="lastName" />
          <FieldError
            id="lastName-error"
            message={firstError(state, "lastName")}
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">
          Title or role
        </span>
        <Input
          defaultValue={initialValues?.jobTitle ?? ""}
          name="jobTitle"
          placeholder="Partner, advisor, plant manager"
        />
        <FieldError
          id="jobTitle-error"
          message={firstError(state, "jobTitle")}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Email</span>
          <Input
            autoComplete="email"
            defaultValue={initialValues?.email ?? ""}
            name="email"
            type="email"
          />
          <FieldError id="email-error" message={firstError(state, "email")} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Phone</span>
          <Input
            autoComplete="tel"
            defaultValue={initialValues?.phone ?? ""}
            name="phone"
            type="tel"
          />
          <FieldError id="phone-error" message={firstError(state, "phone")} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            LinkedIn profile URL
          </span>
          <Input
            defaultValue={initialValues?.linkedinUrl ?? ""}
            name="linkedinUrl"
            placeholder="https://www.linkedin.com/in/name"
            type="url"
          />
          <FieldError
            id="linkedinUrl-error"
            message={firstError(state, "linkedinUrl")}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Sales Navigator URL
          </span>
          <Input
            defaultValue={initialValues?.salesNavigatorUrl ?? ""}
            name="salesNavigatorUrl"
            placeholder="https://www.linkedin.com/sales/..."
            type="url"
          />
          <FieldError
            id="salesNavigatorUrl-error"
            message={firstError(state, "salesNavigatorUrl")}
          />
        </label>
      </div>

      <p className="rounded-md border border-border bg-muted p-3 text-sm leading-6 text-muted-foreground">
        LinkedIn fields are manual only. Pabal validates the URL format but
        does not visit LinkedIn, preview profile content, monitor pages, or use
        LinkedIn cookies or APIs.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Relationship status
          </span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues?.relationshipStatus ?? "UNKNOWN"}
            name="relationshipStatus"
          >
            {editableRelationshipStatuses.map((status) => (
              <option key={status} value={status}>
                {relationshipStatusLabel(status)}
              </option>
            ))}
          </select>
          <FieldError
            id="relationshipStatus-error"
            message={firstError(state, "relationshipStatus")}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Relationship temperature
          </span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue={initialValues?.relationshipTemperature ?? "UNKNOWN"}
            name="relationshipTemperature"
          >
            {editableRelationshipTemperatures.map((temperature) => (
              <option key={temperature} value={temperature}>
                {relationshipTemperatureLabel(temperature)}
              </option>
            ))}
          </select>
          <FieldError
            id="relationshipTemperature-error"
            message={firstError(state, "relationshipTemperature")}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving" : "Save person"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href={personId ? `/people/${personId}` : "/people"}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
