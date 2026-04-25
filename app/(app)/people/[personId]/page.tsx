import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Edit,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { archivePersonAction } from "@/modules/people/actions";
import { ArchiveRecordButton } from "@/modules/people/components/archive-record-button";
import { RelationshipBadges } from "@/modules/people/components/relationship-badges";
import { getTenantPersonProfile } from "@/server/services/people";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type PersonDetailPageProps = {
  params: Promise<{
    personId: string;
  }>;
};

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
  const [{ personId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/people/${personId}`);
  }

  const person = await getTenantPersonProfile(context, personId);

  if (!person) {
    notFound();
  }

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
            <Button asChild variant="outline">
              <Link href={`/people/${person.id}/edit`}>
                <Edit aria-hidden="true" className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
          </div>
        }
        description={person.jobTitle ?? "Relationship record"}
        eyebrow="Person"
        title={person.displayName}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <CockpitCard title="Relationship context">
          <div className="grid gap-4">
            <RelationshipBadges
              status={person.relationshipStatus}
              temperature={person.relationshipTemperature}
            />
            <div className="grid gap-2 text-sm text-muted-foreground">
              {person.email ? (
                <span className="flex items-center gap-2">
                  <Mail aria-hidden="true" className="size-4" />
                  {person.email}
                </span>
              ) : null}
              {person.phone ? (
                <span className="flex items-center gap-2">
                  <Phone aria-hidden="true" className="size-4" />
                  {person.phone}
                </span>
              ) : null}
              {!person.email && !person.phone ? (
                <span className="flex items-center gap-2">
                  <UserRound aria-hidden="true" className="size-4" />
                  No contact details yet.
                </span>
              ) : null}
            </div>
          </div>
        </CockpitCard>

        <CockpitCard title="Related context">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {person._count.notes} notes
            </Badge>
            <Badge variant="secondary">
              {person._count.meetingParticipants} meetings
            </Badge>
          </div>
        </CockpitCard>
      </section>

      <CockpitCard title="Company affiliations">
        {person.companyAffiliations.length > 0 ? (
          <div className="grid gap-3">
            {person.companyAffiliations.map((affiliation) => (
              <Link
                className="rounded-md border border-border bg-background p-3 outline-none transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/companies/${affiliation.company.id}`}
                key={affiliation.id}
              >
                <div className="flex items-start gap-3">
                  <Building2
                    aria-hidden="true"
                    className="mt-0.5 size-5 text-primary"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-foreground">
                        {affiliation.company.name}
                      </h2>
                      {affiliation.isPrimary ? (
                        <Badge variant="success">Primary</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {affiliation.affiliationTitle ?? "Affiliation"}
                      {affiliation.department
                        ? `, ${affiliation.department}`
                        : ""}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Affiliation management is planned for Step 6B."
            icon={Building2}
            title="No linked companies"
          />
        )}
      </CockpitCard>

      <ArchiveRecordButton
        action={archivePersonAction.bind(null, person.id)}
        recordName={person.displayName}
        recordType="person"
      />
    </div>
  );
}
