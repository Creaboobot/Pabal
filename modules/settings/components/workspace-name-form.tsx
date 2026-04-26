"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  initialSettingsActionState,
  type SettingsActionState,
} from "@/modules/settings/action-state";
import { updateWorkspaceNameAction } from "@/modules/settings/actions";
import { FieldError } from "@/modules/settings/components/field-error";

type WorkspaceNameFormProps = {
  canUpdate: boolean;
  initialName: string;
};

function firstError(state: SettingsActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

export function WorkspaceNameForm({
  canUpdate,
  initialName,
}: WorkspaceNameFormProps) {
  const router = useRouter();
  const [state, setState] = useState<SettingsActionState>(
    initialSettingsActionState,
  );
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateWorkspaceNameAction(formData);

      setState(result);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {state.message ? (
        <div className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
          {state.message}
        </div>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">
          Workspace name
        </span>
        <Input
          aria-describedby="workspace-name-error"
          aria-invalid={Boolean(firstError(state, "name"))}
          defaultValue={initialName}
          disabled={!canUpdate || pending}
          name="name"
          required
        />
        <FieldError
          id="workspace-name-error"
          message={firstError(state, "name")}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button disabled={!canUpdate || pending} type="submit">
          {pending ? "Saving" : "Save workspace"}
        </Button>
      </div>

      {!canUpdate ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Owner or admin access is required to update workspace details.
        </p>
      ) : null}
    </form>
  );
}
