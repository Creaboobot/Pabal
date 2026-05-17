# Local Development

Use the pinned toolchain:

- Node.js `22.13.1` from `.node-version` / `.nvmrc`
- pnpm `9.15.4` from `package.json#packageManager`

## Environment

For the Next.js app, copy the example file to `.env.local`:

```bash
cp .env.example .env.local
```

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Do not commit `.env.local` or other real environment files. Prisma commands load
`.env.local` through `prisma.config.ts`; CI still supplies `DATABASE_URL`
directly from the workflow environment.

For local development sign-in:

```bash
pnpm exec auth secret
```

Then set `ENABLE_DEV_AUTH=true` in `.env.local`. This provider is disabled in
production even if the flag is accidentally set.

## Docker PostgreSQL

```bash
docker compose config
docker compose up -d postgres
docker compose ps
docker compose down -v
```

`POSTGRES_PORT` and `APP_PORT` can be overridden in `.env.local` when local ports
are already in use.

Apply the current schema and seed the foundation roles:

```bash
pnpm prisma:deploy
pnpm prisma:seed
```

To also seed the deterministic V1 review workspace, set:

```bash
SEED_DEMO_DATA=true
pnpm prisma:seed
```

PowerShell:

```powershell
$env:SEED_DEMO_DATA = "true"
pnpm prisma:seed
```

Demo seed data creates deterministic local review records only. It includes a
coherent fake workspace with people, companies, affiliations, meetings, pasted
Teams/Copilot notes, manual LinkedIn-context notes, tasks, commitments, needs,
capabilities, legacy internal introduction suggestion rows, review-only AI
proposals, voice notes, source references, archived records, and safe audit
events.

The seed is idempotent and tenant-scoped. It uses synthetic `.example`-style
people and organisations, stores no raw audio, stores no provider responses, and
does not call AI, transcription, Microsoft, LinkedIn, billing, or any external
service.

## Local V1 Review Setup

For a local reviewer path:

```bash
pnpm install
cp .env.example .env.local
docker compose up -d postgres
pnpm prisma:deploy
SEED_DEMO_DATA=true pnpm prisma:seed
pnpm dev
```

PowerShell:

```powershell
pnpm install
Copy-Item .env.example .env.local
docker compose up -d postgres
pnpm prisma:deploy
$env:SEED_DEMO_DATA = "true"
pnpm prisma:seed
pnpm dev
```

Use `ENABLE_DEV_AUTH=true` for local review sign-in. Provider mocks are optional
and explicit: `SPEECH_TO_TEXT_PROVIDER=mock` for local transcription tests,
`TRANSCRIPT_STRUCTURING_PROVIDER=mock` for local transcript-to-proposal tests,
`MICROSOFT_GRAPH_PROVIDER=disabled` for normal readiness-only Microsoft
settings, and `BILLING_PROVIDER=disabled` for billing readiness. `OPENAI_API_KEY`
is needed only for runtime OpenAI transcription or transcript structuring, not
for build, seed, or local review of stored demo data.

Troubleshooting:

- If sign-in shows review guidance instead of a dev sign-in form, confirm
  `ENABLE_DEV_AUTH=true` and `NODE_ENV` is not `production`.
- If Prisma cannot connect, confirm the Docker PostgreSQL container is healthy
  and `DATABASE_URL` matches `.env.local`.
- If provider-backed voice or structuring calls fail locally, switch to the
  explicit mock provider for that runtime path or seed demo data and review the
  stored VoiceNote/AIProposal records instead.
- If a route looks empty, search for `Anna`, `Sofia`, `Harbor`, or `governance`
  in `/search` after seeding the V1 demo workspace.

For a guided reviewer path, use
[`docs/review/v1-review-walkthrough.md`](../review/v1-review-walkthrough.md).

## Local Desktop Launcher

