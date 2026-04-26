import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Handshake, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { IntroductionSuggestionCard } from "@/modules/opportunities/components/introduction-suggestion-card";
import { listTenantIntroductionSuggestionsWithContext } from "@/server/services/introduction-suggestions";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function IntroductionSuggestionsPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/opportunities/introductions");
  }

  const suggestions = await listTenantIntroductionSuggestionsWithContext(
    context,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/opportunities">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Opportunities
              </Link>
            </Button>
            <Button asChild>
              <Link href="/opportunities/introductions/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                New introduction
              </Link>
            </Button>
          </div>
        }
        description="Manual introduction suggestions. No matching algorithm, message drafting, outreach, or AI generation runs here."
        eyebrow="Introductions"
        title="Introductions"
      />

      {suggestions.length > 0 ? (
        <section aria-label="Introduction suggestions" className="grid gap-3">
          {suggestions.map((suggestion) => (
            <IntroductionSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
            />
          ))}
        </section>
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
          description="Start by manually linking a need, capability, person, or company that might make a useful introduction."
          icon={Handshake}
          title="No introduction suggestions yet"
        />
      )}
    </div>
  );
}
