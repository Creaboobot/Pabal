import Link from "next/link";
import { HeartPulse } from "lucide-react";

import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  formatRelationshipDate,
  relationshipHealthSignalLabel,
  relationshipHealthSignalVariant,
  whyNowSeverityLabel,
  whyNowSeverityVariant,
} from "@/modules/relationship-health/labels";
import type { RelationshipHealth } from "@/server/services/relationship-health";

type RelationshipAttentionBoardProps = {
  items: RelationshipHealth[];
};

function entityHref(item: RelationshipHealth) {
  return item.entityType === "PERSON"
    ? `/people/${item.entityId}`
    : `/people/companies/${item.entityId}`;
}

export function RelationshipAttentionBoard({
  items,
}: RelationshipAttentionBoardProps) {
  return (
    <CockpitCard title="Relationship attention" value={items.length}>
      {items.length > 0 ? (
        <div className="grid gap-3">
          <p className="text-sm leading-6 text-muted-foreground">
            Deterministic why-now signals from tasks, commitments, meetings,
            notes, needs, capabilities, and suggested update review records.
          </p>
          <div className="grid gap-3">
            {items.map((item) => {
              const primaryReason = item.reasons[0];

              return (
                <article
                  className="rounded-md border border-border bg-background p-3"
                  key={`${item.entityType}-${item.entityId}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        className="rounded-sm font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                        href={entityHref(item)}
                      >
                        {item.entityLabel}
                      </Link>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.explanation}
                      </p>
                    </div>
                    <Badge
                      variant={relationshipHealthSignalVariant(item.signal)}
                    >
                      {relationshipHealthSignalLabel(item.signal)}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {item.entityType === "PERSON" ? "Person" : "Company"}
                    </Badge>
                    <Badge variant="outline">
                      Last {formatRelationshipDate(item.lastInteractionAt)}
                    </Badge>
                    {primaryReason ? (
                      <Badge
                        variant={whyNowSeverityVariant(primaryReason.severity)}
                      >
                        {whyNowSeverityLabel(primaryReason.severity)}
                      </Badge>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          description="Relationship attention appears here when deterministic signals find stale context or linked actions."
          icon={HeartPulse}
          title="No relationship attention needed"
        />
      )}
    </CockpitCard>
  );
}
