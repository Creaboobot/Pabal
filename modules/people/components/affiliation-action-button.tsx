"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { PeopleActionState } from "@/modules/people/action-state";

type AffiliationActionButtonProps = {
  action: () => Promise<PeopleActionState>;
  confirmLabel: string;
  description: string;
  label: string;
  pendingLabel: string;
  title: string;
};

export function AffiliationActionButton({
  action,
  confirmLabel,
  description,
  label,
  pendingLabel,
  title,
}: AffiliationActionButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await action();

      if (result.status === "success" && result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      setError(result.message ?? "The affiliation could not be updated.");
    });
  }

  if (!confirming) {
    return (
      <Button
        onClick={() => setConfirming(true)}
        size="sm"
        type="button"
        variant="outline"
      >
        {label}
      </Button>
    );
  }

  return (
    <div className="rounded-md border border-border bg-muted p-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={pending} onClick={onConfirm} size="sm" type="button">
          {pending ? pendingLabel : confirmLabel}
        </Button>
        <Button
          disabled={pending}
          onClick={() => setConfirming(false)}
          size="sm"
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
