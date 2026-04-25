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

Vitest runs test files serially because the integration suite uses a shared
test database and resets tables between cases.

CI runs Prisma generation, validation, migrations, seed, lint, typecheck,
Vitest, production build, Docker build, Docker Compose config, and Docker
Compose PostgreSQL health verification. Playwright is configured but not run in
CI until browser installation and app startup requirements are expanded
deliberately.
