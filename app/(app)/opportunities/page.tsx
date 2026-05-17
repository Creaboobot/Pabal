import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Lightbulb, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { CapabilityCard } from "@/modules/opportunities/components/capability-card";
import { NeedCard } from "@/modules/opportunities/components/need-card";
import { getTenantOpportunityHub } from "@/server/services/opportunities";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/opportunities");
  }

  const hub = await getTenantOpportunityHub(context);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/opportunities/needs/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                New need
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/opportunities/capabilities/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                New capability
              </Link>
            </Button>
          </div>
        }
        description="Manual relationship inputs for needs and capabilities. Nothing here is matched or recommended automatically."
        eyebrow="Manual inputs"
        title="Opportunities"
      />

      <section
        aria-label="Opportunity summary"
        className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr]"
      >
        <CockpitCard title="Needs under review" value={hub.counts.openNeeds}>
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Problems, requests, objectives, and interests captured from your
              own relationship context.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/opportunities/needs">View needs</Link>
            </Button>
          </div>
        </CockpitCard>
        <CockpitCard
          title="Active capabilities"
          value={hub.counts.activeCapabilities}
        >
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Expertise, access, assets, and useful experience you may want to
              remember.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/opportunities/capabilities">View capabilities</Link>
            </Button>
          </div>
        </CockpitCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <CockpitCard title="Latest needs" value={hub.latestNeeds.length}>
          {hub.latestNeeds.length > 0 ? (
            <div className="grid gap-3">
              {hub.latestNeeds.map((need) => (
                <NeedCard key={need.id} need={need} />
              ))}
            </div>
          ) : (
            <EmptyState
              action={
                <Button asChild>
                  <Link href="/opportunities/needs/new">
                    <Plus aria-hidden="true" className="mr-2 size-4" />
                    Add need
                  </Link>
                </Button>
              }
              description="Capture a request, problem, objective, or opportunity from the network."
              icon={Lightbulb}
              title="No needs yet"
            />
          )}
        </CockpitCard>

        <CockpitCard
          title="Latest capabilities"
          value={hub.latestCapabilities.length}
        >
          {hub.latestCapabilities.length > 0 ? (
            <div className="grid gap-3">
              {hub.latestCapabilities.map((capability) => (
                <CapabilityCard
                  capability={capability}
                  key={capability.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              action={
                <Button asChild>
                  <Link href="/opportunities/capabilities/new">
                    <Plus aria-hidden="true" className="mr-2 size-4" />
                    Add capability
                  </Link>
                </Button>
              }
              description="Capture expertise, access, assets, experience, or possible solutions."
              icon={BadgeCheck}
              title="No capabilities yet"
            />
          )}
        </CockpitCard>

      </section>

      <section
        aria-label="Opportunity guardrails"
        className="grid gap-3 lg:grid-cols-2"
      >
        <CockpitCard title="Need context">
          <div className="flex gap-3">
            <Lightbulb aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Cards preserve the source note or meeting behind each need where
              context exists.
            </p>
          </div>
        </CockpitCard>
        <CockpitCard title="Capability context">
          <div className="flex gap-3">
            <BadgeCheck aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Capability records are manually maintained. Pabal does not score
              fit or run matching here.
            </p>
          </div>
        </CockpitCard>
      </section>
    </div>
  );
}
