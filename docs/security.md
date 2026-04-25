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

## Development auth

Development credentials sign-in is local-only. It is enabled only when
`ENABLE_DEV_AUTH=true` and `NODE_ENV` is not `production`. It does not use or
store reusable passwords.

## Audit logging

Audit metadata is JSON, but the audit service removes sensitive keys and redacts
known secret-looking values before persistence. Do not log tokens, cookies,
session values, raw headers, connection strings, provider secrets, or raw
environment values.
