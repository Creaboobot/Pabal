# Quality Gates

Run the foundation gate before opening or updating a PR:

```bash
pnpm check
```

The aggregate check runs lint, typecheck, Vitest, Prisma validation, and
production build. The individual commands are:

```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm prisma:deploy
pnpm prisma:seed
pnpm lint
pnpm typecheck
pnpm test
pnpm prisma:validate
pnpm build
```

Docker portability checks:

```bash
docker build .
docker compose config
docker compose up -d postgres
docker compose ps
docker compose down -v
```

Playwright is configured for local smoke testing with `pnpm test:e2e`, but it is
not part of CI yet so the scaffold workflow does not depend on browser downloads
or dev-server startup timing.

For dependency hygiene, run:

```bash
pnpm audit:prod
```
