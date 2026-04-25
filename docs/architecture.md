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
route groups such as `/account` and `/settings`. Tenant membership and role
checks are enforced in server-side services and repositories, not middleware.

## Relationship backbone boundary

Step 4A adds server-side schema and skeletons for people, companies,
affiliations, meetings, notes, and source references. Repositories require
explicit tenant context, and services call `requireTenantAccess` before
tenant-scoped reads or writes. Cross-tenant direct relations use composite
tenant-aware foreign keys where Prisma/PostgreSQL can express them.

This stage intentionally contains no product UI workflows, tasks, commitments,
needs, capabilities, introduction suggestions, AI proposals, voice notes,
billing, Microsoft Graph sync, LinkedIn enrichment, or provider calls.
