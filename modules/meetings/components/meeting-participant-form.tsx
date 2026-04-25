"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  initialMeetingActionState,
  type MeetingActionState,
} from "@/modules/meetings/action-state";
import { createMeetingParticipantAction } from "@/modules/meetings/actions";
import { FieldError } from "@/modules/meetings/components/field-error";
import {
  editableMeetingParticipantRoles,
  meetingParticipantRoleLabel,
} from "@/modules/meetings/labels";

export type MeetingParticipantFormPerson = {
  email: string | null;
  id: string;
  name: string;
};

export type MeetingParticipantFormCompany = {
  id: string;
  name: string;
};

type MeetingParticipantFormProps = {
  companies: MeetingParticipantFormCompany[];
  meetingId: string;
  people: MeetingParticipantFormPerson[];
};

function firstError(state: MeetingActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

export function MeetingParticipantForm({
  companies,
  meetingId,
  people,
}: MeetingParticipantFormProps) {
  const router = useRouter();
  const [state, setState] = useState<MeetingActionState>(
    initialMeetingActionState,
  );
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createMeetingParticipantAction(meetingId, formData);

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
          Known person
        </span>
        <select
          aria-describedby="personId-error"
          aria-invalid={Boolean(firstError(state, "personId"))}
          className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
          name="personId"
        >
          <option value="">No known person</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
              {person.email ? ` (${person.email})` : ""}
            </option>
          ))}
        </select>
        <FieldError
          id="personId-error"
          message={firstError(state, "personId")}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Name snapshot
          </span>
          <Input
            aria-describedby="nameSnapshot-error"
            aria-invalid={Boolean(firstError(state, "nameSnapshot"))}
            name="nameSnapshot"
          />
          <FieldError
            id="nameSnapshot-error"
            message={firstError(state, "nameSnapshot")}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Email snapshot
          </span>
          <Input
            aria-describedby="emailSnapshot-error"
            aria-invalid={Boolean(firstError(state, "emailSnapshot"))}
            name="emailSnapshot"
            type="email"
          />
          <FieldError
            id="emailSnapshot-error"
            message={firstError(state, "emailSnapshot")}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Company</span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            name="companyId"
          >
            <option value="">No company context</option>
            {companies.map((company) => (
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
          <span className="text-sm font-medium text-foreground">Role</span>
          <select
            className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            defaultValue="ATTENDEE"
            name="participantRole"
          >
            {editableMeetingParticipantRoles.map((role) => (
              <option key={role} value={role}>
                {meetingParticipantRoleLabel(role)}
              </option>
            ))}
          </select>
          <FieldError
            id="participantRole-error"
            message={firstError(state, "participantRole")}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Adding" : "Add participant"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href={`/meetings/${meetingId}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
