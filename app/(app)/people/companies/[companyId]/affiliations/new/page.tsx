import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AffiliationForm } from "@/modules/people/components/affiliation-form";
import { getTenantCompany } from "@/server/services/companies";
import { listTenantPeople } from "@/server/services/people";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type NewCompanyAffiliationPageProps = {
  params: Promise<{
    companyId: string;
  }>;
};

export default async function NewCompanyAffiliationPage({
  params,
}: NewCompanyAffiliationPageProps) {
  const [{ companyId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(
      `/sign-in?callbackUrl=/people/companies/${companyId}/affiliations/new`,
    );
  }

  const [company, people] = await Promise.all([
    getTenantCompany(context, companyId),
    listTenantPeople(context),
  ]);

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href={`/people/companies/${company.id}`}>
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Company
            </Link>
          </Button>
        }
        description="Attach an existing person to this company as relationship context."
        eyebrow="New affiliation"
        title={company.name}
      />

      <Card className="p-4">
        <AffiliationForm
          cancelHref={`/people/companies/${company.id}`}
          companyId={company.id}
          mode="create-company"
          personOptions={people.map((person) => ({
            id: person.id,
            label: person.displayName,
          }))}
        />
      </Card>
    </div>
  );
}
