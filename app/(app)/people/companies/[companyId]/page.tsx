import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Edit, Globe2, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { archiveCompanyAction } from "@/modules/people/actions";
import { ArchiveRecordButton } from "@/modules/people/components/archive-record-button";
import { getTenantCompanyProfile } from "@/server/services/companies";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type CompanyDetailPageProps = {
  params: Promise<{
    companyId: string;
  }>;
};

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
  const [{ companyId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/people/companies/${companyId}`);
  }

  const company = await getTenantCompanyProfile(context, companyId);

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/people/companies">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Companies
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/people/companies/${company.id}/edit`}>
                <Edit aria-hidden="true" className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
          </div>
        }
        description={company.industry ?? "Organisation record"}
        eyebrow="Company"
        title={company.name}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <CockpitCard title="Company context">
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
            {company.website ? (
              <a
                className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={company.website}
                rel="noreferrer"
                target="_blank"
              >
                <Globe2 aria-hidden="true" className="size-4" />
                {company.website}
              </a>
            ) : null}
            {company.description ? (
              <p>{company.description}</p>
            ) : (
              <p>No description yet.</p>
            )}
          </div>
        </CockpitCard>

        <CockpitCard title="Related context">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {company.companyAffiliations.length} linked people
            </Badge>
            <Badge variant="secondary">
              {company._count.notes} notes
            </Badge>
            <Badge variant="secondary">
              {company._count.primaryMeetings} meetings
            </Badge>
          </div>
        </CockpitCard>
      </section>

      <CockpitCard title="Linked people">
        {company.companyAffiliations.length > 0 ? (
          <div className="grid gap-3">
            {company.companyAffiliations.map((affiliation) => (
              <Link
                className="rounded-md border border-border bg-background p-3 outline-none transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/${affiliation.person.id}`}
                key={affiliation.id}
              >
                <div className="flex items-start gap-3">
                  <UsersRound
                    aria-hidden="true"
                    className="mt-0.5 size-5 text-primary"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-foreground">
                        {affiliation.person.displayName}
                      </h2>
                      {affiliation.isPrimary ? (
                        <Badge variant="success">Primary</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {affiliation.affiliationTitle ??
                        affiliation.person.jobTitle ??
                        "Linked person"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Affiliation management is planned for Step 6B."
            icon={UsersRound}
            title="No linked people"
          />
        )}
      </CockpitCard>

      <ArchiveRecordButton
        action={archiveCompanyAction.bind(null, company.id)}
        recordName={company.name}
        recordType="company"
      />
    </div>
  );
}
