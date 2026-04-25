import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-48 items-center justify-center rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground"
      role="status"
    >
      <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
      {label}
    </div>
  );
}
