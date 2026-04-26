import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Edit,
  FileText,
  Handshake,
  Lightbulb,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  archiveIntroductionSuggestionAction,
  dismissIntroductionSuggestionAction,
} from "@/modules/opportunities/actions";
import { IntroductionBadges } from "@/modules/opportunities/components/opportunity-badges";
import { OpportunityActionButton } from "@/modules/opportunities/components/opportunity-action-button";
import { introductionDisplayTitle } from "@/modules/opportunities/labels";
import { getTenantIntroductionSuggestionProfile } from "@/server/services/introduction-suggestions";
import { getCurrentUserContext } from "@/server/services/session";
import { listTenantSourceReferencesForTarget } from "@/server/services/source-references";

export const dynamic = "force-dynamic";

type IntroductionSuggestionDetailPageProps = {
  params: Promise<{
    introductionSuggestionId: string;
  }>;
};

export default async function IntroductionSuggestionDetailPage({
  params,
}: IntroductionSuggestionDetailPageProps) {
  const [{ introductionSuggestionId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(
      `/sign-in?callbackUrl=/opportunities/introductions/${introductionSuggestionId}`,
    );
  }

  const suggestion = await getTenantIntroductionSuggestionProfile(
    context,
    introductionSuggestionId,
  );

  if (!suggestion) {
    notFound();
  }

  const sourceReferences = await listTenantSourceReferencesForTarget(context, {
    targetEntityId: suggestion.id,
    targetEntityType: "INTRODUCTION_SUGGESTION",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/opportunities/introductions">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Introductions
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/opportunities/introductions/${suggestion.id}/edit`}>
                <Edit aria-hidden="true" className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
          </div>
        }
        description="Manual introduction suggestion. No matching, message drafting, or outreach is automated."
        eyebrow="Introduction"
        title={introductionDisplayTitle(suggestion)}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <CockpitCard title="Suggestion state">
          <IntroductionBadges
            confidence={suggestion.confidence}
            status={suggestion.status}
          />
        </CockpitCard>

        <CockpitCard title="Linked context">
          <div className="flex flex-wrap gap-2">
            {suggestion.need ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/opportunities/needs/${suggestion.need.id}`}
                >
                  <Lightbulb aria-hidden="true" className="size-3.5" />
                  {suggestion.need.title}
                </Link>
              </Badge>
            ) : null}
            {suggestion.capability ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/opportunities/capabilities/${suggestion.capability.id}`}
                >
                  <BadgeCheck aria-hidden="true" className="size-3.5" />
                  {suggestion.capability.title}
                </Link>
              </Badge>
            ) : null}
            {suggestion.fromPerson ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/${suggestion.fromPerson.id}`}
                >
                  <UserRound aria-hidden="true" className="size-3.5" />
                  From {suggestion.fromPerson.displayName}
                </Link>
              </Badge>
            ) : null}
            {suggestion.toPerson ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/${suggestion.toPerson.id}`}
                >
                  <UserRound aria-hidden="true" className="size-3.5" />
                  To {suggestion.toPerson.displayName}
                </Link>
              </Badge>
            ) : null}
            {suggestion.fromCompany ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/companies/${suggestion.fromCompany.id}`}
                >
                  <Building2 aria-hidden="true" className="size-3.5" />
                  From {suggestion.fromCompany.name}
                </Link>
              </Badge>
            ) : null}
            {suggestion.toCompany ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/companies/${suggestion.toCompany.id}`}
                >
                  <Building2 aria-hidden="true" className="size-3.5" />
                  To {suggestion.toCompany.name}
                </Link>
              </Badge>
            ) : null}
          </div>
        </CockpitCard>
      </section>

      <CockpitCard title="Rationale">
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {suggestion.rationale}
        </p>
      </CockpitCard>

      <CockpitCard title="Source references">
        <div className="grid gap-3 text-sm text-muted-foreground">
          <p>
            Provenance links are informational only. This screen does not run
            matching, scoring, extraction, message drafting, or AI generation.
          </p>
          {sourceReferences.length > 0 ? (
            <div className="grid gap-2">
              {sourceReferences.map((reference) => (
                <div
                  className="rounded-md border border-border bg-background p-3"
                  key={reference.id}
                >
                  <p className="font-medium text-foreground">
                    <FileText aria-hidden="true" className="mr-1 inline size-4" />
                    {reference.sourceEntityType} to {reference.targetEntityType}
                  </p>
                  {reference.label ? (
                    <p className="mt-1">{reference.label}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <Badge className="w-fit" variant="secondary">
              No source references
            </Badge>
          )}
        </div>
      </CockpitCard>

      <div className="grid gap-3 sm:grid-cols-2">
        <OpportunityActionButton
          action={dismissIntroductionSuggestionAction.bind(null, suggestion.id)}
          confirmLabel="Dismiss"
          description="Dismissal maps this suggestion to rejected. It does not send messages, update linked records, or delete source references."
          label="Dismiss"
          pendingLabel="Dismissing"
          title="Dismiss this suggestion?"
          variant="outline"
        />
        <OpportunityActionButton
          action={archiveIntroductionSuggestionAction.bind(null, suggestion.id)}
          confirmLabel="Archive"
          description="The suggestion will be hidden from active lists. Linked people, companies, needs, capabilities, and source references stay unchanged."
          label="Archive"
          pendingLabel="Archiving"
          title="Archive this suggestion?"
          variant="outline"
        />
      </div>
    </div>
  );
}
