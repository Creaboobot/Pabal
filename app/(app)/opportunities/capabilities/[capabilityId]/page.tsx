import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Edit,
  FileText,
  Handshake,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { archiveCapabilityAction } from "@/modules/opportunities/actions";
import { CapabilityBadges } from "@/modules/opportunities/components/opportunity-badges";
import { OpportunityActionButton } from "@/modules/opportunities/components/opportunity-action-button";
import { getTenantCapabilityProfile } from "@/server/services/capabilities";
import { listTenantSourceReferencesForTarget } from "@/server/services/source-references";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type CapabilityDetailPageProps = {
  params: Promise<{
    capabilityId: string;
  }>;
};

export default async function CapabilityDetailPage({
  params,
}: CapabilityDetailPageProps) {
  const [{ capabilityId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/opportunities/capabilities/${capabilityId}`);
  }

  const capability = await getTenantCapabilityProfile(context, capabilityId);

  if (!capability) {
    notFound();
  }

  const sourceReferences = await listTenantSourceReferencesForTarget(context, {
    targetEntityId: capability.id,
    targetEntityType: "CAPABILITY",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/opportunities/capabilities">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Capabilities
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/opportunities/capabilities/${capability.id}/edit`}>
                <Edit aria-hidden="true" className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
            <Button asChild>
              <Link
                href={`/opportunities/introductions/new?capabilityId=${capability.id}`}
              >
                <Handshake aria-hidden="true" className="mr-2 size-4" />
                Create introduction
              </Link>
            </Button>
          </div>
        }
        description="Manual capability record"
        eyebrow="Capability"
        title={capability.title}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <CockpitCard title="Capability state">
          <CapabilityBadges
            capabilityType={capability.capabilityType}
            confidence={capability.confidence}
            sensitivity={capability.sensitivity}
            status={capability.status}
          />
        </CockpitCard>

        <CockpitCard title="Context">
          <div className="flex flex-wrap gap-2">
            {capability.person ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/${capability.person.id}`}
                >
                  <UserRound aria-hidden="true" className="size-3.5" />
                  {capability.person.displayName}
                </Link>
              </Badge>
            ) : null}
            {capability.company ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/companies/${capability.company.id}`}
                >
                  <Building2 aria-hidden="true" className="size-3.5" />
                  {capability.company.name}
                </Link>
              </Badge>
            ) : null}
            {capability.note ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/notes/${capability.note.id}`}
                >
                  <FileText aria-hidden="true" className="size-3.5" />
                  {capability.note.summary ??
                    `${capability.note.noteType} note`}
                </Link>
              </Badge>
            ) : null}
            {!capability.person && !capability.company && !capability.note ? (
              <Badge variant="secondary">No linked context</Badge>
            ) : null}
          </div>
        </CockpitCard>
      </section>

      {capability.description ? (
        <CockpitCard title="Description">
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {capability.description}
          </p>
        </CockpitCard>
      ) : null}

      <CockpitCard title="Source references">
        <div className="grid gap-3 text-sm text-muted-foreground">
          <p>
            Provenance links are informational only. This screen does not run
            matching, scoring, extraction, or AI generation.
          </p>
          {sourceReferences.length > 0 ? (
            <div className="grid gap-2">
              {sourceReferences.map((reference) => (
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
        action={archiveCapabilityAction.bind(null, capability.id)}
        confirmLabel="Archive capability"
        description="The capability will be hidden from active opportunity lists. Related people, companies, notes, and source references stay unchanged."
        label="Archive capability"
        pendingLabel="Archiving"
        title="Archive this capability?"
        variant="outline"
      />
    </div>
  );
}
