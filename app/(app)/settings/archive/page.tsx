import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArchiveRestore,
  ArrowLeft,
  Archive,
  BadgeCheck,
  Clock3,
  FileWarning,
  Filter,
  Mic,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { restoreArchivedRecordAction } from "@/modules/settings/archive-actions";
import { RestoreRecordButton } from "@/modules/settings/components/restore-record-button";
import { isWorkspaceAdminRole } from "@/server/services/admin-authorization";
import {
  ARCHIVE_BROWSER_DEFAULT_LIMIT,
  type ArchiveBrowserFilters,
  type ArchiveBrowserRawFilters,
  getTenantArchiveBrowser,
} from "@/server/services/archive-management";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type ArchiveSettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatTimestamp(value: Date | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatBadge(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function badgeVariant(value: string | null) {
  if (!value) {
    return "outline" as const;
  }

  if (/(sensitive|confidential|high|overdue|archived|dismissed|rejected)/i.test(value)) {
    return "warning" as const;
  }

  if (/(active|open|transcribed|approved|reviewed|normal|not_stored)/i.test(value)) {
    return "success" as const;
  }

  return "secondary" as const;
}

function archiveQuery(
  filters: ArchiveBrowserFilters,
  recordType: string,
) {
  const params = new URLSearchParams();

  if (recordType !== "all") {
    params.set("recordType", recordType);
  }

  if (filters.limit !== ARCHIVE_BROWSER_DEFAULT_LIMIT) {
    params.set("limit", String(filters.limit));
  }

  const query = params.toString();

  return query ? `/settings/archive?${query}` : "/settings/archive";
}

export default async function ArchiveSettingsPage({
  searchParams,
}: ArchiveSettingsPageProps) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/settings/archive");
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
          description="Archive and retention controls are visible to workspace owners and admins."
          eyebrow="Settings"
          title="Archive & retention"
        />

        <CockpitCard title="Admin access required">
          <p className="text-sm leading-6 text-muted-foreground">
            Owner or admin access is required to browse and restore archived
            workspace records. Archive reads and restores are enforced by
            tenant-aware services.
          </p>
        </CockpitCard>
      </div>
    );
  }

  const rawFilters = (await searchParams) ?? {};
  const browser = await getTenantArchiveBrowser(
    context,
    rawFilters as ArchiveBrowserRawFilters,
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
        description="Review archived workspace records, restore supported records, and inspect voice retention state."
        eyebrow="Settings"
        title="Archive & retention"
      />

      <CockpitCard
        eyebrow={browser.tenant.name}
        title="Archive overview"
        value="Reversible"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-md border border-border bg-background p-3">
            <div className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <Archive aria-hidden="true" className="size-4" />
              </span>
              <div className="grid gap-1">
                <h2 className="text-sm font-semibold text-foreground">
                  Archive is not deletion
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Archived records are hidden from active workflows but remain
                  tenant data and can still be exported when in scope.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-md border border-border bg-background p-3">
            <div className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <ShieldCheck aria-hidden="true" className="size-4" />
              </span>
              <div className="grid gap-1">
                <h2 className="text-sm font-semibold text-foreground">
                  No permanent deletion
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  V1 archive controls do not implement tenant deletion, account
                  deletion, purge jobs, audit deletion, or irreversible
                  business-record deletion.
                </p>
              </div>
            </div>
          </article>
        </div>
      </CockpitCard>

      <CockpitCard title="Voice retention" value="Read-only">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <Mic aria-hidden="true" className="size-5" />
          </span>
          <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
            <p>
              Raw audio is not retained by default. Archived VoiceNotes show
              audio retention status, raw-audio deletion timestamp, retention
              expiry, and whether transcript text still exists.
            </p>
            <p>
              V1 archive controls do not clear transcripts, delete raw audio,
              create raw-audio deletion jobs, or permanently delete VoiceNotes.
            </p>
          </div>
        </div>
      </CockpitCard>

      <CockpitCard title="Record type filter" value={`${browser.records.length} shown`}>
        <div className="flex flex-wrap gap-2">
          {browser.options.map((option) => {
            const active = browser.filters.recordType === option.value;

            return (
              <Button
                asChild
                key={option.value}
                size="sm"
                variant={active ? "default" : "outline"}
              >
                <Link href={archiveQuery(browser.filters, option.value)}>
                  {option.label}
                </Link>
              </Button>
            );
          })}
        </div>
        {browser.truncated ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Results are bounded to {browser.filters.limit} records. Use a record
            type filter to narrow the archive view.
          </p>
        ) : null}
      </CockpitCard>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Archived records
            </h2>
            <p className="text-sm text-muted-foreground">
              Newest archived records first. Restore actions write safe audit
              logs.
            </p>
          </div>
          <Badge variant="outline">
            <Filter aria-hidden="true" className="mr-2 size-3" />
            {browser.filters.recordType === "all"
              ? "All types"
              : browser.options.find(
                  (option) => option.value === browser.filters.recordType,
                )?.label}
          </Badge>
        </div>

        {browser.records.length === 0 ? (
          <CockpitCard title="No archived records">
            <p className="text-sm leading-6 text-muted-foreground">
              There are no archived records for this filter in the active
              workspace.
            </p>
          </CockpitCard>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {browser.records.map((record) => (
              <article
                className="rounded-md border border-border bg-card p-4"
                key={`${record.recordType}:${record.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {browser.options.find(
                          (option) => option.value === record.recordType,
                        )?.label ?? record.recordType}
                      </Badge>
                      {record.status ? (
                        <Badge variant={badgeVariant(record.status)}>
                          {formatBadge(record.status)}
                        </Badge>
                      ) : null}
                      {record.sensitivity ? (
                        <Badge variant={badgeVariant(record.sensitivity)}>
                          {formatBadge(record.sensitivity)}
                        </Badge>
                      ) : null}
                    </div>
                    <h3 className="text-base font-semibold leading-6 text-foreground">
                      {record.title}
                    </h3>
                    {record.description ? (
                      <p className="text-sm leading-6 text-muted-foreground">
                        {record.description}
                      </p>
                    ) : null}
                  </div>
                  <RestoreRecordButton
                    action={restoreArchivedRecordAction.bind(
                      null,
                      record.recordType,
                      record.id,
                    )}
                    recordTitle={record.title}
                  />
                </div>

                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <Clock3 aria-hidden="true" className="size-4" />
                      Archived on
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {formatTimestamp(record.archivedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Archived by</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {record.archivedBy?.displayName ?? "Unknown actor"}
                    </dd>
                  </div>
                </dl>

                {record.badges.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {record.badges.map((badge) => (
                      <Badge key={badge} variant="secondary">
                        {formatBadge(badge)}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {record.voiceRetention ? (
                  <div className="mt-4 rounded-md border border-border bg-muted p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <FileWarning aria-hidden="true" className="size-4" />
                      Voice retention
                    </div>
                    <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">
                          Audio retention
                        </dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {formatBadge(record.voiceRetention.audioRetentionStatus)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          Raw audio deleted
                        </dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {formatTimestamp(record.voiceRetention.rawAudioDeletedAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          Retention expires
                        </dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {formatTimestamp(record.voiceRetention.retentionExpiresAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Transcript</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {record.voiceRetention.editedTranscriptPresent
                            ? "Reviewed transcript stored"
                            : record.voiceRetention.transcriptPresent
                              ? "Transcript stored"
                              : "No transcript stored"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <CockpitCard title="Restore boundary" value="Audited">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <ArchiveRestore aria-hidden="true" className="size-5" />
          </span>
          <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
            <p>
              Restore clears `archivedAt` for supported records and returns them
              to active views. Person records restored from
              `relationshipStatus = ARCHIVED` are set to `UNKNOWN` because the
              previous relationship status is not stored.
            </p>
            <p>
              Restore does not delete audit logs, clear transcripts, purge
              business records, or run retention automation. This is operational
              product guidance, not legal advice.
            </p>
          </div>
        </div>
      </CockpitCard>
    </div>
  );
}
