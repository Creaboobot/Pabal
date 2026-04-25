# Pobal

Pobal is a mobile-web-first network companion for consultants and relationship-driven professionals.

The application helps users:

- manage people and company records;
- capture meeting notes and voice updates;
- structure relationship intelligence with AI;
- track follow-ups and commitments;
- identify network matches and introduction opportunities;
- prepare for meetings using relationship memory;
- maintain a migration-ready SaaS foundation.

## Source of truth

The product and engineering source of truth is:

- [`/docs/product/network-companion-final-build-brief.md`](docs/product/network-companion-final-build-brief.md)

Codex and all contributors must also follow and read carefully before any edits:

- [`AGENTS.md`](AGENTS.md)
- [`/docs/development/codex-operating-model.md`](docs/development/codex-operating-model.md)
- [`/docs/development/initial-codex-task.md`](docs/development/initial-codex-task.md)
- ADRs in [`/docs/decisions`](docs/decisions)

## Intended architecture

Initial V1 target:

```text
Next.js App Router + TypeScript
PostgreSQL + Prisma + pgvector
OpenAI provider adapter for AI and transcription
Hosted initially on Vercel + Neon
Migration-ready for Azure Container Apps + Azure Database for PostgreSQL
```

## Important product constraints

- Mobile web is the primary UX.
- Desktop is secondary and used for heavier management workflows.
- AI can propose updates but must not mutate core records without user confirmation.
- LinkedIn integration is manual user-provided enrichment only.
- The app must remain portable and Docker-compatible.
- External providers must be accessed through internal adapters.

## First Codex task

Use the task in:

- [`/docs/development/initial-codex-task.md`](docs/development/initial-codex-task.md)

Do **not** ask Codex to build the full application in one step.

## Manual repository upload

If uploading this pack manually through GitHub, upload the full folder contents to the root of the `Creaboobot/Pobal` repository and commit them. Then start Codex with the prompt in `FIRST_CODEX_PROMPT.md`.

## Local development

This repository contains the foundation scaffold plus the Step 3 SaaS
foundation: Auth.js-compatible authentication wiring, tenants/workspaces,
memberships, roles, protected route shells, and audit logging baseline. It also
includes the Step 4A relationship backbone models and the Step 4B-1
action/intelligence-readiness models for tasks, commitments, needs,
capabilities, and introduction suggestions. It also includes Step 4B-2
schema/readiness models for AI proposals and voice notes. Step 5 adds the
mobile-first authenticated app shell and read-only route placeholders for
Today, Capture, People, Opportunities, and Search. Step 6A adds the first real
product workflow: mobile-first people and company record management. Step 6B
adds basic affiliation management and read-only related meeting/note summaries.
Step 7A adds manual meeting records, meeting participants, source metadata, and
audit-logged archive/remove actions. Step 7B adds manual note workflows and
pasted Teams/Copilot meeting-note capture as user-provided text only. Step 8A
adds manual follow-up task workflows and Today task sections. Step 8B adds the
manual commitment ledger and Today commitment sections. It does not implement
LinkedIn URL storage, AI provider calls, proposal application, transcription,
audio recording/upload, billing, Microsoft Graph, LinkedIn enrichment,
production search, matching, notifications, reminders, background jobs,
automatic task creation, or production deployment.

### Requirements

- Node.js `22.13.1` from `.node-version` / `.nvmrc`
- pnpm `9.15.4` from `packageManager`
- Docker and Docker Compose for local PostgreSQL

### Setup

```bash
pnpm install
Copy-Item .env.example .env.local
docker compose up -d postgres
pnpm prisma:generate
pnpm prisma:deploy
pnpm prisma:seed
pnpm prisma:validate
pnpm dev
```

Edit `.env.local` before starting the app:

- set `AUTH_SECRET` to a local random value;
- for example, run `pnpm exec auth secret` after dependencies are installed;
- set `ENABLE_DEV_AUTH=true` only for local development sign-in;
- keep Microsoft Entra variables blank until OAuth is intentionally configured.

The app runs at `http://localhost:3000`. Development sign-in is available at
`/sign-in` only when `ENABLE_DEV_AUTH=true` and `NODE_ENV` is not production.
Signed-in users land on `/today`; unauthenticated access to `/today`,
`/capture`, `/commitments`, `/meetings`, `/notes`, `/tasks`, `/people`,
`/opportunities`, `/search`, `/account`, and `/settings` redirects to
`/sign-in`.

### App shell routes

The primary mobile navigation is:

- `/today`
- `/capture`
- `/people`
- `/opportunities`
- `/search`

These screens are shell/design-system placeholders with read-only summaries
from existing tenant-scoped records. They do not create, update, approve,
record, transcribe, search semantically, or match records.

People and company records are available under `/people`:

