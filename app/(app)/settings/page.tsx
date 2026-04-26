import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CreditCard,
  FileDown,
  PlugZap,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { isWorkspaceAdminRole } from "@/server/services/admin-authorization";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  const canOpenAdmin = isWorkspaceAdminRole(context.roleKey);
  const settingsCards = [
    {
      description:
        "Review workspace identity, safe tenant metadata, and your current admin boundary.",
      href: "/settings/workspace",
      icon: Building2,
      title: "Workspace",
      value: context.tenantName,
    },
    {
      description:
        "View active and inactive workspace members. Owners can manage roles and membership status.",
      href: canOpenAdmin ? "/settings/members" : undefined,
      icon: UsersRound,
      title: "Members",
      value: canOpenAdmin ? "Admin" : "Owner/admin only",
    },
    {
      description:
        "Read-only readiness cards for voice, AI structuring, integrations, billing, and deterministic intelligence.",
      href: "/settings/features",
      icon: SlidersHorizontal,
      title: "Features",
      value: "Read-only",
    },
    {
      description:
        "Review readiness and manual boundaries for Microsoft Graph and LinkedIn context.",
      href: "/settings/integrations",
      icon: PlugZap,
      title: "Integrations",
      value: "Readiness",
    },
    {
      description:
        "Review billing readiness, disabled provider status, and future subscription boundaries.",
      href: canOpenAdmin ? "/settings/billing" : undefined,
      icon: CreditCard,
      title: "Billing",
      value: canOpenAdmin ? "Readiness" : "Owner/admin only",
    },
    {
      description:
        "Review tenant-scoped audit events and read-only privacy/security governance boundaries.",
      href: canOpenAdmin ? "/settings/governance" : undefined,
      icon: ScrollText,
      title: "Governance",
      value: canOpenAdmin ? "Audit viewer" : "Owner/admin only",
    },
    {
      description:
        "Download tenant-scoped JSON exports and review privacy handling boundaries.",
      href: "/settings/privacy",
      icon: FileDown,
      title: "Privacy & export",
      value: "JSON export",
    },
    {
      description:
        "Review archived records, restore supported records, and inspect retention boundaries.",
      href: canOpenAdmin ? "/settings/archive" : undefined,
      icon: Archive,
      title: "Archive & retention",
      value: canOpenAdmin ? "Restore controls" : "Owner/admin only",
    },
  ];

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
        description="Workspace administration, integrations, and feature readiness controls."
        eyebrow="Settings"
        title="Settings"
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
            <div>
              <dt className="text-muted-foreground">Admin access</dt>
              <dd className="mt-1 font-medium text-foreground">
                {canOpenAdmin ? "Workspace admin" : "Read-only settings"}
              </dd>
            </div>
          </dl>
        </div>
      </CockpitCard>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsCards.map((card) => {
          const Icon = card.icon;

          return (
            <CockpitCard key={card.title} title={card.title} value={card.value}>
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                {card.href ? (
                  <div>
                    <Button asChild variant="outline">
                      <Link href={card.href}>Open {card.title.toLowerCase()}</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <BadgeCheck aria-hidden="true" className="size-4" />
                    Owner/admin access required
                  </div>
                )}
              </div>
            </CockpitCard>
          );
        })}
      </div>
    </div>
  );
}
