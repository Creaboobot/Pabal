import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Edit,
  Handshake,
  Link2,
  Lightbulb,
  Mail,
  Phone,
  Plus,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { archivePersonAction } from "@/modules/people/actions";
import { AffiliationCard } from "@/modules/people/components/affiliation-card";
import { ArchiveRecordButton } from "@/modules/people/components/archive-record-button";
import { RelationshipBadges } from "@/modules/people/components/relationship-badges";
import { RelatedContextSummary } from "@/modules/people/components/related-context-summary";
import { RelationshipHealthCard } from "@/modules/relationship-health/components/relationship-health-card";
import {
  NoteSourceBadge,
  SensitivityBadge,
} from "@/modules/notes/components/note-badges";
import { formatNoteDateTime, notePreview } from "@/modules/notes/labels";
import { listTenantLinkedInNotesForPerson } from "@/server/services/notes";
import { getTenantPersonProfile } from "@/server/services/people";
import { getTenantPersonRelatedContext } from "@/server/services/relationship-context";
import { getTenantPersonRelationshipHealth } from "@/server/services/relationship-health";
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

  const [relatedContext, relationshipHealth, linkedInNotes] = await Promise.all([
    getTenantPersonRelatedContext(context, personId),
    getTenantPersonRelationshipHealth(context, personId),
    listTenantLinkedInNotesForPerson(context, personId),
  ]);

  if (!relationshipHealth) {
    notFound();
  }

  const activeAffiliations = person.companyAffiliations.filter(
    (affiliation) => !affiliation.endsAt,
  );
  const endedAffiliations = person.companyAffiliations.filter(
    (affiliation) => affiliation.endsAt,
  );
  const primaryAffiliation = activeAffiliations.find(
    (affiliation) => affiliation.isPrimary,
  );

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
            <Button asChild>
              <Link href={`/tasks/new?personId=${person.id}`}>
                <Plus aria-hidden="true" className="mr-2 size-4" />
                Create follow-up
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/commitments/new?personId=${person.id}`}>
                <Handshake aria-hidden="true" className="mr-2 size-4" />
                Create commitment
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/opportunities/needs/new?personId=${person.id}`}>
                <Lightbulb aria-hidden="true" className="mr-2 size-4" />
                Create need
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/opportunities/capabilities/new?personId=${person.id}`}
              >
                <BadgeCheck aria-hidden="true" className="mr-2 size-4" />
                Create capability
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/opportunities/introductions/new?fromPersonId=${person.id}`}
              >
                <Handshake aria-hidden="true" className="mr-2 size-4" />
                Create introduction
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/notes/new?personId=${person.id}&sourceType=LINKEDIN_USER_PROVIDED`}
              >
                <Link2 aria-hidden="true" className="mr-2 size-4" />
                Add LinkedIn context
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
              {relatedContext.notes.length} latest notes
            </Badge>
            <Badge variant="secondary">
              {relatedContext.meetings.length} latest meetings
            </Badge>
          </div>
        </CockpitCard>
      </section>

      <RelationshipHealthCard health={relationshipHealth} />

      <CockpitCard title="LinkedIn context" value="Manual only">
        <div className="grid gap-4">
          <div className="grid gap-2 text-sm text-muted-foreground">
            {person.linkedinUrl ? (
              <a
                className="flex items-center gap-2 rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                href={person.linkedinUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                <Link2 aria-hidden="true" className="size-4" />
                LinkedIn profile
              </a>
            ) : null}
            {person.salesNavigatorUrl ? (
              <a
                className="flex items-center gap-2 rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                href={person.salesNavigatorUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                <Link2 aria-hidden="true" className="size-4" />
                Sales Navigator
              </a>
            ) : null}
            {!person.linkedinUrl && !person.salesNavigatorUrl ? (
              <p>No LinkedIn URLs stored yet.</p>
            ) : null}
            <p>
              User-provided only. Pabal does not fetch, embed, preview, scrape,
              monitor, or sync LinkedIn content.
            </p>
          </div>

          <div className="grid gap-3">
            {linkedInNotes.length > 0 ? (
              linkedInNotes.map((note) => (
                <Link
                  className="rounded-md border border-border bg-background p-3 outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/notes/${note.id}`}
                  key={note.id}
                >
                  <div className="mb-2 flex flex-wrap gap-2">
                    <NoteSourceBadge sourceType={note.sourceType} />
                    <SensitivityBadge sensitivity={note.sensitivity} />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {notePreview(note)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatNoteDateTime(note.createdAt)}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No manually pasted LinkedIn context notes yet.
              </p>
            )}
          </div>
        </div>
      </CockpitCard>

      {primaryAffiliation ? (
        <CockpitCard title="Primary company">
          <AffiliationCard
            affiliation={primaryAffiliation}
            mode="person"
            personId={person.id}
          />
        </CockpitCard>
      ) : null}

      <CockpitCard
        title="Active affiliations"
        value={activeAffiliations.length}
      >
        {activeAffiliations.length > 0 ? (
          <div className="grid gap-3">
            {activeAffiliations.map((affiliation) => (
              <AffiliationCard
                affiliation={affiliation}
                key={affiliation.id}
                mode="person"
                personId={person.id}
                showActions
              />
            ))}
          </div>
        ) : (
          <EmptyState
            action={
              <Button asChild>
                <Link href={`/people/${person.id}/affiliations/new`}>
                  <Plus aria-hidden="true" className="mr-2 size-4" />
                  Add affiliation
                </Link>
              </Button>
            }
            description="Link this person to a company to make their relationship context easier to use."
            icon={UserRound}
            title="No linked companies"
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
                mode="person"
                personId={person.id}
                showActions
              />
            ))}
          </div>
        </CockpitCard>
      ) : null}

      {activeAffiliations.length > 0 ? (
        <Button asChild>
          <Link href={`/people/${person.id}/affiliations/new`}>
            <Plus aria-hidden="true" className="mr-2 size-4" />
            Add affiliation
          </Link>
        </Button>
      ) : null}

      <RelatedContextSummary
        meetings={relatedContext.meetings}
        notes={relatedContext.notes}
      />

      <ArchiveRecordButton
        action={archivePersonAction.bind(null, person.id)}
        recordName={person.displayName}
        recordType="person"
      />
    </div>
  );
}
