# Testing

The scaffold uses:

- Vitest for unit and integration tests.
- Testing Library setup for future React component tests.
- Playwright configuration for mobile e2e smoke tests.

Core commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm audit:prod
```

Integration tests that touch tenancy use PostgreSQL through `DATABASE_URL`.
Locally, start PostgreSQL and apply migrations first:

```bash
docker compose up -d postgres
pnpm prisma:deploy
pnpm prisma:seed
pnpm test:integration
```

The Step 4A integration tests cover tenant-scoped person/company creation,
tenant-scoped reads and lists, cross-tenant relationship rejection, database
foreign-key enforcement for tenant-aware relations, source-reference validation,
and idempotent demo seed data.

The Step 4B-1 integration tests cover tenant isolation for tasks, commitments,
needs, capabilities, and introduction suggestions; cross-tenant direct relation
rejection; source-reference validation for 4B-1 records; and idempotent demo
seed data.

The Step 4B-2 integration tests cover tenant isolation for AI proposals,
AI proposal items, voice notes, and voice mentions; polymorphic target pair
validation; cross-tenant direct relation rejection; source-reference validation
for 4B-2 records; proof that proposal item creation does not mutate target
records; and idempotent demo seed data.

The Step 5 unit tests cover the primary app navigation contract, protected app
route smoke rendering for `/today`, `/capture`, `/people`, `/opportunities`,
and `/search`, plus the protected shell redirect when no session context is
available. These tests mock the session and read-only app summary service so
they do not require a database.

The Step 6A tests cover people/company validation, route smoke rendering for
list/create/detail/edit screens, people and company create/edit/archive service
flows, cross-tenant access denial, and audit log creation without storing full
contact details or descriptions in audit metadata.

The Step 6B tests cover affiliation validation, route smoke rendering for
affiliation create/edit pages, tenant-aware create/edit/end/archive service
flows, transaction-safe primary affiliation handling, clearing primary state on
end/archive, tenant-safe related meeting/note summaries, cross-tenant
affiliation rejection, and audit log creation with minimal metadata.

The Step 7A tests cover meeting validation, route smoke rendering for
`/meetings`, `/meetings/new`, `/meetings/[meetingId]`,
`/meetings/[meetingId]/edit`, and
`/meetings/[meetingId]/participants/new`, meeting create/update/archive service
flows, participant add/remove, duplicate known-person participant rejection,
cross-tenant meeting and participant failures, source defaults, and audit log
safety without storing meeting summaries or participant contact snapshots.

The Step 7B tests cover note validation, route smoke rendering for
`/notes/new`, `/notes/[noteId]`, `/notes/[noteId]/edit`,
`/meetings/[meetingId]/notes/new`, and `/capture/meeting`, note
create/update/archive service flows, direct note links to meetings, people, and
companies, cross-tenant note read/write/link failures, pasted capture creating
exactly one meeting and one linked note, `TEAMS_COPILOT_PASTE` source metadata,
`NOTE -> MEETING` source references, proof that pasted capture does not create
AI proposals, tasks, commitments, needs, or capabilities, and audit safety
without pasted text or note bodies.

The Step 8A tests cover task validation, route smoke rendering for `/tasks`,
`/tasks/new`, `/tasks/[taskId]`, and `/tasks/[taskId]/edit`, manual task
create/update/complete/reopen/archive service flows, tenant-safe links to
people, companies, meetings, notes, commitments, and introduction suggestions,
cross-tenant read/write/link failures, tenant-scoped Today task board summaries,
and audit safety without full descriptions or why-now rationale text.

The Step 8B tests cover commitment validation, route smoke rendering for
`/commitments`, `/commitments/new`, `/commitments/[commitmentId]`, and
`/commitments/[commitmentId]/edit`, manual commitment
create/update/fulfil/cancel/archive service flows, tenant-safe links to people,
companies, meetings, and notes, linked task display through the existing
`Task.commitmentId` relation, cross-tenant read/write/link failures,
tenant-scoped Today commitment board summaries, and audit safety without full
descriptions or sensitive payloads.

The Step 9 tests cover proposal review validation, safe proposed patch preview
masking/truncation, route smoke rendering for `/proposals` and
`/proposals/[proposalId]`, proposal list/detail tenant isolation, approve,
reject, needs-clarification, approve-all, reject-all, dismiss actions,
deterministic proposal status rollup, proof that approval does not mutate
target records, tenant-scoped Today proposal review summaries, and audit safety
without proposed patch JSON or source text.

The Step 10A-1 tests cover need/capability validation, route smoke rendering
for `/opportunities`, `/opportunities/needs`, `/opportunities/needs/new`,
`/opportunities/needs/[needId]`, `/opportunities/needs/[needId]/edit`,
`/opportunities/capabilities`, `/opportunities/capabilities/new`,
`/opportunities/capabilities/[capabilityId]`, and
`/opportunities/capabilities/[capabilityId]/edit`, manual
create/update/archive service flows, tenant-safe links to people, companies,
meetings, and notes, cross-tenant read/write/link failures, tenant-scoped
Opportunities hub summaries, and audit safety without full descriptions or
sensitive payloads.

The Step 10A-2 tests cover introduction suggestion validation, route smoke
rendering for `/opportunities/introductions`,
`/opportunities/introductions/new`,
`/opportunities/introductions/[introductionSuggestionId]`, and
`/opportunities/introductions/[introductionSuggestionId]/edit`, manual
create/update/archive/dismiss service flows, links to needs, capabilities,
people, and companies, tenant-validated meeting/note provenance through
`SourceReference`, cross-tenant read/write/link/provenance failures,
tenant-scoped Opportunities hub introduction summaries, self-introduction
validation, and audit safety without rationale text or source content.

The Step 10B-1 tests cover deterministic relationship health computation,
threshold boundaries for active/stale/dormant signals, needs-attention
precedence, why-now reasons for tasks, commitments, needs, capabilities,
introductions, proposals, meetings, and notes, tenant-scoped Today relationship
attention summaries, cross-tenant person/company signal denial, proof that
signal computation does not mutate records or write audit logs, and route smoke
coverage for Today plus person/company detail pages through the app-shell
tests.

The Step 10C tests cover route smoke rendering for
`/meetings/[meetingId]/prep`, the meeting-detail prep link, tenant-owned prep
brief generation, cross-tenant meeting denial, known participant context,
snapshot-only participant safety, company context limited to meeting-linked
companies, related notes/tasks/commitments/needs/capabilities/introductions and
review-only proposals, source-reference provenance, cross-tenant exclusion, and
proof that prep generation does not mutate records or write audit logs.

The Step 11A-1 tests cover speech-to-text provider factory selection, mock
provider output, OpenAI adapter missing-key failure, build/runtime environment
shape without `OPENAI_API_KEY`, audio MIME/size/duration validation, mocked
VoiceNote transcript persistence with `audioRetentionStatus=NOT_STORED`,
tenant-safe source-context validation, safe audit metadata without transcript
text or provider payloads, API route error handling, and proof that
transcription does not create `VoiceMention`, `AIProposal`, or
`AIProposalItem` records.

The Step 11A-2 tests cover the Capture voice link, voice capture/detail/edit
route rendering, deterministic MediaRecorder component states, upload success
and safe failure handling with a mocked API, transcript review/update,
archiving, cross-tenant VoiceNote/source-context denial, safe audit metadata,
and proof that review actions do not create `VoiceMention`, `AIProposal`, or
`AIProposalItem` records.

The Step 11B tests cover transcript-structuring provider factory selection,
mock provider output, OpenAI adapter missing-key failure, strict structured
output validation, VoiceNote-to-proposal creation with mock output, preference
for edited transcript text, duplicate active proposal prevention, ambiguous
entity resolution into `NEEDS_CLARIFICATION`, cross-tenant VoiceNote and target
resolution safety, safe audit metadata without transcript/raw AI/proposedPatch,
and proof that structuring does not mutate people, companies, tasks,
commitments, needs, capabilities, introduction suggestions, or voice mentions.

The Step 12A tests cover the Microsoft Graph readiness settings route, the
settings link to `/settings/integrations`, provider factory selection, disabled
provider behaviour, mock-provider local/test behaviour, production rejection of
the mock provider, normalized DTO shape without raw Graph response fields,
environment validation without Microsoft Graph secrets, and proof by provider
boundary that no live Graph calls, sync jobs, or calendar/email/contact
ingestion paths are implemented.

The Step 12B tests cover LinkedIn/Sales Navigator URL validation, rejection of
non-LinkedIn and non-HTTPS URLs, proof that URL validation performs no network
call, person create/edit persistence for manual URL fields, LinkedIn
user-provided note creation, note source validation and badge labels,
meeting-form rejection of the LinkedIn source, cross-tenant LinkedIn note link
failures, settings-card rendering, safe audit metadata without full URLs or
pasted content, and proof that no LinkedIn provider/API/scraper/job surface is
added.

The Step 13A tests cover route smoke rendering for `/settings/workspace`,
`/settings/members`, and `/settings/features`, settings hub links, workspace
name update authorization, tenant-scoped member lists, owner-only role/status
mutations, cross-tenant membership mutation rejection, last-active-owner
demotion/deactivation protection, membership deactivation without hard delete,
reactivation, read-only feature registry states, and safe audit metadata.

The Step 13B tests cover `/settings/billing` rendering, settings hub billing
links, non-admin billing access failure, disabled/mock billing provider factory
behaviour, production rejection of the mock provider, unsupported-provider
failure, optional billing/Stripe environment parsing, normalized DTOs, and
guards proving no checkout, portal, webhook, pricing routes, billing schema, or
payment-data fields are added.

The Step 14A tests cover `/settings/governance` rendering, settings hub
governance links, non-admin governance access failure, tenant-scoped audit log
reads, cross-tenant and tenant-null log exclusion, action/entity/actor/date
filters, cursor/limit pagination, metadata display sanitization, long-value
truncation, nested/array summaries, and proof that audit viewing does not mutate
or create audit rows.

The Step 14B tests cover `/settings/privacy` rendering, settings hub privacy
links, personal export for the authenticated user's active-workspace
contribution, workspace export for owner/admin users, non-admin workspace export
denial, tenant-scoped export queries, cross-tenant exclusion, stable versioned
JSON metadata/counts, business content inclusion only when in scope, raw audio
and audio storage-key exclusion, sanitized audit-log metadata inside exports,
safe export-request audit logs without exported content, and guardrails proving
no deletion workflow, CSV/ZIP export, background job, or external storage route
is added.

The Step 14C tests cover `/settings/archive` rendering, settings hub and privacy
links to archive controls, owner/admin archive access, non-admin denial,
tenant-scoped archive lists, cross-tenant exclusion, record-type filtering,
restore clearing `archivedAt`, person restore mapping `ARCHIVED` relationship
status to `UNKNOWN`, safe restore audit metadata without bodies/transcripts, and
guardrails proving no permanent deletion routes, retention jobs, purge jobs, or
audit-log deletion/editing are added.

The Playwright smoke tests currently verify unauthenticated redirect behaviour
and the health endpoint. Signed-in mobile shell e2e coverage is deferred until a
stable test-auth setup is introduced for browser tests.

Vitest runs test files serially because the integration suite uses a shared
test database and resets tables between cases.

CI runs Prisma generation, validation, migrations, seed, lint, typecheck,
Vitest, production build, Docker build, Docker Compose config, and Docker
Compose PostgreSQL health verification. Playwright is configured but not run in
CI until browser installation and app startup requirements are expanded
deliberately.
