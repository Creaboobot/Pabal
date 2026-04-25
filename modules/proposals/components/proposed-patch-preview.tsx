import { proposedPatchPreviewRows } from "@/modules/proposals/patch-preview";

type ProposedPatchPreviewProps = {
  proposedPatch: unknown;
};

export function ProposedPatchPreview({
  proposedPatch,
}: ProposedPatchPreviewProps) {
  const rows = proposedPatchPreviewRows(proposedPatch);

  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <p className="text-sm font-medium text-foreground">
        Proposed only - not applied
      </p>
      <dl className="mt-3 grid gap-2">
        {rows.map((row) => (
          <div
            className="grid gap-1 rounded-md border border-border bg-background p-2 sm:grid-cols-[0.45fr_1fr]"
            key={row.key}
          >
            <dt className="break-words text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {row.key}
            </dt>
            <dd className="break-words text-sm leading-6 text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
