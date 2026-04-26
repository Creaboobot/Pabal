import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isWorkspaceAdminRole } from "@/server/services/admin-authorization";
import { getTenantBillingReadiness } from "@/server/services/billing-readiness";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

function readinessStatusLabel(status: string) {
  switch (status) {
    case "DISABLED":
      return "Disabled";
    case "INTERNAL":
      return "Internal";
    case "TRIAL":
      return "Trial";
    case "ACTIVE":
      return "Active";
    case "PAST_DUE":
      return "Past due";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

const readinessBoundaries = [
  "No live checkout",
  "No billing portal",
  "No Stripe webhooks",
  "No card or payment method storage",
  "No hard plan enforcement",
];

export default async function BillingSettingsPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/settings/billing");
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
          description="Billing settings are visible to workspace owners and admins."
          eyebrow="Settings"
          title="Billing"
        />

        <CockpitCard title="Admin access required">
          <p className="text-sm leading-6 text-muted-foreground">
            Owner or admin access is required to view billing readiness. Billing
            state is tenant-scoped and is not exposed across workspaces.
          </p>
        </CockpitCard>
      </div>
    );
  }

  const readiness = await getTenantBillingReadiness(context);
  const providerStatus = readiness.billing.providerStatus;

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
        description="Read-only billing readiness for this workspace. Payment processing is not live."
        eyebrow="Settings"
        title="Billing"
      />

      <CockpitCard
        eyebrow={readiness.tenant.name}
        title="Billing readiness"
        value={readinessStatusLabel(readiness.billing.status)}
      >
        <div className="grid gap-4">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CreditCard aria-hidden="true" className="size-5" />
            </span>
            <div className="grid gap-2 text-sm">
              <p className="font-medium text-foreground">
                Billing is readiness-only. No payment processing is enabled.
              </p>
              <p className="leading-6 text-muted-foreground">
                Pabal can now show a billing settings surface and provider
                status, but this workspace cannot start checkout, open a billing
                portal, or enforce plans in Step 13B.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Workspace: {readiness.tenant.name}</Badge>
            <Badge variant="secondary">Role: {readiness.currentUserRole}</Badge>
            <Badge variant="warning">Readiness only</Badge>
          </div>
        </div>
      </CockpitCard>

      <div className="grid gap-4 md:grid-cols-2">
        <CockpitCard
          eyebrow="Provider"
          title="Billing provider"
          value={providerStatus.provider}
        >
          <div className="grid gap-4 text-sm">
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <LockKeyhole aria-hidden="true" className="size-5" />
              </span>
              <div className="grid gap-1">
                <p className="font-medium text-foreground">
                  {providerStatus.message}
                </p>
                <p className="leading-6 text-muted-foreground">
                  The default provider is disabled. The mock provider is only
                  available for local and test verification outside production.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={providerStatus.configured ? "success" : "outline"}>
                {providerStatus.configured ? "Configured" : "Not configured"}
              </Badge>
              <Badge variant={providerStatus.liveMode ? "sensitive" : "outline"}>
                {providerStatus.liveMode ? "Live mode" : "No live mode"}
              </Badge>
            </div>
          </div>
        </CockpitCard>

        <CockpitCard
          eyebrow="Subscription"
          title="Future subscription"
          value={
            readiness.billing.subscription?.planName ??
            "No subscription record"
          }
        >
          <div className="grid gap-4 text-sm">
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <ReceiptText aria-hidden="true" className="size-5" />
              </span>
              <p className="leading-6 text-muted-foreground">
                Step 13B does not create billing tables, customers,
                subscriptions, invoices, or payment method records. Future live
                billing needs a separately approved model and provider step.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button disabled type="button" variant="secondary">
                Checkout coming later
              </Button>
              <Button disabled type="button" variant="secondary">
                Billing portal coming later
              </Button>
            </div>
          </div>
        </CockpitCard>
      </div>

      <CockpitCard title="Privacy and payment boundary" value="No payment data">
        <div className="grid gap-4">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <p className="text-sm leading-6 text-muted-foreground">
              Billing readiness stores no card data, no payment method details,
              no raw Stripe payloads, and no invoice payloads. Stripe
              environment variables are documented as future optional values and
              are not required for build or readiness.
            </p>
          </div>

          <div className="grid gap-2">
            {readinessBoundaries.map((boundary) => (
              <div
                className="flex items-center gap-2 rounded-md border border-border p-3 text-sm text-muted-foreground"
                key={boundary}
              >
                <WalletCards
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary"
                />
                {boundary}
              </div>
            ))}
          </div>
        </div>
      </CockpitCard>
    </div>
  );
}
