import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BadgeCheck,
  DatabaseZap,
  FileDown,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportConfirmationForm } from "@/modules/settings/components/export-confirmation-form";
import { isWorkspaceAdminRole } from "@/server/services/admin-authorization";
import { DATA_EXPORT_SECTION_LIMIT } from "@/server/services/data-export";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

const personalConfirmation =
  "Generate a JSON export of your contribution inside the active workspace? The file may contain sensitive relationship intelligence from records you created.";
const workspaceConfirmation =
  "Generate a JSON export of this workspace? The file may contain tenant business content, note bodies, transcripts, and AI proposal patches.";

const overviewCards = [
  {
    description:
      "Exports are generated only from the active workspace and never trust a client-provided tenant id.",
    title: "Tenant-scoped exports",
  },
  {
    description:
      "Personal export means your contribution inside this workspace, not a full legal data-subject request workflow.",
    title: "Personal scope is bounded",
  },
  {
    description:
      "Raw audio is not retained by default, so exports include retention metadata rather than audio files.",
    title: "Raw audio not exported",
  },
  {
    description:
      "Archive controls are available for owner/admin users. Permanent deletion and automated retention jobs remain future work.",
    title: "Archive controls available",
  },
];

export default async function PrivacySettingsPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/settings/privacy");
  }

  const canExportWorkspace = isWorkspaceAdminRole(context.roleKey);

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
        description="Tenant-scoped JSON exports and privacy-control visibility."
        eyebrow="Settings"
        title="Privacy & export"
      />

      <CockpitCard
        eyebrow={context.tenantName}
        title="Privacy overview"
        value="Read-only controls"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {overviewCards.map((card) => (
            <article
              className="rounded-md border border-border bg-background p-3"
              key={card.title}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <CockpitCard title="Personal export" value="Your contribution">
          <div className="grid gap-4">
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <FileDown aria-hidden="true" className="size-5" />
              </span>
              <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
                <p>
                  Download records you created in the active workspace, your
                  safe profile fields, current membership/role, user-created
                  voice notes and proposals, source references, and sanitized
                  audit events where you were the actor.
                </p>
                <p>
                  This does not collect data across all workspaces and does not
                  include unrelated tenant records that merely mention you.
                </p>
              </div>
            </div>
            <ExportConfirmationForm
              action="/api/privacy/exports/personal"
              confirmation={personalConfirmation}
              label="Download personal JSON"
            />
          </div>
        </CockpitCard>

        <CockpitCard
          title="Workspace export"
          value={canExportWorkspace ? "Owner/admin" : "Owner/admin only"}
        >
          <div className="grid gap-4">
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <DatabaseZap aria-hidden="true" className="size-5" />
              </span>
              <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
                <p>
                  Owners and admins can download tenant-owned people,
                  companies, meetings, notes, tasks, commitments,
                  opportunities, proposals, voice notes, source references,
                  memberships, roles, and sanitized audit logs.
                </p>
                <p>
                  Workspace export includes tenant business content and may
                  contain sensitive relationship intelligence.
                </p>
              </div>
            </div>
            <ExportConfirmationForm
              action="/api/privacy/exports/workspace"
              confirmation={workspaceConfirmation}
              disabled={!canExportWorkspace}
              label="Download workspace JSON"
            />
            {!canExportWorkspace ? (
              <p className="text-sm text-muted-foreground">
                Workspace export requires owner or admin access.
              </p>
            ) : null}
          </div>
        </CockpitCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CockpitCard title="Included data" value={`Limit ${DATA_EXPORT_SECTION_LIMIT}`}>
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <p>
              Exports are structured JSON with a stable version, generated
              timestamp, tenant metadata, requested-by user, counts, per-section
              records, omissions, and truncation notes.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Note bodies</Badge>
              <Badge variant="outline">Teams/Copilot pasted notes</Badge>
              <Badge variant="outline">LinkedIn user-provided notes</Badge>
              <Badge variant="outline">Voice transcripts</Badge>
              <Badge variant="outline">AI proposal patches</Badge>
            </div>
          </div>
        </CockpitCard>

        <CockpitCard title="Excluded data" value="System secrets">
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <p>
              Exports never include Auth.js session/provider tokens, cookies,
              headers, environment values, raw provider payloads, raw OpenAI
              responses, raw audio files, payment/card data, or raw audit
              metadata.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Audit metadata sanitized</Badge>
              <Badge variant="secondary">No CSV</Badge>
              <Badge variant="secondary">No ZIP</Badge>
              <Badge variant="secondary">No background jobs</Badge>
            </div>
          </div>
        </CockpitCard>
      </div>

      <CockpitCard title="Archive controls" value="Available">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <Archive aria-hidden="true" className="size-5" />
          </span>
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <p>
              Workspace owners and admins can review archived records and
              restore supported records. Archive is reversible where supported
              and is not permanent deletion.
            </p>
            <p>
              Archived records may still appear in workspace exports when they
              are in scope.
            </p>
            <div>
              <Button asChild variant="outline">
                <Link href="/settings/archive">Open archive controls</Link>
              </Button>
            </div>
          </div>
        </div>
      </CockpitCard>

      <CockpitCard title="Later privacy controls" value="Future work">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <LockKeyhole aria-hidden="true" className="size-5" />
          </span>
          <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
            <p>
              Deletion, erasure, retention automation, permanent deletion, and
              full data-subject request workflows are not implemented in this
              step.
            </p>
            <p>
              This is operational product guidance, not legal advice.
            </p>
          </div>
        </div>
      </CockpitCard>

      <div className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
        <BadgeCheck aria-hidden="true" className="size-4" />
        JSON exports are generated synchronously and returned directly to your
        browser with no-store headers.
      </div>
    </div>
  );
}
