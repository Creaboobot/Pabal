import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Edit,
  Globe2,
  Handshake,
  Link2,
  Lightbulb,
  Plus,
  UsersRound,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { archiveCompanyAction } from "@/modules/people/actions";
import { AffiliationCard } from "@/modules/people/components/affiliation-card";
import { ArchiveRecordButton } from "@/modules/people/components/archive-record-button";
import { RelatedContextSummary } from "@/modules/people/components/related-context-summary";
import { RelationshipHealthCard } from "@/modules/relationship-health/components/relationship-health-card";
import { getTenantCompanyProfile } from "@/server/services/companies";
import { getTenantCompanyRelatedContext } from "@/server/services/relationship-context";
import { getTenantCompanyRelationshipHealth } from "@/server/services/relationship-health";
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

  const [relatedContext, relationshipHealth] = await Promise.all([
    getTenantCompanyRelatedContext(context, companyId),
    getTenantCompanyRelationshipHealth(context, companyId),
  ]);

  if (!relationshipHealth) {
    notFound();
  }

  const activeAffiliations = company.companyAffiliations.filter(
    (affiliation) => !affiliation.endsAt,
  );
  const endedAffiliations = company.companyAffiliations.filter(
    (affiliation) => affiliation.endsAt,
  );
  const primaryContacts = activeAffiliations.filter(
    (affiliation) => affiliation.isPrimary,
  );

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
            <Button asChild>
              <Link href={`/tasks/new?companyId=${company.id}`}>
                <Plus aria-hidden="true" className="mr-2 size-4" />
                Create follow-up
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/commitments/new?companyId=${company.id}`}>
                <Handshake aria-hidden="true" className="mr-2 size-4" />
                Create commitment
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/opportunities/needs/new?companyId=${company.id}`}>
                <Lightbulb aria-hidden="true" className="mr-2 size-4" />
                Create need
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/opportunities/capabilities/new?companyId=${company.id}`}
              >
                <BadgeCheck aria-hidden="true" className="mr-2 size-4" />
                Create capability
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/notes/new?companyId=${company.id}&sourceType=LINKEDIN_USER_PROVIDED`}
              >
                <Link2 aria-hidden="true" className="mr-2 size-4" />
                Add LinkedIn context
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
              {activeAffiliations.length} active people
            </Badge>
            <Badge variant="secondary">
              {relatedContext.notes.length} latest notes
            </Badge>
            <Badge variant="secondary">
              {relatedContext.meetings.length} latest meetings
            </Badge>
          </div>
        </CockpitCard>
      </section>

      <RelationshipHealthCard health={relationshipHealth} />

      {primaryContacts.length > 0 ? (
        <CockpitCard title="Primary contacts" value={primaryContacts.length}>
          <div className="grid gap-3">
            {primaryContacts.map((affiliation) => (
              <AffiliationCard
                affiliation={affiliation}
                key={affiliation.id}
                mode="company"
              />
            ))}
          </div>
        </CockpitCard>
      ) : null}

      <CockpitCard title="Affiliated people" value={activeAffiliations.length}>
        {activeAffiliations.length > 0 ? (
          <div className="grid gap-3">
            {activeAffiliations.map((affiliation) => (
              <AffiliationCard
                affiliation={affiliation}
                key={affiliation.id}
                mode="company"
                showActions
              />
            ))}
          </div>
        ) : (
          <EmptyState
            action={
              <Button asChild>
                <Link href={`/people/companies/${company.id}/affiliations/new`}>
                  <Plus aria-hidden="true" className="mr-2 size-4" />
                  Add person
                </Link>
              </Button>
            }
            description="Link people to this company to make the organisation useful as relationship context."
            icon={UsersRound}
            title="No linked people"
          />
        )}
      </CockpitCard>

      {endedAffiliations.length > 0 ? (
        <CockpitCard
          title="Ended affiliations"
          value={endedAffiliations.length}
        >
          <div className="grid gap-3">
            {endedAffiliations.map((affiliation) => (
              <AffiliationCard
                affiliation={affiliation}
                key={affiliation.id}
                mode="company"
                showActions
              />
            ))}
          </div>
        </CockpitCard>
      ) : null}

      {activeAffiliations.length > 0 ? (
        <Button asChild>
          <Link href={`/people/companies/${company.id}/affiliations/new`}>
            <Plus aria-hidden="true" className="mr-2 size-4" />
            Add person
          </Link>
        </Button>
      ) : null}

      <RelatedContextSummary
        meetings={relatedContext.meetings}
        notes={relatedContext.notes}
      />

      <ArchiveRecordButton
        action={archiveCompanyAction.bind(null, company.id)}
        recordName={company.name}
        recordType="company"
      />
    </div>
  );
}
