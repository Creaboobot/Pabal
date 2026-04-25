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

CI runs lint, typecheck, Vitest, Prisma validation, production build, and Docker
build. CI also validates the Docker Compose file and boots the PostgreSQL service
until its health check passes. Playwright is configured but not run in CI until
browser installation and app startup requirements are expanded deliberately.
