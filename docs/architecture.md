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
route groups such as `/today`, `/capture`, `/meetings`, `/people`,
`/opportunities`, `/search`, `/account`, and `/settings`. Tenant membership and role checks are
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

Step 6A turns `/people` into the first real product workflow. People and company
screens live under the existing protected app shell:

- `/people`
- `/people/new`
- `/people/[personId]`
- `/people/[personId]/edit`
- `/people/companies`
- `/people/companies/new`
- `/people/companies/[companyId]`
- `/people/companies/[companyId]/edit`

Server actions validate form input with Zod, call `getCurrentUserContext()`,
and delegate mutations to tenant-aware services. The client never supplies a
trusted tenant id.

Step 6B adds affiliation management inside the same People area:

- `/people/[personId]/affiliations/new`
- `/people/[personId]/affiliations/[affiliationId]/edit`
- `/people/companies/[companyId]/affiliations/new`

Affiliation server actions call tenant-aware services, never trust client
tenant ids, and use a transaction when setting a primary affiliation. That
transaction verifies the person/company/affiliation tenant, unsets other active
primary affiliations for the same person, writes the selected affiliation, and
adds audit logs. Ending or archiving an affiliation clears its primary flag and
does not choose a replacement automatically.

Person and company detail pages also show read-only related meeting and note
summaries. These summaries use tenant-scoped repository methods and do not
create meetings, create notes, run AI summarisation, search semantically, or
match relationships.

Step 7A adds the manual meetings foundation under the protected app shell:

- `/meetings`
- `/meetings/new`
- `/meetings/[meetingId]`
- `/meetings/[meetingId]/edit`
- `/meetings/[meetingId]/participants/new`

Meeting server actions validate form input with Zod, call
`getCurrentUserContext()`, and delegate to tenant-aware meeting services.
Participant creation validates the meeting, person, and company against the
active tenant. Participant removal hard-deletes only the
`MeetingParticipant` association after writing an audit log.

The `/capture` page links to `/meetings/new`. It does not introduce
`/capture/meeting`, note routes, Teams import, Microsoft Graph, AI extraction,
summarisation, or automated proposal generation.

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
