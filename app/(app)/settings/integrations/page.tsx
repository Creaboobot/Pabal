import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Link2,
  Mail,
  PlugZap,
  ShieldCheck,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

const futureCapabilities = [
  {
    description: "Future read-only calendar context for meeting preparation.",
    icon: CalendarDays,
    title: "Calendar",
  },
  {
    description: "Future user-selected email thread context, not bulk inbox import.",
    icon: Mail,
    title: "Selected email context",
  },
  {
    description: "Future read-only contact context for known relationship records.",
    icon: Users,
    title: "Contacts",
  },
];

const privacyBoundaries = [
  "No bulk ingestion",
  "No background sync",
  "No email body import",
];

const linkedInBoundaries = [
  "User-provided URLs and pasted context only",
  "No scraping or browser automation",
  "No background monitoring",
  "No LinkedIn API or Sales Navigator sync",
];

export default async function IntegrationsSettingsPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/settings/integrations");
  }

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
        description="Readiness surface for future provider integrations. No external data is imported here."
        eyebrow="Settings"
        title="Integrations"
      />

      <CockpitCard
        eyebrow="Microsoft Graph"
        title="Microsoft integration"
        value="Not connected"
      >
        <div className="grid gap-5">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <PlugZap aria-hidden="true" className="size-5" />
            </span>
            <div className="grid gap-2 text-sm">
              <p className="font-medium text-foreground">
                Readiness only. No Microsoft data is synced yet.
              </p>
              <p className="text-muted-foreground">
                This workspace is prepared for a future, explicitly connected
                Microsoft Graph integration. OAuth, tokens, sync, and ingestion
                are not implemented in this step.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {futureCapabilities.map((capability) => {
              const Icon = capability.icon;

              return (
                <div
                  className="flex gap-3 rounded-md border border-border p-3"
                  key={capability.title}
                >
                  <Icon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="grid gap-1 text-sm">
                    <h2 className="font-medium text-foreground">
                      {capability.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {capability.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-md bg-muted p-3 text-sm">
            <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
              <ShieldCheck aria-hidden="true" className="size-4" />
              Privacy boundary
            </div>
            <ul className="grid gap-2 text-muted-foreground">
              {privacyBoundaries.map((boundary) => (
                <li className="flex items-center gap-2" key={boundary}>
                  <CheckCircle2
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary"
                  />
                  {boundary}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-2 text-sm">
            <p className="text-muted-foreground">
              Future connections must be scoped to {context.tenantName}, the
              connecting user, the approved provider, requested scopes, and a
              clear connection status.
            </p>
            <Button disabled type="button" variant="secondary">
              Connection coming later
            </Button>
          </div>
        </div>
      </CockpitCard>

      <CockpitCard
        eyebrow="LinkedIn"
        title="LinkedIn manual enrichment"
        value="Manual only"
      >
        <div className="grid gap-5">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <Link2 aria-hidden="true" className="size-5" />
            </span>
            <div className="grid gap-2 text-sm">
              <p className="font-medium text-foreground">
                No connection required. LinkedIn context is manual only.
              </p>
              <p className="text-muted-foreground">
                People can store user-provided LinkedIn and Sales Navigator
                URLs, and notes can store pasted context labelled as
                user-provided. Pabal does not connect to LinkedIn or import
                profile content.
              </p>
            </div>
          </div>

          <div className="rounded-md bg-muted p-3 text-sm">
            <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
              <ShieldCheck aria-hidden="true" className="size-4" />
              Compliance boundary
            </div>
            <ul className="grid gap-2 text-muted-foreground">
              {linkedInBoundaries.map((boundary) => (
                <li className="flex items-center gap-2" key={boundary}>
                  <CheckCircle2
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary"
                  />
                  {boundary}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Users should only paste LinkedIn or Sales Navigator content they are
            allowed to use. Pabal does not use LinkedIn cookies, sessions,
            headless browsing, extensions, or automated enrichment.
          </p>
        </div>
      </CockpitCard>
    </div>
  );
}
