import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { WorkspaceNameForm } from "@/modules/settings/components/workspace-name-form";
import { getCurrentUserContext } from "@/server/services/session";
import { getTenantWorkspaceSettingsProfile } from "@/server/services/workspace-admin";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

export default async function WorkspaceSettingsPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/settings/workspace");
  }

  const profile = await getTenantWorkspaceSettingsProfile(context);

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
        description="Workspace identity and safe metadata for the active tenant."
        eyebrow="Settings"
        title="Workspace"
      />

      <CockpitCard
        eyebrow="Workspace"
        title={profile.tenant.name}
        value={profile.currentUserRole}
      >
        <div className="grid gap-5">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Workspace ID</dt>
                <dd className="mt-1 break-all font-medium text-foreground">
                  {profile.tenant.id}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Slug</dt>
                <dd className="mt-1 break-all font-medium text-foreground">
                  {profile.tenant.slug}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatDate(profile.tenant.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatDate(profile.tenant.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>

          <WorkspaceNameForm
            canUpdate={profile.canUpdateWorkspace}
            initialName={profile.tenant.name}
          />

          <p className="rounded-md border border-border bg-muted p-3 text-sm leading-6 text-muted-foreground">
            Slug editing, workspace deletion, ownership transfer, tenant
            switching, and tenant creation are intentionally not part of this
            foundation step.
          </p>
        </div>
      </CockpitCard>
    </div>
  );
}
