import { redirect } from "next/navigation";
import { Building2, ThermometerSun, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/empty-state";
import { getAppShellSummary } from "@/server/services/app-shell-summary";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/people");
  }

  const summary = await getAppShellSummary(context);
  const hasRelationshipMemory =
    summary.people.people > 0 || summary.people.companies > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Relationship memory starts with people, companies, and the context that explains why they matter."
        eyebrow="Network memory"
        title="People"
      />

      <section
        aria-label="Relationship summary"
        className="grid gap-3 sm:grid-cols-2"
      >
        <CockpitCard
          eyebrow="People"
          title="Relationship records"
          value={summary.people.people}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            People remain separate from company affiliations and meeting
            participation.
          </p>
        </CockpitCard>
        <CockpitCard
          eyebrow="Companies"
          title="Organisation records"
          value={summary.people.companies}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Company names are not treated as unique across a workspace.
          </p>
        </CockpitCard>
      </section>

      {hasRelationshipMemory ? (
        <section
          aria-label="Relationship patterns"
          className="grid gap-3 lg:grid-cols-3"
        >
          <CockpitCard title="Relationship temperature">
            <div className="flex items-center gap-3">
              <ThermometerSun
                aria-hidden="true"
                className="size-5 text-primary"
              />
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Cold</Badge>
                <Badge variant="secondary">Warm</Badge>
                <Badge variant="success">Hot</Badge>
              </div>
            </div>
          </CockpitCard>
          <CockpitCard title="Company context">
            <div className="flex gap-3">
              <Building2 aria-hidden="true" className="size-5 text-primary" />
              <p className="text-sm leading-6 text-muted-foreground">
                Affiliations show title, department, and primary company
                context as records grow.
              </p>
            </div>
          </CockpitCard>
          <CockpitCard title="Source-linked notes">
            <div className="flex gap-3">
              <UsersRound aria-hidden="true" className="size-5 text-primary" />
              <p className="text-sm leading-6 text-muted-foreground">
                Notes and provenance links anchor relationship memory.
              </p>
            </div>
          </CockpitCard>
        </section>
      ) : (
        <EmptyState
          description="Seed demo data to preview the relationship memory shell."
          icon={UsersRound}
          title="No relationship records yet"
        />
      )}
    </div>
  );
}
