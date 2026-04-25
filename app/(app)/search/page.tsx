import { redirect } from "next/navigation";
import { Database, FileSearch, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAppShellSummary } from "@/server/services/app-shell-summary";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/search");
  }

  const summary = await getAppShellSummary(context);
  const indexedRecords =
    summary.people.people +
    summary.people.companies +
    summary.capture.notes +
    summary.opportunities.needs +
    summary.opportunities.capabilities;

  return (
    <div className="space-y-6">
      <PageHeader
        description="A read-only lookup surface for structured network memory."
        eyebrow="Network lookup"
        title="Search"
      />

      <section aria-label="Search input" className="space-y-3">
        <Input
          aria-label="Search network memory"
          disabled
          placeholder="Search people, notes, needs, commitments"
          type="search"
        />
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">People</Badge>
          <Badge variant="outline">Companies</Badge>
          <Badge variant="outline">Notes</Badge>
          <Badge variant="outline">Needs</Badge>
          <Badge variant="outline">Capabilities</Badge>
        </div>
      </section>

      <section
        aria-label="Search readiness"
        className="grid gap-3 lg:grid-cols-3"
      >
        <CockpitCard title="Structured records" value={indexedRecords}>
          <div className="flex gap-3">
            <Database aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Existing records remain tenant-scoped inside the active
              workspace.
            </p>
          </div>
        </CockpitCard>
        <CockpitCard title="Source visibility">
          <div className="flex gap-3">
            <FileSearch aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Result cards preserve provenance instead of flattening context.
            </p>
          </div>
        </CockpitCard>
        <CockpitCard title="Tenant boundary">
          <div className="flex gap-3">
            <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Search must stay within the active workspace.
            </p>
          </div>
        </CockpitCard>
      </section>

      <EmptyState
        description="Search execution and semantic ranking are intentionally inactive in this shell."
        icon={FileSearch}
        title="No search results"
      />
    </div>
  );
}
