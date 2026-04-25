# Architecture

Pobal uses a modular monolith built on Next.js App Router, TypeScript, Prisma,
and PostgreSQL.

## Foundation layout

- `app`: routes, layouts, and route handlers.
- `components`: shared UI, mobile, desktop, form, card, and state components.
- `modules`: future domain modules. This maps to the domain-module concept in
  the build brief.
- `server/services`: application service orchestration, including auth context,
  tenant access checks, role seeding, audit logging, and Step 4A relationship
  backbone validation.
- `server/repositories`: database access boundaries. Tenant-scoped reads require
  explicit `tenantId` and `userId` inputs.
- `server/providers`: external provider adapters.
- `server/config`: runtime configuration and environment validation.
- `prisma`: schema, migrations, and seed entrypoint.
- `tests`: unit, integration, and e2e tests.

## Auth and tenancy boundary

Auth.js is configured with a root `auth.ts` and App Router route handler under
`app/api/auth/[...nextauth]`. The current session strategy is JWT so the
development-only credentials provider can authenticate local users without
database session duplication. Standard Auth.js Prisma models are still present
for user/account persistence and future OAuth compatibility.

Next.js middleware performs only coarse authentication checks for protected
route groups such as `/today`, `/capture`, `/people`, `/opportunities`,
`/search`, `/account`, and `/settings`. Tenant membership and role checks are
enforced in server-side services and repositories, not middleware.

## Mobile app shell

Step 5 adds the protected `(app)` route group for the authenticated app shell.
Signed-in users are sent from `/` to `/today`; unauthenticated users are sent to
`/sign-in`. The shell uses a mobile bottom navigation as the primary UX and a
desktop sidebar fallback on larger screens.

Primary navigation:

- Today
- Capture
- People
- Opportunities
- Search

The current screens are read-only placeholders that surface tenant-scoped
counts and design patterns. They do not implement CRUD, capture workflows,
proposal approval, voice recording, semantic search, matching, notifications,
or external provider calls.

## Relationship backbone boundary

Step 4A adds server-side schema and skeletons for people, companies,
affiliations, meetings, notes, and source references. Repositories require
explicit tenant context, and services call `requireTenantAccess` before
tenant-scoped reads or writes. Cross-tenant direct relations use composite
tenant-aware foreign keys where Prisma/PostgreSQL can express them.

Step 4B-1 adds schema and server-side skeletons for tasks, commitments, needs,
capabilities, and introduction suggestions. These records follow the same
tenant-aware repository/service pattern and use composite relations for direct
links to Step 4A records and to each other.

Step 4B-2 adds schema and server-side skeletons for AI proposal readiness and
voice note readiness. Direct source/context links use composite tenant-aware
relations where practical. Polymorphic proposal targets and voice mention
resolutions are validated in services before persistence.

This stage intentionally contains no product UI workflows, AI proposal
generation, voice recording, transcription, proposal application engine,
matching algorithm, notifications, background jobs, billing, Microsoft Graph
sync, LinkedIn enrichment, semantic search, embeddings, or provider calls.
