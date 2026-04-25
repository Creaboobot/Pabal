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

## Docker PostgreSQL

```bash
docker compose config
docker compose up -d postgres
docker compose ps
docker compose down -v
```

`POSTGRES_PORT` and `APP_PORT` can be overridden in `.env.local` when local ports
are already in use.