Windows reviewers can use the optional local launcher at
`tools/start-pobal-launcher.cmd`. It loads/selects a GitHub repository, clones
or reuses a matching local clone, fetches GitHub refs, fast-forwards only when
the working tree is clean, starts local PostgreSQL through Docker Compose or
the ignored portable `.tools` runtime, applies migrations, seeds demo data, and
starts the Next.js app on a selected `127.0.0.1` port.

The launcher is a developer/reviewer utility, not a product runtime. Pobal
remains a mobile-web-first hosted SaaS application. See
[`docs/development/local-launcher.md`](local-launcher.md) for usage and safety
notes.

## Playwright E2E Smoke

The signed-in Playwright smoke suite uses the existing development auth provider
and deterministic V1 review demo data. It does not weaken production auth:
`ENABLE_DEV_AUTH=true` is required and the provider is still disabled whenever
`NODE_ENV=production`.

First install the browser binary once:

```bash
corepack pnpm exec playwright install --with-deps chromium
```

Then prepare the local database with migrations and demo data:

```bash
docker compose up -d postgres
corepack pnpm prisma:deploy
SEED_DEMO_DATA=true corepack pnpm prisma:seed
corepack pnpm test:e2e
```

PowerShell:

```powershell
docker compose up -d postgres
corepack pnpm prisma:deploy
$env:SEED_DEMO_DATA = "true"
corepack pnpm prisma:seed
corepack pnpm test:e2e
```

Playwright starts the Next.js dev server on `http://127.0.0.1:3100` with
`ENABLE_DEV_AUTH=true`,
`SPEECH_TO_TEXT_PROVIDER=mock`, `TRANSCRIPT_STRUCTURING_PROVIDER=mock`,
`MICROSOFT_GRAPH_PROVIDER=disabled`, and `BILLING_PROVIDER=disabled`. The suite
signs in as `demo@pobal.local`, verifies the mobile app shell, and loads the V1
review-critical routes plus deterministic seeded deep links. It does not call
real OpenAI, Microsoft Graph, LinkedIn, Stripe, or any external provider. Use
`PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_WEB_SERVER_COMMAND` only when you need to
point the smoke suite at a deliberately chosen local server.

If seeded deep links return 404 locally, the database does not contain the
deterministic V1 review records. Rerun the seed after migrations against a
disposable local database. If an older local database fails the seed on an
existing uniqueness conflict, prefer a fresh local database for review instead
of changing seed logic; CI applies migrations and reseeds before the browser
suite.

## Voice Transcription And Review

Step 11A-1 adds backend transcription. Step 11A-2 adds the browser recording UI
at `/capture/voice`, the `/voice-notes` index, and transcript review pages at
`/voice-notes/[voiceNoteId]` and `/voice-notes/[voiceNoteId]/edit`.

For local/mock testing, set:

```bash
SPEECH_TO_TEXT_PROVIDER=mock
```

For runtime OpenAI transcription, set:

```bash
SPEECH_TO_TEXT_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
```

`OPENAI_API_KEY` is not required for build or readiness checks. Raw audio is
not retained; the stored record is a `VoiceNote` transcript with safe audio
metadata. Transcription does not create mentions, AI proposals, tasks,
commitments, needs, capabilities, or legacy internal introduction suggestion
records.

In supported browsers, `/capture/voice` uses MediaRecorder and submits audio to
`POST /api/voice-notes/transcribe`. The UI keeps audio in memory only, then
redirects to the VoiceNote detail page after transcription. Reviewing a
transcript can save edited transcript text and source links; it does not
structure the transcript or update linked records automatically.

Step 11B adds a `Create suggested update` action on VoiceNote detail.
For local/mock testing, set:

```bash
TRANSCRIPT_STRUCTURING_PROVIDER=mock
```

For runtime OpenAI structuring, set:

```bash
TRANSCRIPT_STRUCTURING_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_STRUCTURING_MODEL=gpt-4o-mini
```

`OPENAI_API_KEY` is still not required for build or readiness checks. The
structuring action creates review-only Suggested update records, internally
stored as `AIProposal` and `AIProposalItem` rows linked to the VoiceNote. It
does not apply proposal patches, mutate target records, create `VoiceMention`
records, perform external lookup, or call LinkedIn/Microsoft/Teams/Outlook
services.

