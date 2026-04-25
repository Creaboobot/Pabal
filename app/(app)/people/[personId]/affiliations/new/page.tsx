import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AffiliationForm } from "@/modules/people/components/affiliation-form";
import { listTenantCompanies } from "@/server/services/companies";
import { getTenantPerson } from "@/server/services/people";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type NewPersonAffiliationPageProps = {
  params: Promise<{
    personId: string;
  }>;
};

export default async function NewPersonAffiliationPage({
  params,
}: NewPersonAffiliationPageProps) {
  const [{ personId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/people/${personId}/affiliations/new`);
  }

  const [person, companies] = await Promise.all([
    getTenantPerson(context, personId),
    listTenantCompanies(context),
  ]);

  if (!person) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href={`/people/${person.id}`}>
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Person
            </Link>
          </Button>
        }
        description="Link this person to a company without changing the company record itself."
        eyebrow="New affiliation"
        title={person.displayName}
      />

      <Card className="p-4">
        <AffiliationForm
          cancelHref={`/people/${person.id}`}
          companyOptions={companies.map((company) => ({
            id: company.id,
            label: company.name,
          }))}
          mode="create-person"
          personId={person.id}
        />
      </Card>
    </div>
  );
}
