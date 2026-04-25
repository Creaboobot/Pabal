import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClipboardPenLine,
  Mic,
  NotebookPen,
  ClipboardPaste,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAppShellSummary } from "@/server/services/app-shell-summary";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type CaptureSurface = {
  actionLabel?: string;
  description: string;
  href?: string;
  icon: LucideIcon;
  title: string;
};

const captureSurfaces: CaptureSurface[] = [
  {
    title: "Meeting",
    description: "Create a meeting record for manual relationship context.",
    href: "/meetings/new",
    actionLabel: "Create meeting",
    icon: NotebookPen,
  },
  {
    title: "Pasted meeting note",
    description: "Store user-provided Teams/Copilot notes as source context.",
    href: "/capture/meeting",
    actionLabel: "Paste notes",
    icon: ClipboardPaste,
  },
  {
    title: "General note",
    description: "Write a manual note and link it to known context.",
    href: "/notes/new",
    actionLabel: "Create note",
    icon: ClipboardPenLine,
  },
  {
    title: "Voice note",
    description: "Transcript-ready space without recorder or upload controls.",
    icon: Mic,
  },
  {
    title: "Relationship lead",
    description: "Person and company context held as a read-only placeholder.",
    icon: UserPlus,
  },
];

export default async function CapturePage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/capture");
  }

  const summary = await getAppShellSummary(context);

  return (
    <div className="space-y-6">
      <PageHeader
        description="A capture hub for the moments between meetings, kept read-only in this shell."
        eyebrow="Quick memory"
        title="Capture"
      />

      <section
        aria-label="Capture surfaces"
        className="grid gap-3 sm:grid-cols-2"
      >
        {captureSurfaces.map((surface) => {
          const Icon = surface.icon;

          return (
            <CockpitCard key={surface.title} title={surface.title}>
              <div className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {surface.description}
                  </p>
                  {surface.href && surface.actionLabel ? (
                    <Button asChild className="mt-3" size="sm">
                      <Link href={surface.href}>{surface.actionLabel}</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </CockpitCard>
          );
        })}
      </section>

      <CockpitCard title="Current capture memory">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{summary.capture.notes} notes</Badge>
          <Badge variant="secondary">
            {summary.capture.voiceNotes} voice notes
          </Badge>
          <Badge variant="outline">
            {summary.capture.pendingProposals} proposals pending
          </Badge>
        </div>
      </CockpitCard>
    </div>
  );
}
