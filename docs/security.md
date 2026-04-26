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
- Protected app shell routes are `/today`, `/capture`, `/commitments`,
  `/meetings`, `/notes`, `/tasks`, `/people`, `/proposals`, `/opportunities`,
  `/search`, `/account`, and `/settings`; middleware protects those route
  groups without database tenant/RBAC logic.
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

Step 8A task mutations use the same server-action boundary. Task reads and
writes filter by explicit tenant context, and linked person, company, meeting,
note, commitment, and introduction suggestion ids are validated in server
services. Contextual create URLs are convenience hints only and do not carry
trusted tenant context.

Task audit metadata may include task id, status, priority, task type, linked
entity ids, due/reminder/snooze date presence, and changed field names. It must
not include full descriptions, why-now rationale text, note bodies, pasted
meeting-note text, raw form payloads, sensitive values, cookies, tokens,
environment values, or secrets.

Step 8B commitment mutations use the same boundary. Commitment reads and writes
filter by explicit tenant context, and linked owner/counterparty person/company,
meeting, and note ids are validated in server services. Contextual create URLs
are convenience hints only and do not carry trusted tenant context. Overdue
state is derived at read time and is not mutated by a background job.

Commitment audit metadata may include commitment id, status, owner type,
sensitivity, linked entity ids, due-date presence, due-window presence, and
changed field names. It must not include full descriptions, note bodies, pasted
meeting-note text, raw form payloads, sensitive values, cookies, tokens,
environment values, or secrets.

Step 9 proposal review uses the same boundary. Proposal reads and item review
updates filter by explicit tenant context. Cross-tenant proposal reads return
no record, cross-tenant item review attempts fail, and source/target context is
resolved only inside the active tenant.

Approval is review-only. Approving a proposal item records that the user
accepted it as conceptually valid, but it does not apply the proposed patch,
create records, mutate target records, call AI providers, or run jobs.

Proposal review audit metadata may include proposal id, proposal item id,
proposal type, action type, target entity type/id, confidence presence, and
status transition. It must not include proposed patch JSON, note bodies, pasted
meeting-note text, transcript text, raw AI output, raw form payloads, cookies,
tokens, headers, environment values, or secrets.

Step 10A-1 need and capability mutations use the same boundary. Reads and
writes filter by explicit tenant context, and linked person, company, meeting,
and note ids are validated by services before persistence. Contextual create
URLs are convenience hints only and do not carry trusted tenant context.

Need and capability audit metadata may include record id, status, type,
priority, sensitivity, linked entity ids, confidence presence, and changed
field names. It must not include full descriptions, note bodies, pasted
meeting-note text, raw form payloads, sensitive values, cookies, tokens,
environment values, or secrets.

Step 10A-2 introduction suggestion mutations use the same boundary. Reads and
writes filter by explicit tenant context. Need, capability, from/to person, and
from/to company ids are validated server-side before persistence. Meeting and
note provenance is only created through tenant-validated `SourceReference`
records. Query parameters preselect fields only and are never trusted as tenant
context.

Introduction audit metadata may include suggestion id, status, linked need and
capability ids, from/to person/company ids, confidence presence, and changed
field names. It must not include full rationale text, full descriptions, note
bodies, pasted meeting-note text, raw form payloads, sensitive values, cookies,
tokens, environment values, or secrets.

Step 10B-1 relationship health is read-only. The service requires explicit
tenant context, filters all queries by `tenantId`, and omits cross-tenant
records from why-now output. It does not write audit logs because it does not
mutate data. It also does not persist scores, update stored relationship
fields, call AI providers, generate recommendations, send notifications, run
background jobs, or add dismissal/snooze preferences.

Step 10C meeting prep briefs follow the same read-only boundary. Prep reads
require explicit tenant context, the meeting lookup filters by `tenantId`, and
all related notes, tasks, commitments, needs, capabilities, introductions,
proposals, source references, people, and companies are tenant-scoped. Snapshot
participants are displayed only from their meeting snapshot fields and are not
resolved by name or email. No audit log is written because the service does not
mutate data.

