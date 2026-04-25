# Security

The Step 3 foundation implements the first authentication, tenant isolation,
role, protected route, and audit logging baseline.

Foundation rules:

- Do not commit secrets.
- Keep runtime secrets in environment variables.
- Keep external providers behind server-side adapters.
- Keep Next.js middleware limited to coarse authentication checks.
- Enforce tenant and role checks in server-side services, route handlers, or
  server actions.
- Protected app shell routes are `/today`, `/capture`, `/meetings`, `/notes`,
  `/people`, `/opportunities`, `/search`, `/account`, and `/settings`;
  middleware protects those route groups without database tenant/RBAC logic.
- Tenant-owned data models must go through tenant-aware repositories and
  services.
- Use composite tenant-aware foreign keys where practical so cross-tenant links
  fail at the database layer as well as the service layer.
- Sensitive operations must be audit-logged.
- Health and readiness endpoints must return status only, never secret values.

## Relationship data

Step 4A relationship backbone records all include `tenantId`. Person email is
optional and not globally unique. Company name is not unique. `SourceReference`
is polymorphic, so the source-reference service validates both source and target
tenant ownership before inserting.

Step 4B-1 action and intelligence-readiness records also include `tenantId`.
Direct links among tasks, commitments, needs, capabilities, introduction
suggestions, and Step 4A records use composite tenant-aware foreign keys where
practical. `SourceReference` validation now includes Step 4B-1 entity types.

Step 4B-2 AI proposal and voice-note-readiness records include `tenantId`.
Direct links from AI proposals, proposal items, voice notes, and voice mentions
use composite tenant-aware foreign keys where practical. Polymorphic proposal
targets and voice mention resolutions are service-validated: type and id must be
provided together, and the referenced record must exist in the same tenant.

AI proposal records store proposed patches only. Creating proposal or proposal
item records must not mutate target records, even when stored status values are
`APPROVED`. Voice-note records store transcript and retention metadata only;
raw audio is not required, and the default audio retention status is
`NOT_STORED`.

Step 6A people and company mutations use server actions that call
`getCurrentUserContext()` and tenant-aware services. Client form submissions do
not include trusted tenant ids. Cross-tenant detail reads return no record, and
cross-tenant writes fail in the service layer. Person/company create, update,
and archive operations write audit logs with minimal metadata only; full contact
details, descriptions, and before/after payloads are not logged.

Step 6B affiliation mutations follow the same boundary. Server actions receive
person/company/affiliation ids from route context or form controls, then
services verify those records belong to the active tenant before writing. The
primary-affiliation update is transactional: other active primary affiliations
for the same person and tenant are unset before the selected affiliation is
stored as primary. Ending or archiving an affiliation clears `isPrimary`.

Affiliation audit metadata is intentionally minimal and must not include full
contact details, note text, descriptions, raw form payloads, or sensitive
relationship values. Related meeting and note summaries are read-only and
tenant-scoped.

Step 7A meeting mutations use the same server-action boundary. Meeting reads
and writes filter by explicit tenant context. Participant creation validates
the meeting, known person, and company against the active tenant, and duplicate
known-person participants are rejected. Participant removal validates tenant
ownership, writes `meeting_participant.removed`, then deletes only the
association row.

Meeting audit metadata must not include full summaries, pasted note text, raw
form payloads, participant email/name snapshots, cookies, tokens, environment
values, or secrets.

Step 7B note and pasted-capture mutations use the same service boundary. Note
reads and writes filter by explicit tenant context, and linked person, company,
and meeting ids are validated in server services. Pasted capture validates
manually selected participants and primary company against the active tenant,
creates the meeting/note/source-reference records in one transaction, and does
not invoke AI, Microsoft, Teams, transcription, search, or matching services.

Note and capture audit metadata may include ids, source type, note type,
sensitivity, changed field names, participant count, `hasSummary`, and
`bodyLength`. It must not include note bodies, pasted Teams/Copilot text, full
meeting summaries, full note summaries, raw form payloads, contact snapshots,
cookies, tokens, headers, environment values, or secrets.

## Development auth

Development credentials sign-in is local-only. It is enabled only when
`ENABLE_DEV_AUTH=true` and `NODE_ENV` is not `production`. It does not use or
store reusable passwords.

## Audit logging

Audit metadata is JSON, but the audit service removes sensitive keys and redacts
known secret-looking values before persistence. Do not log tokens, cookies,
session values, raw headers, connection strings, provider secrets, or raw
environment values.