- `/people` for people list and person creation.
- `/people/[personId]` for person detail and edit/archive actions.
- `/people/companies` for company list and company creation.
- `/people/companies/[companyId]` for company detail and edit/archive actions.
- `/people/[personId]/affiliations/new` to link a person to a company.
- `/people/[personId]/affiliations/[affiliationId]/edit` to edit, end, or
  archive an affiliation.
- `/people/companies/[companyId]/affiliations/new` to link an existing person
  to a company.

Affiliation mutations are tenant-aware, audit-logged, and use transaction-safe
primary affiliation handling. Related meetings and notes are read-only
summaries only. The current schema does not include LinkedIn URL fields.

Manual meeting records are available under `/meetings`:

- `/meetings` for the active meeting list.
- `/meetings/new` for manual meeting creation.
- `/meetings/[meetingId]` for meeting detail, participant list, note count, and
  archive action.
- `/meetings/[meetingId]/edit` for meeting edits.
- `/meetings/[meetingId]/participants/new` to add a known person or snapshot
  participant.

Participant removal deletes only the `MeetingParticipant` association. It does
not delete people, companies, meetings, notes, or source references. The source
metadata enum currently supports `MANUAL` and `TEAMS_COPILOT_PASTE`, but Step
7A itself did not add Teams import, note creation, AI extraction, or
summarisation.

Manual notes are available through contextual routes:

- `/notes/new` for a general manual note.
- `/notes/[noteId]` for note detail.
- `/notes/[noteId]/edit` for note edits and archive actions.
- `/meetings/[meetingId]/notes/new` to add a note to an existing meeting.
- `/capture/meeting` to paste user-provided Teams/Copilot meeting notes into a
  new meeting plus linked source note.

Pasted meeting-note capture stores the pasted text in `Note.body`, marks the
meeting and note with `TEAMS_COPILOT_PASTE`, and creates a safe `NOTE ->
MEETING` source reference. It does not parse, summarise, extract tasks,
commitments, needs, capabilities, or create AI proposals.

Manual follow-up tasks are available under `/tasks`:

- `/tasks` for task sections grouped by overdue, due today, upcoming, open
  without due date, and recently completed.
- `/tasks/new` for manual task creation.
- `/tasks/[taskId]` for task detail and complete/reopen/archive actions.
- `/tasks/[taskId]/edit` for task edits.

Tasks can link to existing people, companies, meetings, notes, commitments, and
introduction suggestions. Query-parameter context links from people, companies,
meetings, and notes are convenience hints only; server actions validate all
linked records inside the active workspace. Step 8A does not add reminders,
notifications, background jobs, automatic extraction, AI recommendations, or
the commitment-ledger UI.

Manual commitments are available under `/commitments`:

- `/commitments` for the commitment ledger grouped by overdue, due today,
  upcoming, waiting, open without due date, and recently fulfilled.
- `/commitments/new` for manual commitment creation.
- `/commitments/[commitmentId]` for commitment detail and fulfil/cancel/archive
  actions.
- `/commitments/[commitmentId]/edit` for commitment edits.

Commitments can link to existing people, companies, meetings, and notes. Linked
tasks are shown read-only when an existing task references a commitment.
Contextual links from people, companies, meetings, and notes preselect fields
only; server actions validate all linked records inside the active workspace.
Step 8B does not create tasks automatically, send reminders, run background
jobs, parse notes, extract commitments, or call AI providers.

### Useful commands

```bash
pnpm check
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm test
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm audit:prod
pnpm prisma:generate
pnpm prisma:validate
pnpm prisma:migrate
pnpm prisma:deploy
pnpm prisma:seed
```

Optional deterministic demo relationship, Step 4B-1 action/intelligence, and
Step 4B-2 AI/voice-readiness data can be seeded by setting
`SEED_DEMO_DATA=true` before `pnpm prisma:seed`. The Step 4B-2 seed stores only
placeholder transcript/proposal metadata; it does not store real audio or call
AI/transcription providers.

### Docker Compose

Verify the Compose file and PostgreSQL health path:

```bash
docker compose config
docker compose up -d postgres
docker compose ps
docker compose down -v
```

Start PostgreSQL and the app:

```bash
docker compose up --build
```

Run migration or seed commands against the local PostgreSQL service:

```bash
docker compose run --rm migrate
docker compose run --rm seed
```

### Runtime checks

- `GET /api/health` returns a basic service health payload.
- `GET /api/ready` validates runtime readiness and returns `503` when required
  runtime values such as `DATABASE_URL` or `AUTH_SECRET` are missing.

### Developer docs

- [Local development](docs/development/local-development.md)
- [Quality gates](docs/development/quality-gates.md)
- [Auth and tenancy](docs/development/auth-and-tenancy.md)
- [Design system](docs/design-system.md)
