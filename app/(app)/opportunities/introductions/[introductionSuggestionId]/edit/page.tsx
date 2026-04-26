import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { IntroductionSuggestionForm } from "@/modules/opportunities/components/introduction-suggestion-form";
import { introductionDisplayTitle } from "@/modules/opportunities/labels";
import { getTenantIntroductionSuggestionProfile } from "@/server/services/introduction-suggestions";
import { getTenantOpportunityFormOptions } from "@/server/services/opportunity-form-options";
import { getCurrentUserContext } from "@/server/services/session";
import { listTenantSourceReferencesForTarget } from "@/server/services/source-references";

export const dynamic = "force-dynamic";

type EditIntroductionSuggestionPageProps = {
  params: Promise<{
    introductionSuggestionId: string;
  }>;
};

export default async function EditIntroductionSuggestionPage({
  params,
}: EditIntroductionSuggestionPageProps) {
  const [{ introductionSuggestionId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(
      `/sign-in?callbackUrl=/opportunities/introductions/${introductionSuggestionId}/edit`,
    );
  }

  const [suggestion, options] = await Promise.all([
    getTenantIntroductionSuggestionProfile(context, introductionSuggestionId),
    getTenantOpportunityFormOptions(context),
  ]);

  if (!suggestion) {
    notFound();
  }

  const sourceReferences = await listTenantSourceReferencesForTarget(context, {
    targetEntityId: suggestion.id,
    targetEntityType: "INTRODUCTION_SUGGESTION",
  });
  const sourceMeetingId =
    sourceReferences.find(
      (reference) => reference.sourceEntityType === "MEETING",
    )?.sourceEntityId ?? null;
  const sourceNoteId =
    sourceReferences.find((reference) => reference.sourceEntityType === "NOTE")
      ?.sourceEntityId ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href={`/opportunities/introductions/${suggestion.id}`}>
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Introduction
            </Link>
          </Button>
        }
        description="Update the manual introduction suggestion. Linked records are validated server-side."
        eyebrow="Edit introduction"
        title={introductionDisplayTitle(suggestion)}
      />

      <CockpitCard title="Introduction details">
        <IntroductionSuggestionForm
          initialValues={{
            ...suggestion,
            sourceMeetingId,
            sourceNoteId,
          }}
          introductionSuggestionId={suggestion.id}
          mode="edit"
          options={options}
        />
      </CockpitCard>
    </div>
  );
}
