# Architecture

Pobal uses a modular monolith built on Next.js App Router, TypeScript, Prisma,
and PostgreSQL.

## Foundation layout

- `app`: routes, layouts, and route handlers.
- `components`: shared UI, mobile, desktop, form, card, and state components.
- `modules`: future domain modules. This maps to the domain-module concept in
  the build brief.
- `server/services`: application service orchestration, including auth context,
  tenant access checks, role seeding, audit logging, and Step 4A relationship
  backbone validation.
- `server/repositories`: database access boundaries. Tenant-scoped reads require
  explicit `tenantId` and `userId` inputs.
- `server/providers`: external provider adapters.
- `server/config`: runtime configuration and environment validation.
- `prisma`: schema, migrations, and seed entrypoint.
- `tests`: unit, integration, and e2e tests.

## Auth and tenancy boundary

Auth.js is configured with a root `auth.ts` and App Router route handler under
`app/api/auth/[...nextauth]`. The current session strategy is JWT so the
development-only credentials provider can authenticate local users without
database session duplication. Standard Auth.js Prisma models are still present
for user/account persistence and future OAuth compatibility.

Next.js middleware performs only coarse authentication checks for protected
route groups such as `/today`, `/capture`, `/commitments`, `/meetings`,
`/notes`, `/tasks`, `/people`, `/proposals`, `/opportunities`,
`/voice-notes`, `/search`, `/account`, and `/settings`. Tenant membership and
role checks are enforced in server-side services and repositories, not
middleware.

## Mobile app shell

The protected `(app)` route group is the authenticated product shell.
Signed-in users are sent from `/` to `/today`; unauthenticated users are sent to
`/sign-in`. The shell uses a mobile bottom navigation as the primary UX and a
desktop sidebar fallback on larger screens.

Primary navigation:

- Today
- Capture
- People
- Opportunities
- Search

These routes are now backed by tenant-scoped product workflows. Search is a
basic structured keyword lookup across active tenant records; it does not use
semantic ranking, pgvector, embeddings, AI, external search, or background
indexing. Matching, notifications, and external sync remain out of scope.

Step 6A turns `/people` into the first real product workflow. People and company
screens live under the existing protected app shell:

- `/people`
- `/people/new`
- `/people/[personId]`
- `/people/[personId]/edit`
- `/people/companies`
- `/people/companies/new`
- `/people/companies/[companyId]`
- `/people/companies/[companyId]/edit`

Server actions validate form input with Zod, call `getCurrentUserContext()`,
and delegate mutations to tenant-aware services. The client never supplies a
trusted tenant id.

Step 6B adds affiliation management inside the same People area:

- `/people/[personId]/affiliations/new`
- `/people/[personId]/affiliations/[affiliationId]/edit`
- `/people/companies/[companyId]/affiliations/new`

Affiliation server actions call tenant-aware services, never trust client
tenant ids, and use a transaction when setting a primary affiliation. That
transaction verifies the person/company/affiliation tenant, unsets other active
primary affiliations for the same person, writes the selected affiliation, and
adds audit logs. Ending or archiving an affiliation clears its primary flag and
does not choose a replacement automatically.

Person and company detail pages also show read-only related meeting and note
summaries. These summaries use tenant-scoped repository methods and do not
create meetings, create notes, run AI summarisation, search semantically, or
match relationships.

Step 7A adds the manual meetings foundation under the protected app shell:

- `/meetings`
- `/meetings/new`
- `/meetings/[meetingId]`
- `/meetings/[meetingId]/edit`
- `/meetings/[meetingId]/participants/new`

Meeting server actions validate form input with Zod, call
`getCurrentUserContext()`, and delegate to tenant-aware meeting services.
Participant creation validates the meeting, person, and company against the
active tenant. Participant removal hard-deletes only the
`MeetingParticipant` association after writing an audit log.

Step 7B adds manual note workflows and pasted meeting-note capture:

- `/notes`
- `/notes/new`
- `/notes/[noteId]`
- `/notes/[noteId]/edit`
- `/meetings/[meetingId]/notes/new`
- `/capture/meeting`

Note and capture server actions validate input with Zod, call
`getCurrentUserContext()`, and delegate to tenant-aware services. Pasted capture
creates one meeting, one linked note, optional manually selected known-person
participants, and a `NOTE -> MEETING` source reference in a transaction.

