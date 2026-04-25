import Link from "next/link";
import { Building2, CalendarDays, Pencil, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AffiliationActionButton } from "@/modules/people/components/affiliation-action-button";
import {
  archiveAffiliationAction,
  endAffiliationAction,
} from "@/modules/people/actions";

type AffiliationCardProps = {
  affiliation: {
    affiliationTitle: string | null;
    company?: {
      id: string;
      name: string;
    };
    department: string | null;
    endsAt: Date | null;
    id: string;
    isPrimary: boolean;
    person?: {
      displayName: string;
      id: string;
      jobTitle: string | null;
    };
    startsAt: Date | null;
  };
  mode: "company" | "person";
  personId?: string;
  showActions?: boolean;
};

function formatDate(date: Date | null) {
  return date
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
      }).format(date)
    : null;
}

function dateRange(startsAt: Date | null, endsAt: Date | null) {
  const start = formatDate(startsAt);
  const end = formatDate(endsAt);

  if (start && end) {
    return `${start} to ${end}`;
  }

  if (start) {
    return `Since ${start}`;
  }

  if (end) {
    return `Ended ${end}`;
  }

  return null;
}

export function AffiliationCard({
  affiliation,
  mode,
  personId,
  showActions = false,
}: AffiliationCardProps) {
  const relatedEntity =
    mode === "person" ? affiliation.company : affiliation.person;
  const relatedHref =
    mode === "person" && affiliation.company
      ? `/people/companies/${affiliation.company.id}`
      : mode === "company" && affiliation.person
        ? `/people/${affiliation.person.id}`
        : null;
  const title =
    mode === "person"
      ? affiliation.company?.name ?? "Company"
      : affiliation.person?.displayName ?? "Person";
  const subtitle =
    affiliation.affiliationTitle ??
    affiliation.person?.jobTitle ??
    "Affiliation";
  const range = dateRange(affiliation.startsAt, affiliation.endsAt);
  const effectivePersonId = personId ?? affiliation.person?.id;

  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-start gap-3">
        {mode === "person" ? (
          <Building2 aria-hidden="true" className="mt-0.5 size-5 text-primary" />
        ) : (
          <UsersRound aria-hidden="true" className="mt-0.5 size-5 text-primary" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {relatedHref && relatedEntity ? (
              <Link
                className="rounded-sm font-semibold text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                href={relatedHref}
              >
                {title}
              </Link>
            ) : (
              <h2 className="font-semibold text-foreground">{title}</h2>
            )}
            {affiliation.isPrimary ? (
              <Badge variant="success">Primary</Badge>
            ) : null}
            {affiliation.endsAt ? (
              <Badge variant="outline">Ended</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {subtitle}
            {affiliation.department ? `, ${affiliation.department}` : ""}
          </p>
          {range ? (
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-4" />
              {range}
            </p>
          ) : null}
        </div>
      </div>

      {showActions && effectivePersonId ? (
        <div className="mt-3 grid gap-2">
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link
                href={`/people/${effectivePersonId}/affiliations/${affiliation.id}/edit`}
              >
                <Pencil aria-hidden="true" className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
            {!affiliation.endsAt ? (
              <AffiliationActionButton
                action={endAffiliationAction.bind(
                  null,
                  effectivePersonId,
                  affiliation.id,
                )}
                confirmLabel="Confirm end"
                description="The link remains in relationship history and will no longer be treated as active."
                label="End"
                pendingLabel="Ending"
                title="End this affiliation?"
              />
            ) : null}
            <AffiliationActionButton
              action={archiveAffiliationAction.bind(
                null,
                effectivePersonId,
                affiliation.id,
              )}
              confirmLabel="Confirm archive"
              description="The affiliation will be hidden from active relationship context. Historical records remain intact."
              label="Archive"
              pendingLabel="Archiving"
              title="Archive this affiliation?"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
