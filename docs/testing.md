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
