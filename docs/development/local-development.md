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
