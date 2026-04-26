import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleDashed } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listTenantFeatureReadiness,
  type FeatureReadinessStatus,
} from "@/server/services/feature-registry";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

function statusLabel(status: FeatureReadinessStatus) {
  switch (status) {
    case "enabled":
      return "Enabled";
    case "disabled":
      return "Disabled";
    case "readiness_only":
      return "Readiness only";
    case "manual_only":
      return "Manual only";
    case "requires_configuration":
      return "Requires configuration";
  }
}

function statusVariant(status: FeatureReadinessStatus) {
  switch (status) {
    case "enabled":
      return "success" as const;
    case "manual_only":
      return "default" as const;
    case "readiness_only":
      return "warning" as const;
    case "requires_configuration":
      return "secondary" as const;
    case "disabled":
      return "outline" as const;
  }
}

export default async function FeatureReadinessPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/settings/features");
  }

  const features = await listTenantFeatureReadiness(context);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href="/settings">
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Settings
            </Link>
          </Button>
        }
        description="Read-only feature readiness for this workspace. This is not billing entitlement or plan enforcement."
        eyebrow="Settings"
        title="Features"
      />

      <CockpitCard title="Configuration boundary" value="Read-only">
        <p className="text-sm leading-6 text-muted-foreground">
          Feature cards are computed from internal configuration and runtime
          readiness. Step 13A does not add paid feature gating, quotas,
          per-tenant entitlements, or plan enforcement.
        </p>
      </CockpitCard>

      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => {
          const enabled = feature.status === "enabled";
          const Icon = enabled ? CheckCircle2 : CircleDashed;

          return (
            <article
              className="rounded-md border border-border bg-card p-4 shadow-sm"
              key={feature.key}
            >
              <div className="grid gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <h2 className="text-base font-semibold text-foreground">
                      {feature.title}
                    </h2>
                  </div>
                  <Badge variant={statusVariant(feature.status)}>
                    {statusLabel(feature.status)}
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
