# Architecture

Pobal uses a modular monolith built on Next.js App Router, TypeScript, Prisma,
and PostgreSQL.

## Foundation layout

- `app`: routes, layouts, and route handlers.
- `components`: shared UI, mobile, desktop, form, card, and state components.
- `modules`: future domain modules. This maps to the domain-module concept in
  the build brief.
- `server/services`: application service orchestration.
- `server/repositories`: database access boundaries.
- `server/providers`: external provider adapters.
- `server/config`: runtime configuration and environment validation.
- `prisma`: schema, migrations, and seed entrypoint.
- `tests`: unit, integration, and e2e tests.

This scaffold intentionally contains no auth, tenancy, records, AI, billing, or
integration features.
