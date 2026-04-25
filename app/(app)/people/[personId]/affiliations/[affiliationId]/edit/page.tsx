import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AffiliationActionButton } from "@/modules/people/components/affiliation-action-button";
import { AffiliationForm } from "@/modules/people/components/affiliation-form";
import {
  archiveAffiliationAction,
  endAffiliationAction,
} from "@/modules/people/actions";
import { getTenantCompanyAffiliationForPerson } from "@/server/services/company-affiliations";
import { listTenantCompanies } from "@/server/services/companies";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type EditAffiliationPageProps = {
  params: Promise<{
    affiliationId: string;
    personId: string;
  }>;
};

export default async function EditAffiliationPage({
  params,
}: EditAffiliationPageProps) {
  const [{ affiliationId, personId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(
      `/sign-in?callbackUrl=/people/${personId}/affiliations/${affiliationId}/edit`,
    );
  }

  const [affiliation, companies] = await Promise.all([
    getTenantCompanyAffiliationForPerson(context, personId, affiliationId),
    listTenantCompanies(context),
  ]);

  if (!affiliation) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href={`/people/${affiliation.person.id}`}>
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Person
            </Link>
          </Button>
        }
        description={`Update the company link for ${affiliation.person.displayName}.`}
        eyebrow="Edit affiliation"
        title={affiliation.company.name}
      />

      <Card className="p-4">
        <AffiliationForm
          affiliationId={affiliation.id}
          cancelHref={`/people/${affiliation.person.id}`}
          companyOptions={companies.map((company) => ({
            id: company.id,
            label: company.name,
          }))}
          initialValues={{
            affiliationTitle: affiliation.affiliationTitle,
            companyId: affiliation.companyId,
            department: affiliation.department,
            endsAt: affiliation.endsAt,
            isPrimary: affiliation.isPrimary,
            startsAt: affiliation.startsAt,
          }}
          mode="edit"
          personId={affiliation.person.id}
        />
      </Card>

      <section aria-label="Affiliation lifecycle" className="grid gap-3">
        {!affiliation.endsAt ? (
          <AffiliationActionButton
            action={endAffiliationAction.bind(
              null,
              affiliation.person.id,
              affiliation.id,
            )}
            confirmLabel="Confirm end"
            description="The affiliation stays in relationship history and will no longer be treated as active."
            label="End affiliation"
            pendingLabel="Ending"
            title="End this affiliation?"
          />
        ) : null}
        <AffiliationActionButton
          action={archiveAffiliationAction.bind(
            null,
            affiliation.person.id,
            affiliation.id,
          )}
          confirmLabel="Confirm archive"
          description="The affiliation will be hidden from active relationship context. Historical records remain intact."
          label="Archive affiliation"
          pendingLabel="Archiving"
          title="Archive this affiliation?"
        />
      </section>
    </div>
  );
}
