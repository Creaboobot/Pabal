"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SettingsActionState } from "@/modules/settings/action-state";

type RestoreRecordButtonProps = {
  action: () => Promise<SettingsActionState>;
  recordTitle: string;
};

export function RestoreRecordButton({
  action,
  recordTitle,
}: RestoreRecordButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onRestore() {
    setError(null);
    startTransition(async () => {
      const result = await action();

      if (result.status === "success") {
        router.refresh();
        setConfirming(false);
        return;
      }

      setError(result.message ?? "The archived record could not be restored.");
    });
  }

  if (!confirming) {
    return (
      <Button
        onClick={() => setConfirming(true)}
        type="button"
        variant="outline"
      >
        <RotateCcw aria-hidden="true" className="mr-2 size-4" />
        Restore
      </Button>
    );
  }

  return (
    <div className="rounded-md border border-border bg-muted p-3">
      <p className="text-sm font-medium text-foreground">
        Restore this archived record?
      </p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {recordTitle} will return to active workspace views where that record
        type is normally shown. Archive is reversible and is not permanent
        deletion.
      </p>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={pending} onClick={onRestore} type="button">
          {pending ? "Restoring" : "Confirm restore"}
        </Button>
        <Button
          disabled={pending}
          onClick={() => setConfirming(false)}
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