## App Shell

Run the development server:

```bash
pnpm dev
```

Then open `http://localhost:3000`. Signed-in users are redirected to `/today`.
Unauthenticated requests to `/today`, `/capture`, `/commitments`, `/meetings`,
`/notes`, `/tasks`, `/people`, `/proposals`, `/opportunities`,
`/voice-notes`, `/search`, `/account`, and `/settings` redirect to `/sign-in`.

The app shell now links to real tenant-scoped workflows for capture, people,
opportunities, structured keyword search, and settings. Search is intentionally
basic keyword lookup; it does not use semantic search, pgvector, embeddings,
AI, external lookup, or background indexing.

## People And Companies

Step 6A adds the first record-management workflow:

- `/people`
- `/people/new`
- `/people/[personId]`
- `/people/[personId]/edit`
- `/people/companies`
- `/people/companies/new`
- `/people/companies/[companyId]`
- `/people/companies/[companyId]/edit`

Use local development sign-in, then create people and companies from the mobile
shell. Archive actions hide records from active lists without permanently
deleting them.

Step 6B adds affiliation management and read-only related context:

- create a person-company affiliation from a person detail page;
- create a person-company affiliation from a company detail page;
- edit, end, or archive an affiliation from the person-context edit route;
- mark one active affiliation as primary for a person;
- view latest tenant-scoped meeting and note summaries on person/company detail
  pages.

These flows do not create notes, call AI, run search/matching, or fetch
LinkedIn content. Step 12B adds manual LinkedIn URL fields to person forms.

## Meetings

Step 7A adds manual meeting records:

- `/meetings`
- `/meetings/new`
- `/meetings/[meetingId]`
- `/meetings/[meetingId]/edit`
- `/meetings/[meetingId]/participants/new`

The Capture screen links to `/meetings/new`. Meeting forms are full-page mobile
forms, write tenant-aware audit logs, and never accept a trusted tenant id from
the client. Participant removal deletes only the meeting-participant link.

Step 7B adds manual notes and pasted meeting-note capture:

- `/notes`
- `/notes/new`
- `/notes/[noteId]`
- `/notes/[noteId]/edit`
- `/meetings/[meetingId]/notes/new`
- `/capture/meeting`

Use `/capture/meeting` to paste user-provided Teams/Copilot text into a new
meeting plus linked note. The flow stores the pasted text as `Note.body`, marks
the meeting and note as `TEAMS_COPILOT_PASTE`, and creates a source reference
from the note to the meeting.

Step 7B still does not add Teams import, Microsoft Graph, AI extraction,
summarisation, task extraction, commitment extraction, voice recording,
transcription, or proposal generation.

## Follow-Up Tasks

Step 8A adds manual follow-up tasks:

- `/tasks`
- `/tasks/new`
- `/tasks/[taskId]`
- `/tasks/[taskId]/edit`

People, company, meeting, and note detail pages include contextual links into
`/tasks/new`. Those query parameters only preselect form fields; task server
actions still validate every linked record inside the active tenant. Task
lifecycle actions can complete, reopen, and archive records without deleting
linked relationship context.

The `/tasks` page is now the unified action area for existing tasks and active
commitments. It groups action items by needs attention, upcoming, waiting, open
without date, and recently completed. The aggregation is read-only and does not
send reminders, run background jobs, parse notes, create tasks automatically,
call AI providers, or merge the underlying Task and Commitment models.

## Commitment Ledger

Step 8B adds manual commitments:

- `/commitments`
- `/commitments/new`
- `/commitments/[commitmentId]`
- `/commitments/[commitmentId]/edit`

People, company, meeting, and note detail pages include contextual links into
`/commitments/new`. Those query parameters only preselect form fields;
commitment server actions still validate every linked record inside the active
tenant. Commitment lifecycle actions can fulfil, cancel, and archive records
without deleting linked relationship context.

