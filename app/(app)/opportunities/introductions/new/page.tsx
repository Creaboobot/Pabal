import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { IntroductionSuggestionForm } from "@/modules/opportunities/components/introduction-suggestion-form";
import { getTenantOpportunityFormOptions } from "@/server/services/opportunity-form-options";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type NewIntroductionSuggestionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function searchValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return typeof value === "string" ? value : undefined;
}

function optionHint<T extends { id: string }>(
  value: string | undefined,
  options: T[],
) {
  return value && options.some((option) => option.id === value) ? value : null;
}

export default async function NewIntroductionSuggestionPage({
  searchParams,
}: NewIntroductionSuggestionPageProps) {
  const [context, resolvedSearchParams] = await Promise.all([
    getCurrentUserContext(),
    searchParams,
  ]);

  if (!context) {
    redirect("/sign-in?callbackUrl=/opportunities/introductions/new");
  }

  const options = await getTenantOpportunityFormOptions(context);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href="/opportunities/introductions">
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Introductions
            </Link>
          </Button>
        }
        description="Create a manual introduction suggestion. This form stores context only and does not draft or send outreach."
        eyebrow="Manual brokerage"
        title="Create introduction"
      />

      <CockpitCard title="Introduction details">
        <IntroductionSuggestionForm
          initialValues={{
            capabilityId: optionHint(
              searchValue(resolvedSearchParams, "capabilityId"),
              options.capabilities,
            ),
            fromCompanyId: optionHint(
              searchValue(resolvedSearchParams, "fromCompanyId") ??
                searchValue(resolvedSearchParams, "companyId"),
              options.companies,
            ),
            fromPersonId: optionHint(
              searchValue(resolvedSearchParams, "fromPersonId") ??
                searchValue(resolvedSearchParams, "personId"),
              options.people,
            ),
            needId: optionHint(
              searchValue(resolvedSearchParams, "needId"),
              options.needs,
            ),
            sourceMeetingId: optionHint(
              searchValue(resolvedSearchParams, "sourceMeetingId") ??
                searchValue(resolvedSearchParams, "meetingId"),
              options.meetings,
            ),
            sourceNoteId: optionHint(
              searchValue(resolvedSearchParams, "sourceNoteId") ??
                searchValue(resolvedSearchParams, "noteId"),
              options.notes,
            ),
            toCompanyId: optionHint(
              searchValue(resolvedSearchParams, "toCompanyId"),
              options.companies,
            ),
            toPersonId: optionHint(
              searchValue(resolvedSearchParams, "toPersonId"),
              options.people,
            ),
          }}
          mode="create"
          options={options}
        />
      </CockpitCard>
    </div>
  );
}
