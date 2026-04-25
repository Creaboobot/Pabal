import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { CompanyList } from "@/modules/people/components/company-list";
import { listTenantCompaniesWithProfiles } from "@/server/services/companies";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/people/companies");
  }

  const companies = await listTenantCompaniesWithProfiles(context);
  const companyList = companies.map((company) => ({
    affiliationCount: company.companyAffiliations.length,
    description: company.description,
    id: company.id,
    industry: company.industry,
    name: company.name,
    website: company.website,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/people">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                People
              </Link>
            </Button>
            <Button asChild>
              <Link href="/people/companies/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                New company
              </Link>
            </Button>
          </div>
        }
        description="Companies are relationship context, not account tables."
        eyebrow="Organisation memory"
        title="Companies"
      />

      <CockpitCard title="Active companies" value={companies.length}>
        <p className="text-sm leading-6 text-muted-foreground">
          Organisation records in the active workspace.
        </p>
      </CockpitCard>

      <CompanyList companies={companyList} />
    </div>
  );
}
