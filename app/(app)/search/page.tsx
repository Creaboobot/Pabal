import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Database,
  FileSearch,
  Search as SearchIcon,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAppShellSummary } from "@/server/services/app-shell-summary";
import { getCurrentUserContext } from "@/server/services/session";
import { getTenantStructuredSearch } from "@/server/services/structured-search";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatSearchDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/search");
  }

  const params = await searchParams;
  const summary = await getAppShellSummary(context);
  const search = await getTenantStructuredSearch(
    context,
    firstSearchParam(params?.q),
  );
  const indexedRecords =
    summary.people.people +
    summary.people.companies +
    summary.capture.notes +
    summary.capture.voiceNotes +
    summary.action.openTasks +
    summary.action.openCommitments +
    summary.action.pendingProposals +
    summary.opportunities.needs +
    summary.opportunities.capabilities +
    summary.opportunities.introductionSuggestions;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Tenant-scoped keyword lookup across structured network records."
        eyebrow="Network lookup"
        title="Search"
      />

      <section aria-label="Search input" className="space-y-3">
        <form action="/search" className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            aria-label="Search network memory"
            defaultValue={search.query}
            name="q"
            placeholder="Search people, notes, needs, commitments"
            type="search"
          />
          <Button type="submit">
            <SearchIcon aria-hidden="true" className="mr-2 size-4" />
            Search
          </Button>
        </form>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">People</Badge>
          <Badge variant="outline">Companies</Badge>
          <Badge variant="outline">Meetings</Badge>
          <Badge variant="outline">Notes</Badge>
          <Badge variant="outline">Tasks</Badge>
          <Badge variant="outline">Commitments</Badge>
          <Badge variant="outline">Needs</Badge>
          <Badge variant="outline">Capabilities</Badge>
          <Badge variant="outline">Introductions</Badge>
          <Badge variant="outline">Proposals</Badge>
          <Badge variant="outline">Voice notes</Badge>
        </div>
      </section>

      <section
        aria-label="Search readiness"
        className="grid gap-3 lg:grid-cols-3"
      >
        <CockpitCard title="Structured records" value={indexedRecords}>
          <div className="flex gap-3">
            <Database aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Existing records remain tenant-scoped inside the active
              workspace.
            </p>
          </div>
        </CockpitCard>
        <CockpitCard title="Source visibility">
          <div className="flex gap-3">
            <FileSearch aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Result cards link back to source records instead of flattening
              context.
            </p>
          </div>
        </CockpitCard>
        <CockpitCard title="Structured keyword">
          <div className="flex gap-3">
            <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              This search uses no AI, embeddings, pgvector, semantic ranking,
              external lookup, or background index.
            </p>
          </div>
        </CockpitCard>
      </section>

      {search.query ? (
        <section className="space-y-4" aria-label="Search results">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Results for {search.query}
              </h2>
              <p className="text-sm text-muted-foreground">
                {search.resultCount} tenant-scoped result
                {search.resultCount === 1 ? "" : "s"} shown.
              </p>
            </div>
            <Badge variant="secondary">Structured only</Badge>
          </div>

          {search.groups.length > 0 ? (
            <div className="grid gap-4">
              {search.groups.map((group) => (
                <section className="space-y-3" key={group.kind}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {group.label}
                    </h3>
                    <Badge variant="outline">{group.results.length}</Badge>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {group.results.map((result) => (
                      <Link
                        className="rounded-md border border-border bg-card p-4 shadow-sm transition hover:border-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        href={result.href}
                        key={`${result.kind}-${result.id}`}
                      >
                        <article className="grid gap-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h4 className="text-base font-semibold text-foreground">
                              {result.title}
                            </h4>
                            <time
                              className="text-xs text-muted-foreground"
                              dateTime={result.updatedAt.toISOString()}
                            >
                              {formatSearchDate(result.updatedAt)}
                            </time>
                          </div>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {result.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {result.badges.map((badge) => (
                              <Badge key={badge} variant="outline">
                                {badge}
                              </Badge>
                            ))}
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Try a different person, company, topic, task, commitment, opportunity, proposal, or voice note keyword."
              icon={FileSearch}
              title="No matching records"
            />
          )}
        </section>
      ) : (
        <EmptyState
          description="Enter a keyword to search active records in this workspace. This is structured keyword search, not semantic search."
          icon={FileSearch}
          title="Search your workspace"
        />
      )}
    </div>
  );
}
