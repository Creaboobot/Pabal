import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Plus, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { PeopleList } from "@/modules/people/components/people-list";
import { getCurrentUserContext } from "@/server/services/session";
import { listTenantCompaniesWithProfiles } from "@/server/services/companies";
import { listTenantPeopleWithProfiles } from "@/server/services/people";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/people");
  }

  const [people, companies] = await Promise.all([
    listTenantPeopleWithProfiles(context),
    listTenantCompaniesWithProfiles(context),
  ]);

  const peopleList = people.map((person) => {
    const primaryAffiliation =
      person.companyAffiliations.find((affiliation) => affiliation.isPrimary) ??
      person.companyAffiliations[0];

    return {
      displayName: person.displayName,
      email: person.email,
      id: person.id,
      jobTitle: person.jobTitle,
      primaryCompanyName: primaryAffiliation?.company.name ?? null,
      relationshipStatus: person.relationshipStatus,
      relationshipTemperature: person.relationshipTemperature,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/people/companies">
                <Building2 aria-hidden="true" className="mr-2 size-4" />
                Companies
              </Link>
            </Button>
            <Button asChild>
              <Link href="/people/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                New person
              </Link>
            </Button>
          </div>
        }
        description="People, contact context, relationship temperature, and the company links that explain why each relationship matters."
        eyebrow="Network memory"
        title="People"
      />

      <section
        aria-label="Relationship summary"
        className="grid gap-3 sm:grid-cols-2"
      >
        <CockpitCard
          eyebrow="People"
          title="Active records"
          value={people.length}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Tenant-scoped people visible in this workspace.
          </p>
        </CockpitCard>
        <CockpitCard
          eyebrow="Companies"
          title="Organisation records"
          value={companies.length}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Company names can repeat; context matters more than uniqueness.
          </p>
        </CockpitCard>
      </section>

      <PeopleList people={peopleList} />
    </div>
  );
}
