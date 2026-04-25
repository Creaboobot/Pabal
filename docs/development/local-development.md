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
Unauthenticated requests to `/today`, `/capture`, `/people`, `/opportunities`,
`/search`, `/account`, and `/settings` redirect to `/sign-in`.

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

These flows do not create meetings, create notes, call AI, run search/matching,
or store LinkedIn URLs.