The commitment ledger remains available at `/commitments` for commitment-
specific status, ownership, fulfil, cancel, archive, and detail review.
Commitments can also appear in `/tasks` for unified action review. Step 8B and
the unified action board do not create tasks automatically, send reminders, run
background jobs, parse notes, extract commitments, or call AI providers.

## Suggested Update Review

Step 9 adds status-only Suggested update review:

- `/proposals`
- `/proposals/[proposalId]`

User-facing screens call these records Suggested updates at `/proposals`; the
internal model names remain `AIProposal` and `AIProposalItem`.
Seed demo data with `SEED_DEMO_DATA=true` to preview stored suggested update
records.
Users can approve, reject, mark items as needing clarification, approve/reject
all pending items, or dismiss a suggested update. These actions update review
status and write audit logs only. They do not apply patches, mutate target
records, create tasks or commitments, call AI providers, or run background
jobs.

## Opportunities

Step 10A adds manual needs and capabilities:

- `/opportunities`
- `/opportunities/needs`
- `/opportunities/needs/new`
- `/opportunities/needs/[needId]`
- `/opportunities/needs/[needId]/edit`
- `/opportunities/capabilities`
- `/opportunities/capabilities/new`
- `/opportunities/capabilities/[capabilityId]`
- `/opportunities/capabilities/[capabilityId]/edit`

People, company, meeting, and note detail pages include contextual links into
need/capability creation. Query parameters only preselect fields; server actions
still validate every linked record inside the active tenant. The legacy
`IntroductionSuggestion` schema/data remains internal, and the retired
introduction routes return not-found.

This step does not add automated matching, scoring, AI generation, message
drafting, outreach sending, semantic search, embeddings, notifications, jobs,
or permanent deletion.

## Relationship Health

Step 10B-1 adds deterministic why-now signals on `/today`, person detail, and
company detail pages. The signals are read-only and computed from existing
tenant-scoped tasks, commitments, meetings, notes, needs, capabilities,
suggested update review records, and legacy internal introduction suggestion
records that are not surfaced as introduction-specific user-facing output.

The V1 thresholds are hardcoded internally: active within 14 days, warm within
45 days, stale after 60 days, dormant after 120 days, and upcoming due items
within 7 days. No admin configuration UI, AI reasoning, notifications,
background jobs, persisted scores, or signal dismissal/snooze behaviour exists
in this step.

## Meeting Prep Briefs

Step 10C adds `/meetings/[meetingId]/prep`, linked from meeting detail as
`View prep brief`. The brief is deterministic, read-only, and source-linked. It
aggregates existing tenant-scoped participant, company, note, task,
commitment, need, capability, suggested update, and relationship-health
context. Legacy introduction suggestion records are filtered out of the
user-facing brief. It does not generate summaries, call AI providers, sync from
Outlook/Teams, create source references, write audit logs, or mutate records.

## Microsoft Graph Readiness

Step 12A adds `/settings/integrations` and a Microsoft Graph provider boundary
for future work. Use `MICROSOFT_GRAPH_PROVIDER=disabled` for normal local
development. `MICROSOFT_GRAPH_PROVIDER=mock` is available only for local/test
provider checks and is rejected in production.

The Microsoft Graph variables in `.env.example` are optional future OAuth
configuration values. They are separate from Microsoft Entra/Auth.js sign-in
variables and are not required for build or readiness. Step 12A does not start
OAuth, store tokens, call live Graph APIs, sync calendar data, ingest email or
contacts, or create background jobs.

## LinkedIn Manual Enrichment

Step 12B adds manual LinkedIn enrichment only. Person create/edit forms can
store optional LinkedIn profile and Sales Navigator URLs after local URL
parsing, and `/notes/new` can create notes labelled
`LINKEDIN_USER_PROVIDED` from user-pasted context. Use person or company detail
actions to preselect the relevant note context.

