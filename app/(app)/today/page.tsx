import { redirect } from "next/navigation";
import {
  CalendarClock,
  Handshake,
  ListChecks,
  Sparkles,
} from "lucide-react";

import { CockpitCard } from "@/components/cards/cockpit-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/empty-state";
import { getAppShellSummary } from "@/server/services/app-shell-summary";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/today");
  }

  const summary = await getAppShellSummary(context);
  const hasDailySignals =
    summary.action.openTasks > 0 ||
    summary.action.openCommitments > 0 ||
    summary.action.upcomingMeetings > 0 ||
    summary.action.pendingProposals > 0 ||
    summary.opportunities.introductionSuggestions > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        description="A quiet command center for follow-ups, commitments, preparation cues, and relationship opportunities."
        eyebrow="Daily cockpit"
        title="Today"
      />

      <section
        aria-label="Daily signals"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <CockpitCard
          eyebrow="Follow-ups"
          title="Open tasks"
          value={summary.action.openTasks}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Relationship actions waiting for attention.
          </p>
        </CockpitCard>
        <CockpitCard
          eyebrow="Ledger"
          title="Open commitments"
          value={summary.action.openCommitments}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Promises and obligations tracked separately from tasks.
          </p>
        </CockpitCard>
        <CockpitCard
          eyebrow="Prep"
          title="Upcoming meetings"
          value={summary.action.upcomingMeetings}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Meeting memory prepared for upcoming conversations.
          </p>
        </CockpitCard>
        <CockpitCard
          eyebrow="Review"
          title="Pending proposals"
          value={summary.action.pendingProposals}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            AI-readiness records waiting for explicit review.
          </p>
        </CockpitCard>
      </section>

      {hasDailySignals ? (
        <section
          aria-label="Today board"
          className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]"
        >
          <CockpitCard title="Why now">
            <div className="grid gap-3">
              <div className="flex gap-3 rounded-md border border-border bg-background p-3">
                <ListChecks
                  aria-hidden="true"
                  className="mt-0.5 size-5 text-primary"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">
                      Follow-up attention
                    </h2>
                    <Badge variant="secondary">
                      {summary.action.openTasks} open
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Task timing, commitment source, and relationship context
                    stay visible together.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-md border border-border bg-background p-3">
                <Handshake
                  aria-hidden="true"
                  className="mt-0.5 size-5 text-primary"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">
                      Introduction readiness
                    </h2>
                    <Badge variant="outline">
                      {summary.opportunities.introductionSuggestions} suggested
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Suggested introductions stay read-only in this shell.
                  </p>
                </div>
              </div>
            </div>
          </CockpitCard>

          <CockpitCard title="Meeting preparation">
            <div className="flex gap-3 rounded-md border border-border bg-background p-3">
              <CalendarClock
                aria-hidden="true"
                className="mt-0.5 size-5 text-primary"
              />
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Next conversations
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Preparation context stays source-linked and sensitive-context
                  aware.
                </p>
              </div>
            </div>
          </CockpitCard>
        </section>
      ) : (
        <EmptyState
          description="Seed demo data to preview the daily cockpit."
          icon={Sparkles}
          title="No daily signals yet"
        />
      )}
    </div>
  );
}
