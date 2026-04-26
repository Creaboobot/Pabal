import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, PlugZap, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href="/account">
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Account
            </Link>
          </Button>
        }
        description="Foundation settings surface for workspace and security context."
        eyebrow="Settings"
        title="Workspace settings"
      />

      <CockpitCard title="Security boundary">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Workspace</dt>
              <dd className="mt-1 font-medium text-foreground">
                {context.tenantName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="mt-1 font-medium text-foreground">
                {context.roleKey}
              </dd>
            </div>
          </dl>
        </div>
      </CockpitCard>

      <CockpitCard
        eyebrow="Readiness"
        title="Integrations"
        value="1"
      >
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <PlugZap aria-hidden="true" className="size-5" />
          </span>
          <div className="grid gap-3 text-sm">
            <p className="text-muted-foreground">
              Review future Microsoft Graph integration readiness for calendar,
              selected email context, and contacts.
            </p>
            <div>
              <Button asChild variant="outline">
                <Link href="/settings/integrations">Open integrations</Link>
              </Button>
            </div>
          </div>
        </div>
      </CockpitCard>
    </div>
  );
}
