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

This repository now contains the initial foundation scaffold only. It does not
implement authentication, tenancy, product records, AI workflows, billing,
Microsoft Graph, LinkedIn enrichment, or production deployment.

### Requirements

- Node.js `22.13.1` from `.node-version` / `.nvmrc`
- pnpm `9.15.4` from `packageManager`
- Docker and Docker Compose for local PostgreSQL

### Setup

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm prisma:validate
pnpm dev
```

The app runs at `http://localhost:3000`.

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
pnpm prisma:validate
pnpm prisma:migrate
pnpm prisma:deploy
pnpm prisma:seed
```

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
  runtime values such as `DATABASE_URL` are missing.

### Developer docs

- [Local development](docs/development/local-development.md)
- [Quality gates](docs/development/quality-gates.md)
