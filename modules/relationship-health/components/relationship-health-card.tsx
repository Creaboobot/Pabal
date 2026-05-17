import Link from "next/link";
import { Activity, AlertTriangle, Clock3, HeartPulse } from "lucide-react";

import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import {
  formatRelationshipDate,
  relationshipHealthSignalLabel,
  relationshipHealthSignalVariant,
  whyNowSeverityLabel,
  whyNowSeverityVariant,
} from "@/modules/relationship-health/labels";
import type { RelationshipHealth } from "@/server/services/relationship-health";

type RelationshipHealthCardProps = {
  health: RelationshipHealth;
  title?: string;
};

function reasonIcon(severity: string) {
  if (severity === "CRITICAL" || severity === "HIGH") {
    return AlertTriangle;
  }

  if (severity === "MEDIUM") {
    return Clock3;
  }

  return Activity;
}

export function RelationshipHealthCard({
  health,
  title = "Relationship health",
}: RelationshipHealthCardProps) {
  return (
    <CockpitCard title={title}>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={relationshipHealthSignalVariant(health.signal)}>
            {relationshipHealthSignalLabel(health.signal)}
          </Badge>
          <Badge variant="outline">
            Last interaction {formatRelationshipDate(health.lastInteractionAt)}
          </Badge>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          {health.explanation}
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Badge variant="secondary">{health.counts.openTasks} tasks</Badge>
          <Badge variant="secondary">
            {health.counts.openCommitments} commitments
          </Badge>
          <Badge variant="secondary">{health.counts.activeNeeds} needs</Badge>
          <Badge variant="secondary">
            {health.counts.activeCapabilities} capabilities
          </Badge>
          <Badge variant="secondary">
            {health.counts.activeIntroductions} introductions
          </Badge>
          <Badge variant="secondary">
            {health.counts.pendingProposals} suggested updates
          </Badge>
        </div>

        <div className="grid gap-2">
          {health.reasons.map((reason) => {
            const Icon = reasonIcon(reason.severity);
            const content = (
              <div className="flex gap-3 rounded-md border border-border bg-background p-3">
                <Icon
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {reason.label}
                    </h3>
                    <Badge variant={whyNowSeverityVariant(reason.severity)}>
                      {whyNowSeverityLabel(reason.severity)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {reason.explanation}
                  </p>
                </div>
              </div>
            );

            return reason.href ? (
              <Link
                className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={reason.href}
                key={`${reason.type}-${reason.relatedEntityId}`}
              >
                {content}
              </Link>
            ) : (
              <div key={`${reason.type}-${reason.relatedEntityId}`}>
                {content}
              </div>
            );
          })}
        </div>

        {health.reasonCount > health.reasons.length ? (
          <p className="text-sm text-muted-foreground">
            Showing {health.reasons.length} of {health.reasonCount} deterministic
            reasons.
          </p>
        ) : null}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HeartPulse aria-hidden="true" className="size-4" />
          Computed at read time. No score is stored.
        </div>
      </div>
    </CockpitCard>
  );
}
