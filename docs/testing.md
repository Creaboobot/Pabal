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
