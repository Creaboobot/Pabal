"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PeopleActionState } from "@/modules/people/action-state";

type ArchiveRecordButtonProps = {
  action: () => Promise<PeopleActionState>;
  recordName: string;
  recordType: "company" | "person";
};

export function ArchiveRecordButton({
  action,
  recordName,
  recordType,
}: ArchiveRecordButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onArchive() {
    setError(null);
    startTransition(async () => {
      const result = await action();

      if (result.status === "success" && result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      setError(result.message ?? "The record could not be archived.");
    });
  }

  if (!confirming) {
    return (
      <Button
        onClick={() => setConfirming(true)}
        type="button"
        variant="outline"
      >
        <Archive aria-hidden="true" className="mr-2 size-4" />
        Archive
      </Button>
    );
  }

  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-sm font-medium text-foreground">
        Archive this {recordType}?
      </p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {recordName} will be hidden from active lists. Historical relationship
        context remains intact.
      </p>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={pending} onClick={onArchive} type="button">
          {pending ? "Archiving" : "Confirm archive"}
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
