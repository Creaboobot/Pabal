import { redirect } from "next/navigation";
import { BadgeCheck, Handshake, Lightbulb } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { getAppShellSummary } from "@/server/services/app-shell-summary";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/opportunities");
  }

  const summary = await getAppShellSummary(context);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Needs, capabilities, and introductions are kept visible as relationship-brokerage readiness signals."
        eyebrow="Brokerage"
        title="Opportunities"
      />

      <section
        aria-label="Opportunity summary"
        className="grid gap-3 sm:grid-cols-3"
      >
        <CockpitCard title="Needs" value={summary.opportunities.needs}>
          <p className="text-sm leading-6 text-muted-foreground">
            Problems, requests, and interests found across the network.
          </p>
        </CockpitCard>
        <CockpitCard
          title="Capabilities"
          value={summary.opportunities.capabilities}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Expertise, access, assets, and solution potential.
          </p>
        </CockpitCard>
        <CockpitCard
          title="Introductions"
          value={summary.opportunities.introductionSuggestions}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Source-linked suggestions without an active matching algorithm.
          </p>
        </CockpitCard>
      </section>

      <section
        aria-label="Opportunity patterns"
        className="grid gap-3 lg:grid-cols-3"
      >
        <CockpitCard title="Need evidence">
          <div className="flex gap-3">
            <Lightbulb aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Cards preserve the source note or meeting behind each need.
            </p>
          </div>
        </CockpitCard>
        <CockpitCard title="Capability fit">
          <div className="flex gap-3">
            <BadgeCheck aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Capability records are prepared for explainable recommendations.
            </p>
          </div>
        </CockpitCard>
        <CockpitCard title="Introduction status">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Proposed</Badge>
            <Badge variant="outline">Parked</Badge>
            <Badge variant="success">Completed</Badge>
          </div>
          <div className="mt-3 flex gap-3">
            <Handshake aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Status is visible while introduction workflows remain inactive.
            </p>
          </div>
        </CockpitCard>
      </section>
    </div>
  );
}
