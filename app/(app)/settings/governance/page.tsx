import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  FileClock,
  Filter,
  LockKeyhole,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isWorkspaceAdminRole } from "@/server/services/admin-authorization";
import {
  getTenantAuditLogViewer,
  type AuditLogViewerFilters,
  type AuditLogViewerRawFilters,
} from "@/server/services/audit-log-viewer";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type GovernanceSettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDateInput(value: Date | undefined) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function actionVariant(action: string) {
  if (/(failed|rejected|cancelled|archived|deactivated)/i.test(action)) {
    return "warning" as const;
  }

  if (/(created|approved|completed|fulfilled|reactivated)/i.test(action)) {
    return "success" as const;
  }

  return "secondary" as const;
}

function buildGovernanceQuery(
  filters: AuditLogViewerFilters,
  cursor?: string | null,
) {
  const params = new URLSearchParams();

  if (filters.action) {
    params.set("action", filters.action);
  }

  if (filters.actorUserId) {
    params.set("actorUserId", filters.actorUserId);
  }

  if (filters.entityType) {
    params.set("entityType", filters.entityType);
  }

  if (filters.from) {
    params.set("from", formatDateInput(filters.from));
  }

  if (filters.to) {
    params.set("to", formatDateInput(filters.to));
  }

  if (filters.limit !== 25) {
    params.set("limit", String(filters.limit));
  }

  if (cursor) {
    params.set("cursor", cursor);
  }

  const query = params.toString();

  return query ? `/settings/governance?${query}` : "/settings/governance";
}

export default async function GovernanceSettingsPage({
  searchParams,
}: GovernanceSettingsPageProps) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/settings/governance");
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
          description="Governance and audit logs are visible to workspace owners and admins."
          eyebrow="Settings"
          title="Governance"
        />

        <CockpitCard title="Admin access required">
          <p className="text-sm leading-6 text-muted-foreground">
            Owner or admin access is required to review audit events. Audit log
            reads are enforced by tenant-aware services and are not exposed to
            standard members or viewers.
          </p>
        </CockpitCard>
      </div>
    );
  }

  const rawFilters = (await searchParams) ?? {};
  const viewer = await getTenantAuditLogViewer(
    context,
    rawFilters as AuditLogViewerRawFilters,
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
        description="Read-only governance overview and tenant-scoped audit events."
        eyebrow="Settings"
        title="Governance"
      />

      <CockpitCard
        eyebrow={viewer.tenant.name}
        title="Governance overview"
        value="Read-only"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {viewer.governanceCards.map((card) => (
            <article
              className="rounded-md border border-border bg-background p-3"
              key={card.key}
            >
              <div className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                </span>
                <div className="grid gap-1">
                  <h2 className="text-sm font-semibold text-foreground">
                    {card.title}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </CockpitCard>

      <CockpitCard title="Audit log filters" value={`${viewer.filters.limit} max`}>
        <form action="/settings/governance" className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Action
              <Input
                defaultValue={viewer.filters.action ?? ""}
                name="action"
                placeholder="task.created"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Actor user ID
              <Input
                defaultValue={viewer.filters.actorUserId ?? ""}
                name="actorUserId"
                placeholder="user_..."
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Target type
              <Input
                defaultValue={viewer.filters.entityType ?? ""}
                name="entityType"
                placeholder="Task"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Limit
              <Input
                defaultValue={String(viewer.filters.limit)}
                max={50}
                min={1}
                name="limit"
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              From
              <Input
                defaultValue={formatDateInput(viewer.filters.from)}
                name="from"
                type="date"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              To
              <Input
                defaultValue={formatDateInput(viewer.filters.to)}
                name="to"
                type="date"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit">
              <Filter aria-hidden="true" className="mr-2 size-4" />
              Apply filters
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/settings/governance">Clear filters</Link>
            </Button>
          </div>
        </form>
      </CockpitCard>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Audit events
            </h2>
            <p className="text-sm text-muted-foreground">
              Metadata is defensively sanitized before display.
            </p>
          </div>
          <Badge variant="outline">{viewer.events.length} shown</Badge>
        </div>

        {viewer.events.length > 0 ? (
          <div className="grid gap-3">
            {viewer.events.map((event) => (
              <article
                className="rounded-md border border-border bg-card p-4 shadow-sm"
                key={event.id}
              >
                <div className="grid gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                        <FileClock aria-hidden="true" className="size-5" />
                      </span>
                      <div className="grid gap-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={actionVariant(event.action)}>
                            {event.action}
                          </Badge>
                          <Badge variant="outline">{event.entityType}</Badge>
                        </div>
                        <div className="grid gap-1 text-sm text-muted-foreground">
                          <p>
                            Actor:{" "}
                            <span className="font-medium text-foreground">
                              {event.actor.displayName}
                            </span>
                          </p>
                          <p>
                            Target: {event.entityType}
                            {event.entityId ? ` / ${event.entityId}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                    <time
                      className="text-sm text-muted-foreground"
                      dateTime={event.createdAt.toISOString()}
                    >
                      {formatTimestamp(event.createdAt)}
                    </time>
                  </div>

                  <div className="rounded-md bg-muted p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <LockKeyhole aria-hidden="true" className="size-4" />
                      Sanitized metadata
                    </div>
                    {event.metadataPreview.length > 0 ? (
                      <dl className="grid gap-2">
                        {event.metadataPreview.map((entry) => (
                          <div
                            className="grid gap-1 rounded-md border border-border bg-background p-2 text-sm"
                            key={entry.key}
                          >
                            <dt className="font-medium text-foreground">
                              {entry.key}
                            </dt>
                            <dd className="break-words text-muted-foreground">
                              {entry.value}
                              {entry.redacted ? " (redacted)" : ""}
                              {entry.truncated ? " (truncated)" : ""}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No displayable metadata.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
            No audit events match these filters.
          </div>
        )}

        {viewer.nextCursor ? (
          <div>
            <Button asChild variant="outline">
              <Link href={buildGovernanceQuery(viewer.filters, viewer.nextCursor)}>
                Load older events
              </Link>
            </Button>
          </div>
        ) : null}
      </section>

      <CockpitCard title="Read-only boundary" value="No audit writes">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <ScrollText aria-hidden="true" className="size-5" />
          </span>
          <p className="text-sm leading-6 text-muted-foreground">
            Viewing this page never mutates audit rows and does not write page
            view audit events. Data export is planned for Step 14B; deletion and
            retention controls are planned for Step 14C.
          </p>
        </div>
      </CockpitCard>
    </div>
  );
}
