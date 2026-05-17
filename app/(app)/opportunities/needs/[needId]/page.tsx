import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit,
  FileText,
  RotateCcw,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { archiveNeedAction } from "@/modules/opportunities/actions";
import { NeedBadges } from "@/modules/opportunities/components/opportunity-badges";
import { OpportunityActionButton } from "@/modules/opportunities/components/opportunity-action-button";
import { formatNeedReviewDate } from "@/modules/opportunities/labels";
import { getTenantNeedProfile } from "@/server/services/needs";
import { listTenantSourceReferencesForTarget } from "@/server/services/source-references";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type NeedDetailPageProps = {
  params: Promise<{
    needId: string;
  }>;
};

function isVisibleSourceReference(reference: {
  sourceEntityType: string;
  targetEntityType: string;
}) {
  return (
    reference.sourceEntityType !== "INTRODUCTION_SUGGESTION" &&
    reference.targetEntityType !== "INTRODUCTION_SUGGESTION"
  );
}

export default async function NeedDetailPage({ params }: NeedDetailPageProps) {
  const [{ needId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/opportunities/needs/${needId}`);
  }

  const need = await getTenantNeedProfile(context, needId);

  if (!need) {
    notFound();
  }

  const sourceReferences = await listTenantSourceReferencesForTarget(context, {
    targetEntityId: need.id,
    targetEntityType: "NEED",
  });
  const visibleSourceReferences =
    sourceReferences.filter(isVisibleSourceReference);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/opportunities/needs">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Needs
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/opportunities/needs/${need.id}/edit`}>
                <Edit aria-hidden="true" className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
          </div>
        }
        description="Manual need record"
        eyebrow="Need"
        title={need.title}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <CockpitCard title="Need state">
          <div className="grid gap-3">
            <NeedBadges
              confidence={need.confidence}
              needType={need.needType}
              priority={need.priority}
              sensitivity={need.sensitivity}
              status={need.status}
            />
            <div className="flex flex-wrap gap-2">
              <Badge variant={need.reviewAfter ? "secondary" : "outline"}>
                <span className="flex items-center gap-1">
                  <RotateCcw aria-hidden="true" className="size-3.5" />
                  Review after {formatNeedReviewDate(need.reviewAfter)}
                </span>
              </Badge>
            </div>
          </div>
        </CockpitCard>

        <CockpitCard title="Context">
          <div className="flex flex-wrap gap-2">
            {need.person ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/${need.person.id}`}
                >
                  <UserRound aria-hidden="true" className="size-3.5" />
                  {need.person.displayName}
                </Link>
              </Badge>
            ) : null}
            {need.company ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/companies/${need.company.id}`}
                >
                  <Building2 aria-hidden="true" className="size-3.5" />
                  {need.company.name}
                </Link>
              </Badge>
            ) : null}
            {need.meeting ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/meetings/${need.meeting.id}`}
                >
                  <CalendarDays aria-hidden="true" className="size-3.5" />
                  {need.meeting.title}
                </Link>
              </Badge>
            ) : null}
            {need.note ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/notes/${need.note.id}`}
                >
                  <FileText aria-hidden="true" className="size-3.5" />
                  {need.note.summary ?? `${need.note.noteType} note`}
                </Link>
              </Badge>
            ) : null}
            {!need.person && !need.company && !need.meeting && !need.note ? (
              <Badge variant="secondary">No linked context</Badge>
            ) : null}
          </div>
        </CockpitCard>
      </section>

      {need.description ? (
        <CockpitCard title="Description">
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {need.description}
          </p>
        </CockpitCard>
      ) : null}

      <CockpitCard title="Source references">
        <div className="grid gap-3 text-sm text-muted-foreground">
          <p>
            Provenance links are informational only. This screen does not run
            matching, scoring, extraction, or AI generation.
          </p>
          {visibleSourceReferences.length > 0 ? (
            <div className="grid gap-2">
              {visibleSourceReferences.map((reference) => (
                <div
                  className="rounded-md border border-border bg-background p-3"
                  key={reference.id}
                >
                  <p className="font-medium text-foreground">
                    {reference.sourceEntityType} to {reference.targetEntityType}
                  </p>
                  {reference.label ? (
                    <p className="mt-1">{reference.label}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <Badge className="w-fit" variant="secondary">
              No source references
            </Badge>
          )}
        </div>
      </CockpitCard>

      <OpportunityActionButton
        action={archiveNeedAction.bind(null, need.id)}
        confirmLabel="Archive need"
        description="The need will be hidden from active opportunity lists. Related people, companies, meetings, notes, and source references stay unchanged."
        label="Archive need"
        pendingLabel="Archiving"
        title="Archive this need?"
        variant="outline"
      />
    </div>
  );
}
