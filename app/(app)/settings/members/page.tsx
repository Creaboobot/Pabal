import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MailPlus, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { isWorkspaceAdminRole } from "@/server/services/admin-authorization";
import { getCurrentUserContext } from "@/server/services/session";
import { getTenantWorkspaceAdminProfile } from "@/server/services/workspace-admin";
import { MemberManagementCard } from "@/modules/settings/components/member-management-card";

export const dynamic = "force-dynamic";

export default async function WorkspaceMembersPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/settings/members");
  }

  if (!isWorkspaceAdminRole(context.roleKey)) {
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
          description="Workspace membership is visible to owners and admins."
          eyebrow="Settings"
          title="Members"
        />

        <CockpitCard title="Admin access required">
          <p className="text-sm leading-6 text-muted-foreground">
            Owner or admin access is required to view workspace membership.
            Membership changes are handled in server-side services and are not
            available to standard members or viewers.
          </p>
        </CockpitCard>
      </div>
    );
  }

  const profile = await getTenantWorkspaceAdminProfile(context);
  const activeMembers = profile.members.filter(
    (member) => member.status === "ACTIVE",
  );
  const inactiveMembers = profile.members.filter(
    (member) => member.status === "INACTIVE",
  );

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
        description="Tenant-scoped member list with conservative owner-controlled administration."
        eyebrow="Settings"
        title="Members"
      />

      <CockpitCard
        eyebrow="Workspace"
        title="Member administration"
        value={`${activeMembers.length} active`}
      >
        <div className="grid gap-5">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <UsersRound aria-hidden="true" className="size-5" />
            </span>
            <p className="text-sm leading-6 text-muted-foreground">
              Owners can update roles and activate or deactivate memberships.
              Memberships are never hard-deleted, and last-owner protection is
              enforced by the service layer.
            </p>
          </div>

          <div className="rounded-md border border-dashed border-border bg-muted p-3">
            <div className="flex gap-3 text-sm">
              <MailPlus
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
              <div className="grid gap-1">
                <p className="font-medium text-foreground">
                  Invitations coming later
                </p>
                <p className="leading-6 text-muted-foreground">
                  Email invitations, invite tokens, onboarding emails, SCIM, and
                  SSO provisioning are intentionally not implemented in Step 13A.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CockpitCard>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          Active members
        </h2>
        <div className="grid gap-3">
          {activeMembers.map((member) => (
            <MemberManagementCard
              canManage={profile.canManageMembers}
              currentUserId={context.userId}
              key={member.id}
              member={member}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          Inactive members
        </h2>
        {inactiveMembers.length > 0 ? (
          <div className="grid gap-3">
            {inactiveMembers.map((member) => (
              <MemberManagementCard
                canManage={profile.canManageMembers}
                currentUserId={context.userId}
                key={member.id}
                member={member}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
            No inactive memberships.
          </div>
        )}
      </section>
    </div>
  );
}