This step stores user-provided pasted Teams/Copilot text only. It does not add
Teams import, Microsoft Graph, AI extraction, summarisation, task extraction,
commitment extraction, proposal generation, voice capture, transcription,
semantic search, or matching.

Step 8A adds the manual follow-up task workflow:

- `/tasks`
- `/tasks/new`
- `/tasks/[taskId]`
- `/tasks/[taskId]/edit`

Task server actions validate input with Zod, call `getCurrentUserContext()`,
and delegate to tenant-aware task services. Tasks can link to existing people,
companies, meetings, notes, commitments, and legacy internal introduction
suggestion records, but every link is validated server-side inside the active
tenant. Query parameters from person, company, meeting, and note detail pages
are convenience hints only.

The Today screen now includes manual task sections for overdue, due-today,
upcoming, and recently completed tasks. Overdue and due-today states are
derived at read time from `dueAt`; Step 8A does not add reminder delivery,
notifications, background jobs, automatic extraction, AI recommendations, or
commitment-ledger screens.

Step 8B adds the manual commitment-ledger workflow:

- `/commitments`
- `/commitments/new`
- `/commitments/[commitmentId]`
- `/commitments/[commitmentId]/edit`

Commitment server actions validate input with Zod, call
`getCurrentUserContext()`, and delegate to tenant-aware services. Commitments
can link to existing people, companies, meetings, and notes, and linked tasks
are displayed read-only through the existing `Task.commitmentId` relation.
Lifecycle actions fulfil, cancel, and archive commitments with safe audit logs.

The `/tasks` screen is now the unified action area for tasks and active
commitments, while `/commitments` remains the commitment-specific ledger.
Overdue commitment state is derived at read time from `dueAt` or the due-window
boundary. This does not add reminder delivery, notifications, background jobs,
automatic task creation, commitment extraction, AI recommendations, or parsing
of notes/meeting notes.

Step 9 adds status-only Suggested update review on internal AI proposal
records:

- `/proposals`
- `/proposals/[proposalId]`

Proposal server actions validate ids with Zod, call `getCurrentUserContext()`,
and delegate to tenant-aware AI proposal services. Users see these records as
Suggested updates and can approve, reject, or mark items as needing
clarification, approve/reject all pending items, and dismiss a suggested
update. Review status rolls up deterministically from item statuses.

Approval is status-only in this step. The proposal framework does not apply
patches, create records, mutate targets, call AI providers, generate proposals,
send messages, or run background jobs.

Step 10A promotes the manual need and capability workflows under the
Opportunities area:

- `/opportunities`
- `/opportunities/needs`
- `/opportunities/needs/new`
- `/opportunities/needs/[needId]`
- `/opportunities/needs/[needId]/edit`
- `/opportunities/capabilities`
- `/opportunities/capabilities/new`
- `/opportunities/capabilities/[capabilityId]`
- `/opportunities/capabilities/[capabilityId]/edit`

Need and capability server actions validate input with Zod, call
`getCurrentUserContext()`, and delegate to tenant-aware services. Query
parameters from people, company, meeting, and note pages are treated as
convenience hints only. Services validate linked records inside the active
tenant before writing and use safe audit metadata.

Needs include an optional nullable `reviewAfter` date for lightweight human
review. It is stored as `Need.reviewAfter`/`review_after`, can be cleared on
edit, and is not a task, reminder, notification, commitment, or background job.

The existing `IntroductionSuggestion` schema, repositories, services, source
references, archive handling, and export handling remain for legacy/internal
data. The user-facing introduction routes are retired and should fail safely
with not-found rather than rendering active pages.

The Opportunities hub shows manual counts and latest need and capability
records. It does not run matching, scoring, AI generation, message drafting,
outreach sending, semantic search, embeddings, notifications, or background
jobs.

Step 10B-1 adds deterministic relationship health and why-now reasoning to
Today plus person/company detail pages. The relationship-health service is
read-only: it requires `TenantContext`, calls `requireTenantAccess`, queries
only tenant-scoped records, and returns computed signals such as active, warm,
stale, dormant, or needs attention. It does not write scores, mutate existing
`relationshipStatus` or `relationshipTemperature` fields, create
recommendations, call AI providers, send notifications, or run background jobs.
Due or past Need `reviewAfter` dates are treated as bounded deterministic
relationship attention reasons; future review dates are not urgent.

The thresholds are internal V1 constants:

- active interaction: 14 days;
- warm interaction: 45 days;
- stale after: 60 days;
- dormant after: 120 days;
- upcoming due window: 7 days;
- Today attention display: 8 records;
- detail-page reason display: 5 reasons.

