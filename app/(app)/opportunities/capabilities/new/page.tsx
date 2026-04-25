import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { CapabilityForm } from "@/modules/opportunities/components/capability-form";
import { getTenantOpportunityFormOptions } from "@/server/services/opportunity-form-options";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type NewCapabilityPageProps = {
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

export default async function NewCapabilityPage({
  searchParams,
}: NewCapabilityPageProps) {
  const [context, resolvedSearchParams] = await Promise.all([
    getCurrentUserContext(),
    searchParams,
  ]);

  if (!context) {
    redirect("/sign-in?callbackUrl=/opportunities/capabilities/new");
  }

  const options = await getTenantOpportunityFormOptions(context);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href="/opportunities/capabilities">
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Capabilities
            </Link>
          </Button>
        }
        description="Capture manual expertise, access, assets, experience, or possible solutions. No matching or AI generation runs from this form."
        eyebrow="Manual intelligence"
        title="Create capability"
      />

      <CockpitCard title="Capability details">
        <CapabilityForm
          initialValues={{
            companyId: optionHint(
              searchValue(resolvedSearchParams, "companyId"),
              options.companies,
            ),
            noteId: optionHint(
              searchValue(resolvedSearchParams, "noteId"),
              options.notes,
            ),
            personId: optionHint(
              searchValue(resolvedSearchParams, "personId"),
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
