import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Settings, UserRound } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/account");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/settings">
              <Settings aria-hidden="true" className="mr-2 size-4" />
              Settings
            </Link>
          </Button>
        }
        description="Workspace and membership context for the signed-in session."
        eyebrow="Account"
        title="Your workspace"
      />

      <section
        aria-label="Account context"
        className="grid gap-3 sm:grid-cols-2"
      >
        <CockpitCard title="Workspace">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-foreground">
                {context.tenantName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Active workspace for tenant-scoped reads.
              </p>
            </div>
          </div>
        </CockpitCard>

        <CockpitCard title="Membership">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <UserRound aria-hidden="true" className="size-5" />
            </span>
            <div>
              <Badge variant="secondary">{context.roleKey}</Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                Role checks remain in server-side services.
              </p>
            </div>
          </div>
        </CockpitCard>
      </section>
    </div>
  );
}
