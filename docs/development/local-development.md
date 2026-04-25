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

To also seed the small deterministic Step 4A relationship demo dataset,
Step 4B-1 action/intelligence-readiness demo records, and Step 4B-2
AI/voice-readiness demo records, set:

```bash
SEED_DEMO_DATA=true
pnpm prisma:seed
```

PowerShell:

```powershell
$env:SEED_DEMO_DATA = "true"
pnpm prisma:seed
```

Step 4B-2 seed data stores only placeholder transcript/proposal metadata. It
does not store real audio, provider responses, or external integration data.

## App Shell

Run the development server:

```bash
pnpm dev
```

Then open `http://localhost:3000`. Signed-in users are redirected to `/today`.
Unauthenticated requests to `/today`, `/capture`, `/commitments`, `/meetings`,
`/notes`, `/tasks`, `/people`, `/proposals`, `/opportunities`, `/search`,
`/account`, and `/settings` redirect to `/sign-in`.

The Step 5 screens are mobile-first shell placeholders. They show read-only
tenant-scoped summaries and design patterns only; they do not create records,
record audio, transcribe, apply AI proposals, run semantic search, or match
relationships.

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

These flows do not create notes, call AI, run search/matching, or store
LinkedIn URLs.

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

The Today screen shows task sections for overdue, due-today, upcoming, and
recently completed manual tasks. Step 8A does not send reminders, run
background jobs, parse notes, create tasks automatically, call AI providers, or
add the commitment-ledger workflow.

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

The Today screen shows commitment sections for overdue, due-today, upcoming,
waiting, and recently fulfilled commitments. Step 8B does not create tasks
automatically, send reminders, run background jobs, parse notes, extract
commitments, or call AI providers.

## Proposal Review

Step 9 adds status-only AI proposal review:

- `/proposals`
- `/proposals/[proposalId]`

Seed demo data with `SEED_DEMO_DATA=true` to preview stored proposal records.
Users can approve, reject, mark items as needing clarification, approve/reject
all pending items, or dismiss a proposal. These actions update proposal review
status and write audit logs only. They do not apply patches, mutate target
records, create tasks or commitments, call AI providers, or run background jobs.

## Opportunities

Step 10A-1 adds manual needs and capabilities:

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
need/capability creation. Query parameters only preselect fields; server
actions still validate every linked record inside the active tenant.

This step does not add introduction routes, automated matching, scoring, AI
generation, semantic search, embeddings, notifications, jobs, or permanent
deletion.