Local development does not require any LinkedIn secrets or providers. The app
does not fetch LinkedIn URLs, preview profile pages, scrape, run browser
automation, monitor profiles, call LinkedIn APIs, sync Sales Navigator, or
create background jobs.

## Workspace Admin Settings

Step 13A adds workspace admin foundation routes:

- `/settings/workspace`
- `/settings/members`
- `/settings/features`

Workspace name changes require owner/admin access. Member role updates and
membership activation/deactivation are owner-only in this foundation step, and
the service blocks demoting or deactivating the last active owner. Memberships
are never hard-deleted.

The feature readiness page is read-only. It shows internal configuration
states for voice capture, speech-to-text provider readiness, transcript
structuring provider readiness, Microsoft readiness, LinkedIn manual
enrichment, billing readiness, meeting prep, and relationship health. Provider
readiness is local-configuration-only and does not call external providers.
Step 13A does not implement billing, Stripe providers, checkout, webhooks,
invite emails, invite tokens, complex RBAC, quotas, entitlements, or plan
enforcement.

## Billing Readiness

Step 13B adds `/settings/billing` and `server/providers/billing`.

- `BILLING_PROVIDER=disabled` is the default.
- `BILLING_PROVIDER=mock` may be used only in local/test and is rejected in
  production.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_ID_PRO` are
  future optional values and are not required for build/readiness.

No live Stripe provider, checkout, billing portal, webhook endpoint, billing
schema, payment collection, card storage, plan enforcement, quota, or lockout is
implemented.

## Governance Audit Viewer

Step 14A adds `/settings/governance` for workspace owners/admins.

The page reads tenant-scoped audit logs through `server/services/audit-log-viewer`
and `server/repositories/audit-logs`. Filters are query-string based and include
action, actor user id, target entity type, and date range. Results are bounded
and cursor-paginated. Metadata is sanitized again before display, so sensitive
keys, suspicious values, long strings, arrays, and nested objects are shown only
as safe previews.

The viewer is read-only. It does not write audit logs for page views, mutate
audit rows, export raw metadata, delete records, enforce retention, send alerts,
or integrate with SIEM tools. Privacy exports are available under
`/settings/privacy`, and archive controls are available under
`/settings/archive`. Permanent deletion and automated retention jobs remain out
of scope.

## Privacy Exports

Step 14B adds `/settings/privacy`.

- Personal export downloads a JSON file for the current user's contribution
  inside the active workspace.
- Workspace export downloads a JSON file for tenant-owned records and requires
  owner/admin access.
- Both export routes are synchronous `POST` downloads under
  `/api/privacy/exports/*` and write safe export-request audit events before
  returning data.
- Exported audit logs contain sanitized metadata previews only.

Exports may contain sensitive relationship intelligence, including note bodies,
Teams/Copilot pasted notes, user-provided LinkedIn notes, voice transcripts,
and AI proposal patches when those records are in scope. Raw audio is not
retained/exported, `VoiceNote.audioStorageKey` is excluded, and Auth.js tokens,
provider payloads, environment values, cookies, headers, secrets, raw audit
metadata, and payment/card data are not exported.

Step 14B does not implement deletion, erasure, retention jobs, CSV/ZIP export,
background export jobs, email delivery, external storage, SIEM export, or legal
advice. Archive and restore controls are available under `/settings/archive`,
but permanent deletion and automated retention remain future work.

## Archive And Retention Controls

Step 14C adds `/settings/archive` for workspace owners/admins.

- The archive browser is tenant-scoped and filters by record type.
- Restore clears `archivedAt` for supported business records and writes safe
  type-specific restore audit logs.
- Person restore maps `relationshipStatus = ARCHIVED` to `UNKNOWN` because the
  previous status is not stored.
- VoiceNote retention information is read-only; raw audio is not retained by
  default, and transcripts may still exist and appear in exports when in scope.

Step 14C does not implement permanent deletion, account deletion, tenant
deletion, audit-log deletion/editing, purge jobs, automated retention jobs, raw
audio deletion jobs, external storage cleanup, or legal workflows.