Step 10C adds deterministic meeting prep briefs at
`/meetings/[meetingId]/prep`. The prep service requires `TenantContext`, calls
`requireTenantAccess`, verifies the meeting belongs to the tenant, and returns
a structured read-only DTO assembled from explicit meeting, participant,
company, note, task, commitment, need, capability, proposal, source-reference,
and relationship-health records. Legacy introduction suggestion source
references are filtered from the user-facing prep output. It does not write
audit logs, create source references, save generated briefs, mutate statuses,
call AI providers, sync Outlook/Teams, or run background jobs.

Step 11A-1 adds the backend speech-to-text foundation. The
`POST /api/voice-notes/transcribe` route handler authenticates the user, accepts
multipart audio, validates MIME type, size, optional duration, and optional
source context ids, then delegates to a tenant-aware voice transcription
service. That service calls only the speech-to-text provider interface, creates
a `VoiceNote` with transcript and audio metadata, marks raw audio as
`NOT_STORED`, sets `rawAudioDeletedAt`, and writes safe audit metadata. It does
not store raw audio, persist raw provider responses, create `VoiceMention` or
`AIProposal` records, structure transcripts, mutate target records, add browser
recording UI, or call OpenAI outside the transcription adapter.

Step 11A-2 adds the protected mobile voice capture and transcript-review
surface:

- `/capture/voice`
- `/voice-notes`
- `/voice-notes/[voiceNoteId]`
- `/voice-notes/[voiceNoteId]/edit`

The browser recorder uses `navigator.mediaDevices.getUserMedia` and
`MediaRecorder`, keeps recorded audio in browser memory until upload or cancel,
and submits multipart audio to the existing transcription endpoint. Voice-note
detail and edit pages read and update tenant-scoped `VoiceNote` records through
server services. Editing can save a title, reviewed transcript text, and direct
source links; archiving sets `archivedAt`. This step does not store raw audio,
re-transcribe, create `VoiceMention`, `AIProposal`, or `AIProposalItem` records,
structure transcripts, or mutate linked records.

Step 11B adds voice-to-proposal structuring from the VoiceNote detail page.
The UI action calls a server action that validates tenant context, chooses the
reviewed transcript before the original transcript, and delegates to a
server-side transcript-structuring provider adapter. The service validates the
strict normalized provider output, resolves people/companies only through
tenant-local deterministic exact matches, and transactionally creates one
`AIProposal` plus `AIProposalItem` rows linked to the source VoiceNote.

These proposal rows are review-only. Step 11B does not apply patches, mutate
target records, create `VoiceMention` rows, perform external lookup, call
LinkedIn/Microsoft/Teams/Outlook, run embeddings/search, send messages, or
start background jobs.

Step 12A adds Microsoft Graph readiness only. `/settings/integrations` is a
protected settings route that shows a Microsoft integration card in a
disconnected state and links future capabilities to calendar, selected email
context, and contacts. The provider boundary under
`server/providers/microsoft-graph` exposes normalized app-level DTOs and only
ships disabled and mock providers. The default provider is disabled; the mock
provider is for local/test use only and is rejected in production. No Step 12A
code starts OAuth, stores tokens, calls live Microsoft Graph APIs, creates sync
jobs, or ingests calendar, email, or contact data.

Step 12B adds manual LinkedIn enrichment only. Person create/edit forms store
optional LinkedIn profile and Sales Navigator URLs after pure URL parsing, and
note forms can label pasted user-provided context as
`LINKEDIN_USER_PROVIDED`. The `/settings/integrations` page shows a manual
LinkedIn card. No code fetches LinkedIn pages, previews profile content,
scrapes, runs browser automation, monitors accounts, uses cookies/sessions,
calls LinkedIn APIs, syncs Sales Navigator, or creates background jobs.

Step 13A adds workspace admin and SaaS control foundations:

- `/settings/workspace`
- `/settings/members`
- `/settings/features`

Workspace and membership mutations remain in tenant-aware services. Workspace
name updates require owner/admin access, while member role and status changes
are owner-only in this foundation release. Memberships are never hard-deleted;
deactivation sets `Membership.status = INACTIVE`, and service-level
last-owner protection blocks demoting or deactivating the final active owner.

The feature readiness page is read-only and computed from internal/runtime
configuration. It does not add entitlements, quotas, plan enforcement, billing
schema, checkout, Stripe providers, invite flows, email jobs, SCIM, SSO
provisioning, or a complex RBAC matrix.

