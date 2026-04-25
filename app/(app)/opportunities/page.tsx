import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Handshake, Lightbulb, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CapabilityCard } from "@/modules/opportunities/components/capability-card";
import { IntroductionSuggestionCard } from "@/modules/opportunities/components/introduction-suggestion-card";
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
            <Button asChild variant="outline">
              <Link href="/opportunities/introductions/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                New introduction
              </Link>
            </Button>
          </div>
        }
        description="Manual needs, capabilities, and introductions for relationship brokerage. No matching algorithm or AI recommendations run here."
        eyebrow="Brokerage"
        title="Opportunities"
      />

      <section
        aria-label="Opportunity summary"
        className="grid gap-3 sm:grid-cols-3"
      >
        <CockpitCard title="Open needs" value={hub.counts.openNeeds}>
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Problems, requests, objectives, and interests documented manually.
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
              Expertise, access, assets, and solution potential in the network.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/opportunities/capabilities">View capabilities</Link>
            </Button>
          </div>
        </CockpitCard>
        <CockpitCard
          title="Introductions"
          value={hub.counts.activeIntroductions}
        >
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Manual introduction suggestions linked to needs, capabilities,
              people, and companies.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/opportunities/introductions">
                View introductions
              </Link>
            </Button>
          </div>
        </CockpitCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
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

        <CockpitCard
          title="Latest introductions"
          value={hub.latestIntroductions.length}
        >
          {hub.latestIntroductions.length > 0 ? (
            <div className="grid gap-3">
              {hub.latestIntroductions.map((suggestion) => (
                <IntroductionSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              action={
                <Button asChild>
                  <Link href="/opportunities/introductions/new">
                    <Plus aria-hidden="true" className="mr-2 size-4" />
                    Add introduction
                  </Link>
                </Button>
              }
              description="Manually connect a need, capability, person, or company when a useful introduction emerges."
              icon={Handshake}
              title="No introductions yet"
            />
          )}
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
              Status is manual. Pabal does not draft messages, score matches,
              or send outreach.
            </p>
          </div>
        </CockpitCard>
      </section>
    </div>
  );
}