Step 11A-1 voice transcription uses a server-side provider adapter. The API
route requires authenticated tenant context, never accepts trusted `tenantId`
from the client, validates optional source context ids against the active
tenant before transcription, and validates audio MIME type, size, and optional
duration metadata. Raw audio is not stored, provider raw responses are not
stored, and audit logs include only safe metadata such as voice-note id, status,
audio MIME type/size/duration, transcript length, source ids, and provider name.
Audit logs must not include raw audio, transcript text, provider payloads,
request payloads, headers, cookies, tokens, environment values, API keys, or
secrets.

Step 11A-2 voice capture UI keeps raw audio in browser memory only until upload
or cancel. `/voice-notes/:path*` is protected by middleware for coarse auth,
while tenant ownership for detail/edit/archive remains enforced in services.
Transcript review and archive audit logs include safe ids, status, retention,
lengths, and changed field names only; they must not include transcript text,
edited transcript text, raw audio, provider payloads, headers, cookies, tokens,
environment values, API keys, or secrets.

Step 11B voice structuring sends a tenant-owned VoiceNote transcript to the
configured server-side transcript-structuring provider only after user
confirmation. The service never trusts client tenant ids, validates the
VoiceNote inside the active tenant, sends only tenant-owned candidate context to
the provider, validates strict output before persistence, and revalidates every
resolved target id before storing proposal items. Cross-tenant target ids are
not exposed and become unresolved review items.

Voice structuring audit metadata may include voice-note id, proposal id, item
count, provider name, transcript length, and resolved/unresolved target counts.
It must not include transcript text, edited transcript text, raw AI output,
proposed patch JSON, provider payloads, headers, cookies, tokens, environment
values, API keys, or secrets. Creating proposals from voice notes must not
mutate target records or create `VoiceMention` records.

Step 12A Microsoft Graph readiness has no mutations and does not write audit
logs. `/settings/integrations` requires active tenant context before rendering,
but no integration connection state is persisted yet. Future Microsoft Graph
connections must be tenant- and user-scoped, use encrypted token storage, and
include disconnect/revoke before requesting offline access. Step 12A does not
start OAuth, store tokens, call Microsoft Graph, sync calendar data, ingest
email/contact data, or create background jobs.

Step 12B LinkedIn handling is manual user-provided context only. LinkedIn and
Sales Navigator URLs are stored on tenant-owned `Person` records after pure URL
parsing with no network request. LinkedIn-context notes use the existing
tenant-aware note service, so cross-tenant person/company links fail in the
service layer. Audit metadata may include changed field names, source type, and
URL presence booleans, but it must not include full LinkedIn URLs, pasted
LinkedIn content, cookies, tokens, headers, or raw form payloads. The app must
not scrape, fetch, preview, monitor, automate, or call LinkedIn/Sales Navigator.

Step 13A workspace admin settings keep middleware limited to coarse auth.
Workspace admin reads and writes require active tenant context. Workspace name
updates require owner/admin access. Member role and membership-status mutations
are owner-only for V1, validate that the membership belongs to the active
tenant, resolve roles by `RoleKey`, and enforce last-active-owner protection in
the service layer. Memberships are deactivated/reactivated by status update and
are never hard-deleted. Audit metadata for workspace/member mutations includes
only ids, changed fields, role/status values, and tenant context; it must not
include secrets, raw form payloads, sensitive personal details, payment/card
data, provider payloads, or environment values.

Step 13B billing readiness is read-only. `/settings/billing` requires active
tenant context and owner/admin access, and the service returns only normalized
provider readiness for the active workspace. No billing rows are read or
written, no audit logs are written for page views, no payment method/card data
is collected or stored, and no Stripe raw payloads, secrets, tokens, headers,
or environment values are logged.

Step 14A governance is read-only. `/settings/governance` requires active tenant
context and owner/admin access. The audit viewer service enforces
`requireWorkspaceAdmin`, filters all audit reads by the active tenant id,
excludes tenant-null logs, and sanitizes metadata again before display. Viewer
sanitization redacts sensitive keys and suspicious values, truncates long
strings, bounds arrays/nested objects, and avoids raw JSON display. Viewing the
audit log must not mutate audit rows or write additional audit logs.

## Development auth

Development credentials sign-in is local-only. It is enabled only when
`ENABLE_DEV_AUTH=true` and `NODE_ENV` is not `production`. It does not use or
store reusable passwords.

## Audit logging

Audit metadata is JSON, but the audit service removes sensitive keys and redacts
known secret-looking values before persistence. Do not log tokens, cookies,
session values, raw headers, connection strings, provider secrets, or raw
environment values.