Step 13B adds billing readiness:

- `/settings/billing` is an owner/admin settings surface.
- `server/providers/billing` defines normalized billing DTOs and disabled/mock
  providers.
- `server/services/billing-readiness.ts` returns tenant-scoped read-only
  readiness from the active tenant context.

The default billing provider is disabled. The mock provider is local/test only
and is rejected in production. No Stripe SDK, live Stripe provider, checkout,
portal, webhook, billing schema, payment data storage, plan enforcement, quota,
or billing lockout is implemented.

Step 14A adds a read-only governance surface:

- `/settings/governance` is an owner/admin settings route.
- `server/repositories/audit-logs.ts` performs tenant-filtered audit log reads.
- `server/services/audit-log-viewer.ts` enforces workspace admin access,
  normalizes filters, applies bounded pagination, and sanitizes metadata for UI
  display.

The viewer excludes tenant-null and cross-tenant logs, never mutates audit rows,
and never writes audit logs for viewing. Export, deletion, retention jobs, SIEM,
analytics, alerts, and raw metadata download remain out of scope.

Step 14B adds data export and privacy visibility:

- `/settings/privacy` is a protected settings route with privacy overview,
  personal export, workspace export, inclusion/exclusion, and future
  deletion/retention cards.
- `POST /api/privacy/exports/personal` returns a synchronous JSON download for
  the current user's contribution inside the active workspace.
- `POST /api/privacy/exports/workspace` returns a synchronous JSON download for
  owner/admin users with tenant-owned workspace records.
- `server/repositories/data-export.ts` performs explicit tenant-scoped export
  queries with per-section limits.
- `server/services/data-export.ts` assembles the stable versioned JSON payload,
  sanitizes exported audit metadata, and writes safe export-request audit logs
  before returning the payload.

Step 14B does not add CSV/ZIP export, background jobs, scheduled exports,
external export storage, deletion workflows, retention automation, or legal
advice generation.

Step 14C adds archive and retention controls:

- `/settings/archive` is an owner/admin settings route for browsing archived
  tenant records and restoring supported records.
- `server/repositories/archive-management.ts` performs explicit per-model
  tenant-scoped archive reads and restore updates for models with `archivedAt`.
- `server/services/archive-management.ts` enforces workspace admin access,
  normalizes record-type filters, and writes safe type-specific restore audit
  logs.
- VoiceNote retention is displayed as read-only metadata; raw audio deletion and
  retention jobs are not implemented.

Step 14C does not add permanent deletion, tenant/account deletion, audit-log
deletion/editing, purge jobs, retention automation, external storage cleanup,
or legal workflow automation.

Step 15B-2 refreshes the local V1 review story without adding product
features. `SEED_DEMO_DATA=true` now runs a top-level deterministic demo seed
that builds on the older Step 4 demo layers and adds synthetic records across
the implemented V1 flows: people, companies, affiliations, meetings,
meeting participants, notes, Teams/Copilot pasted-note source, LinkedIn
user-provided notes, tasks, commitments, needs, capabilities, legacy internal
introduction suggestion rows, review-only AI proposals, voice notes, source
references, archived records, and safe audit events. The seed is idempotent,
tenant-scoped, uses fake local review data only, and never calls providers or
stores raw audio.

## Relationship backbone boundary

Step 4A adds server-side schema and skeletons for people, companies,
affiliations, meetings, notes, and source references. Repositories require
explicit tenant context, and services call `requireTenantAccess` before
tenant-scoped reads or writes. Cross-tenant direct relations use composite
tenant-aware foreign keys where Prisma/PostgreSQL can express them.

Step 4B-1 adds schema and server-side skeletons for tasks, commitments, needs,
capabilities, and legacy internal introduction suggestion records. These
records follow the same tenant-aware repository/service pattern and use
composite relations for direct links to Step 4A records and to each other.

Step 4B-2 adds schema and server-side skeletons for AI proposal readiness and
voice note readiness. Direct source/context links use composite tenant-aware
relations where practical. Polymorphic proposal targets and voice mention
resolutions are validated in services before persistence.

This foundation intentionally contains no proposal application engine, voice
mention extraction, matching algorithm, notifications, background jobs, billing,
Microsoft Graph sync, LinkedIn automation/sync, semantic search, embeddings, or
provider calls outside approved server-side adapters.
