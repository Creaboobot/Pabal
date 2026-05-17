# Data Model

The Step 3 SaaS foundation defines authentication, tenant/workspace,
membership, role, and audit logging tables. Step 4A adds the first
tenant-scoped relationship backbone tables. Step 4B-1 adds tenant-scoped
action and intelligence-readiness tables. Step 4B-2 adds tenant-scoped
AI-proposal-readiness and voice-note-readiness tables. Step 7A adds source
metadata to meetings and notes. Step 7B uses that metadata for manual notes and
pasted meeting-note capture without changing the schema. Step 8A uses the
existing `Task` model for manual follow-up workflows without changing the
schema. Step 8B uses the existing `Commitment` model for the manual commitment
ledger without changing the schema. The current `/tasks` view is a read-only
unified action area over existing Task and Commitment records; it does not
merge the models or change the schema. Step 9 uses the existing `AIProposal`
and `AIProposalItem` models for status-only Suggested update review without
changing the schema. Step 10A-1 uses the existing `Need` and `Capability`
models for manual relationship-intelligence workflows without changing the
schema. Step 10A-2 keeps the existing `IntroductionSuggestion` model as
legacy/internal schema only; it is no longer an active V1 user-facing workflow.
Step 10C uses existing meeting and relationship records for read-only prep
briefs without changing the schema.
Step 11A uses the existing `VoiceNote` model for backend transcription and
transcript review without changing the schema. Step 11B uses existing
`AIProposal` and `AIProposalItem` source VoiceNote links for review-only voice
structuring without changing the schema. Step 12B adds small manual LinkedIn
enrichment fields and one source enum value.

## Foundation tables

- `User`, `Account`, `Session`, and `VerificationToken`: standard Auth.js
  Prisma adapter-compatible models.
- `Tenant`: workspace boundary. The default workspace for a user is marked by
  `defaultForUserId`, which is unique so repeated sign-ins do not create
  duplicate default workspaces.
- `Membership`: joins users to tenants and stores the role assignment.
- `Role`: simple foundation roles: `OWNER`, `ADMIN`, `MEMBER`, and `VIEWER`.
- `AuditLog`: tenant-aware audit entries with minimal sanitized JSON metadata.

## Step 4A relationship backbone

- `Person`: tenant-owned relationship record. Email, LinkedIn profile URL, and
  Sales Navigator URL are optional and owned/indexed within the tenant, not
  globally unique.
- `Company`: tenant-owned organisation record. Company name is indexed by
  tenant, not unique, because duplicates, subsidiaries, spelling variants, and
  legal suffixes are expected.
- `CompanyAffiliation`: tenant-owned link between a person and a company. The
  schema uses composite tenant-aware foreign keys to prevent cross-tenant
  person/company links.
- `Meeting`: tenant-owned meeting shell with optional primary company and
  `sourceType`.
- `MeetingParticipant`: tenant-owned meeting participant link with
  `participantRole`, avoiding confusion with the SaaS `Role` model.
- `Note`: tenant-owned note that may link directly to person, company, and/or
  meeting context, with `sourceType` for future manual paste workflows.
- `SourceReference`: controlled polymorphic provenance link between tenant-owned
  records. Services must validate that both source and target belong to the same
  tenant before creating a reference.

## Step 4B-1 action and intelligence readiness

- `Task`: tenant-owned follow-up/action shell with optional person, company,
  meeting, note, commitment, and legacy internal introduction suggestion links.
- `Commitment`: tenant-owned promise/obligation ledger, distinct from generic
  tasks, with owner/counterparty person or company links.
- `Need`: tenant-owned problem, requirement, request, opportunity, or interest.
- `Capability`: tenant-owned expertise, access, asset, experience, or solution
  potential.
- `IntroductionSuggestion`: tenant-owned legacy/internal relationship
  brokerage suggestion that can link a need, capability, people, and companies.
  The schema/table remains for historical data, source references, export, and
  migration safety, but V1 no longer exposes it as an active user-facing
  workflow.

Step 4B-1 intentionally does not add `AIProposal`, `AIProposalItem`,
`VoiceNote`, `VoiceMention`, billing, Microsoft Graph, LinkedIn enrichment,
notifications, background jobs, search, embeddings, or provider calls. Matching
and reminder workflows belong to later steps.

## Step 4B-2 AI and voice readiness

- `AIProposal`: tenant-owned proposal container with optional source note,
  meeting, and voice-note context, optional polymorphic target reference,
  status, explanation, confidence, and review metadata.
- `AIProposalItem`: tenant-owned independently reviewable proposed change item
  with action type, proposed patch JSON, optional polymorphic target, status,
  explanation, confidence, and review metadata.
- `VoiceNote`: tenant-owned voice-note readiness record with nullable transcript
  text, edited transcript text, language, confidence, direct context links, and
  nullable audio metadata placeholders. Raw audio is not required and defaults
  to `NOT_STORED`.
- `VoiceMention`: tenant-owned mention detected within a voice note, with
  mention text/type, optional transcript span, optional polymorphic resolved
  entity reference, confidence, and confirmation metadata.

Step 4B-2 was schema/service readiness only. It did not call AI providers,
transcribe audio, record audio, upload audio, apply proposal patches, mutate
target records, or add proposal review UI. Even `APPROVED` proposal statuses
are stored state only until a later explicit application engine exists.

Step 11A-1 turns `VoiceNote` into the backend transcription persistence target.
Successful transcription stores transcript text, optional language/confidence,
audio MIME type, size, optional duration, `audioRetentionStatus=NOT_STORED`,
and `rawAudioDeletedAt`. Raw audio and provider raw responses are not persisted.
This step does not create `VoiceMention`, `AIProposal`, or `AIProposalItem`
records and does not mutate linked person, company, meeting, or note records.

## Step 6A people and company workflow

Step 6A uses the existing `Person` and `Company` schema without a migration.
People can be created, edited, and archived with display name, contact details,
title/role, relationship status, and relationship temperature. Companies can be
created, edited, and archived with name, website, industry, and description.

Archived people and companies are hidden from active lists and detail reads by
repository filters. Historical relationship context remains intact.

Step 12B later adds optional manual LinkedIn URL fields to `Person`; Step 6A
itself did not fetch, validate, or enrich from LinkedIn.

## Step 6B affiliation management and related context

Step 6B uses the existing `CompanyAffiliation` schema without a migration.
Users can create, edit, end, and archive affiliations between existing people
and companies. `isPrimary` marks the main active company link for a person.
When a new or updated affiliation is made primary, the service transaction
unsets other active, non-archived primary affiliations for that same person and
tenant before saving the selected record.

Ending or archiving an affiliation clears `isPrimary` and does not
automatically choose a replacement. Archived affiliations are hidden from active
relationship context while preserving historical records.

Person and company detail pages now show read-only latest meeting and note
summaries from existing `Meeting`, `MeetingParticipant`, and `Note` records.
These summaries do not introduce meeting capture, note creation, AI
summarisation, semantic search, or matching behavior.

## Step 7A meetings foundation

Step 7A adds a focused `RecordSourceType` enum with:

- `MANUAL`
- `TEAMS_COPILOT_PASTE`
- `LINKEDIN_USER_PROVIDED` added later in Step 12B for notes only

`Meeting.sourceType` and `Note.sourceType` default to `MANUAL`. This is source
metadata only. It does not add Teams import, Microsoft Graph, Copilot import,
note creation UI, AI extraction, or summarisation.

Manual meeting workflows use the existing `Meeting` and `MeetingParticipant`
models. `MeetingParticipant` keeps tenant-aware composite relations to
`Meeting`, `Person`, and `Company`. A known-person participant is unique per
meeting through `@@unique([tenantId, meetingId, personId])`; snapshot-only
participants are allowed for external attendees.

Participant removal hard-deletes only the `MeetingParticipant` association.
The linked person, company, meeting, notes, and source references are preserved.

## Step 7B notes and pasted capture

Step 7B uses the existing `Note`, `Meeting`, and `SourceReference` models
without a migration. Manual notes can link directly to a person, company, and/or
meeting through tenant-aware composite relations already present in the schema.

The pasted Teams/Copilot capture flow creates:

- one `Meeting` with `sourceType = TEAMS_COPILOT_PASTE`;
- one linked `Note` with `noteType = MEETING` and
  `sourceType = TEAMS_COPILOT_PASTE`;
- optional manually selected `MeetingParticipant` rows for known people;
- one `SourceReference` from `NOTE` to `MEETING`.

The flow stores pasted user text in `Note.body` and optional manual summary in
`Note.summary` / `Meeting.summary`. It does not create tasks, commitments,
needs, capabilities, AI proposals, voice notes, or extracted structured data.

## Step 8A follow-up tasks

Step 8A promotes the existing `Task` model from schema readiness into a manual
follow-up workflow. It does not add a migration.

Tasks remain tenant-scoped and can link directly to:

- `Person`
- `Company`
- `Meeting`
- `Note`
- `Commitment`
- `IntroductionSuggestion`

Those direct links already use tenant-aware composite relations in Prisma, and
task services also validate linked records before writing. Task lifecycle uses
existing fields only:

- create defaults to `OPEN`;
- complete sets `status = DONE` and `completedAt`;
- reopen sets `status = OPEN` and clears `completedAt`;
- archive sets `archivedAt` and never hard-deletes the task.

Overdue, due-today, and upcoming sections are derived from `dueAt` at read
time. Step 8A does not add reminder delivery, notifications, recurring tasks,
background jobs, automatic extraction, AI proposals, or commitment-ledger
screens.

## Step 8B commitment ledger

Step 8B promotes the existing `Commitment` model from schema readiness into a
manual commitment ledger. It does not add a migration.

Commitments remain tenant-scoped and can link directly to:

- owner person or owner company, depending on `ownerType`;
- counterparty person and/or counterparty company;
- `Meeting`;
- `Note`.

Those links already use tenant-aware composite relations in Prisma, and
commitment services also validate linked records before writing. Owner
semantics stay simple:

- `ME` and `UNKNOWN` commitments cannot include owner person/company ids;
- `OTHER_PERSON` commitments require an owner person;
- `COMPANY` commitments require an owner company.

Commitment lifecycle uses existing fields only:

- create defaults to `OPEN`;
- fulfil sets `status = DONE`;
- cancel sets `status = CANCELLED`;
- archive sets `archivedAt` and never hard-deletes the commitment.

Overdue, due-today, upcoming, waiting, and recently fulfilled sections are
derived at read time from status plus `dueAt` or the due-window boundary. Step
8B does not add reminder delivery, notifications, recurring commitments,
background jobs, automatic task creation, automatic commitment extraction,
AI proposals, or parsing of notes/meeting notes.

## Step 9 Suggested update review

Step 9 promotes existing `AIProposal` and `AIProposalItem` readiness records
into a status-only human review workflow. User-facing screens call these
records Suggested updates. This step does not add a migration.

Proposal item lifecycle uses existing values:

- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`
- `NEEDS_CLARIFICATION`

Proposal status is rolled up from item statuses:

- all approved -> `APPROVED`
- all rejected -> `REJECTED`
- all pending -> `PENDING_REVIEW`
- pending plus reviewed items, or all clarification-needed items -> `IN_REVIEW`
- mixed reviewed outcomes -> `PARTIALLY_APPROVED`

`APPROVED` means the user accepted a proposed item as conceptually valid. It
does not mean the patch was applied. Step 9 does not mutate target records,
create records, apply proposed patches, call AI providers, generate proposals,
or run background jobs.

Explicit Task/Meeting conversion is separate from approval. A user-confirmed
conversion creates the new Task or Meeting from an editable form, then stores a
`SourceReference` from `AIProposalItem` to the created record and writes safe
audit metadata. It does not require a schema migration and does not change the
`AIProposalItem` status.

## Step 10A opportunities workflows

Step 10A-1 promotes the existing `Need` and `Capability` models from
readiness into manual workflows.

Needs remain tenant-scoped and can link directly to:

- `Person`
- `Company`
- `Meeting`
- `Note`

PR 4 adds one nullable `Need.reviewAfter` field mapped to `review_after`.
This is a lightweight human review date only. Empty form values persist as
`null`; due or past dates may surface the Need in relationship attention, but
they do not create tasks, commitments, reminders, notifications, or background
jobs.

Capabilities remain tenant-scoped and can link directly to:

- `Person`
- `Company`
- `Note`

The current schema does not include a direct `Capability -> Meeting` foreign
key, so meeting-context capability creation is limited to existing note,
person, or company context unless a later schema change is approved.

Need and capability services validate linked records before writing and hide
archived records from active lists/detail reads. Archiving sets `archivedAt`
and never hard-deletes the record.

Step 10A-2 keeps the existing `IntroductionSuggestion` model for legacy/internal
data. It does not add a migration. Introduction suggestion records remain
tenant-scoped and can link directly to:

- `Need`
- `Capability`
- from/to `Person`
- from/to `Company`

There are no direct meeting or note foreign keys on `IntroductionSuggestion`,
so meeting/note provenance is recorded with tenant-validated
`SourceReference` rows such as `MEETING -> INTRODUCTION_SUGGESTION` or
`NOTE -> INTRODUCTION_SUGGESTION`. Dismissal maps to the existing `REJECTED`
status. Archiving sets `archivedAt` and never hard-deletes the record.

The user-facing Introduction Suggestion routes are retired and return
not-found. Needs and capabilities remain the active V1 Opportunities workflow.

Step 10A does not add automated matching, scoring, AI generation, semantic
search, embeddings, message drafting, outreach sending, or background jobs.

## Step 10B-1 relationship health

Step 10B-1 does not add a migration. Relationship health is computed at read
time from existing tenant-scoped records and is not persisted as a score.

Computed signals are:

- `NEEDS_ATTENTION`
- `ACTIVE`
- `WARM`
- `STALE`
- `DORMANT`
- `UNKNOWN`

The service also returns explainable why-now reasons linked to source records
where possible, including overdue/upcoming tasks, open commitments, due Need
review dates, active needs/capabilities, pending Suggested update review, recent
meetings/notes, and stale or dormant relationship context. Future
`Need.reviewAfter` dates are not urgent. Legacy introduction suggestion records
may remain in the database but are not surfaced as user-facing relationship
attention reasons.

Existing stored `Person.relationshipStatus` and
`Person.relationshipTemperature` remain unchanged. Step 10B-1 does not add AI
reasoning, embeddings, search, matching, notifications, background jobs,
dismissal preferences, or persisted relationship scores.

## Step 10C meeting prep briefs

Step 10C does not add a migration. Meeting prep briefs are computed at read
time from existing tenant-scoped records:

- `Meeting`, `MeetingParticipant`, `Person`, and `Company` for meeting and
  participant context;
- `Note`, `Task`, `Commitment`, `Need`, `Capability`, and `AIProposal` for
  explicitly linked user-facing context;
- `SourceReference` for provenance;
- deterministic relationship-health DTOs for participant and company signals.

Legacy `IntroductionSuggestion` records and source references remain in the
schema but are filtered out of user-facing meeting prep output.

No prep brief rows are persisted. The service does not create source
references, mutate statuses, write audit logs, call AI providers, or sync from
Outlook/Teams.

## Step 11A-1 voice transcription backend

Step 11A-1 does not add a migration. The existing `VoiceNote` table stores
transcribed voice-note records created by the backend transcription endpoint.
The endpoint validates optional person, company, meeting, and note context
against the active tenant before persistence. Raw audio is processed only in the
request/provider call path and is not retained by default.

`VoiceMention` remains readiness-only in this step. Mention extraction,
transcript structuring, AI proposals, and automatic record updates remain out of
scope.

Step 11A-2 also does not add a migration. The existing `VoiceNote` table backs
the review UI: users may set `title`, `editedTranscriptText`, source context
ids, `status=REVIEWED`, and `archivedAt` through tenant-aware services. Raw
audio is still not stored, and the review workflow does not create
`VoiceMention`, `AIProposal`, or `AIProposalItem` records.

Step 11B also does not add a migration. Voice transcript structuring creates
`AIProposal` rows with `proposalType=VOICE_NOTE_EXTRACTION` and
`sourceVoiceNoteId`, plus one or more review-only `AIProposalItem` rows. The
stored `proposedPatch` values are strict schema-validated proposal payloads
only. No target business records are created or updated, `VoiceNote.status` is
not changed just because a proposal exists, and `VoiceMention` remains
uncreated in this step.

Step 12A does not add a migration. Microsoft Graph readiness uses a disabled
provider by default and does not store live tokens, connection rows, calendar
events, email messages, or contacts. A future live integration should use a
dedicated tenant- and user-scoped `IntegrationConnection` or
`MicrosoftIntegrationAccount` model rather than reusing Auth.js `Account`
tokens for sync semantics. That future model should store provider, external
account id, approved scopes, connection status, timestamps, and encrypted token
material only after a disconnect/revoke flow and token encryption strategy are
implemented.

Step 12B adds optional `Person.linkedinUrl` and
`Person.salesNavigatorUrl` fields plus `RecordSourceType.LINKEDIN_USER_PROVIDED`
for notes. URL validation is pure parsing: HTTPS LinkedIn profile URLs must use
person-profile-like `/in/...` paths, and Sales Navigator URLs must use
LinkedIn `/sales/...` paths. Validation does not fetch URLs, confirm ownership,
scrape metadata, or call LinkedIn.

Manual LinkedIn notes are ordinary tenant-owned `Note` records with
`sourceType = LINKEDIN_USER_PROVIDED` and optional person/company links.
LinkedIn URL values are not represented as `SourceReference` rows in this step.
No company LinkedIn fields, LinkedIn provider models, OAuth tokens, scraping
state, browser automation state, sync jobs, or enrichment records are added.

Step 13A uses the existing `Tenant`, `Membership`, `Role`, and
`MembershipStatus` models for workspace admin. It does not add a migration.
Workspace name updates write to `Tenant.name`. Member role updates resolve
existing `Role.key` values (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`) server-side.
Membership deactivation/reactivation updates `Membership.status` and never
hard-deletes the membership row. Billing, Stripe customer/subscription fields,
feature-flag tables, invite models, and entitlement models are not added in
Step 13A.

Step 13B does not add a billing migration. Billing readiness is represented by
non-persisted provider DTOs only. A future live billing step should use a
dedicated tenant-scoped billing profile model, for example a
`TenantBillingProfile` linked to `Tenant` with provider, status, external
customer/subscription IDs, and period metadata. Future billing models must not
store card data, payment method details, invoice payloads, tax payloads, or raw
Stripe/provider payloads.

Step 14B does not add a migration. Data exports are computed at request time
from existing tenant-scoped records. Personal export is defined as the current
user's contribution inside the active workspace and relies on existing
`createdByUserId` / audit actor fields where available. Workspace export uses
existing tenant-owned tables. Export request audit events are written to the
existing `AuditLog` table with safe counts and truncation metadata only.

Exports intentionally do not read Auth.js `Account`, `Session`, or
`VerificationToken` token data. `VoiceNote.audioStorageKey` is excluded; only
retention and audio metadata are exported.

Step 14C does not add a migration. Archive management uses existing
`archivedAt` fields on people, companies, company affiliations, meetings, notes,
tasks, commitments, needs, capabilities, legacy internal introduction suggestion
records, AI proposals, and voice notes. Restore clears `archivedAt` and updates
`updatedByUserId` where the model has that field.

Restoring a `Person` whose stored `relationshipStatus` is `ARCHIVED` maps the
status to `UNKNOWN` because the previous relationship status is not stored. No
previous-status field is added in Step 14C.

Step 15B-1 does not add a migration. The `/search` page uses read-time
structured keyword queries over existing tenant-owned records. It does not add
pgvector, embeddings, semantic documents, background indexing, AI search, or
external lookup tables.

Step 15B-2 does not add a migration. The V1 review demo seed is data-only and
uses existing models. It creates deterministic synthetic records across the
implemented product surfaces, including archived examples and safe audit events,
so reviewers can exercise export, governance, archive, proposal, voice, and
relationship workflows locally. It does not introduce new tables, indexes,
provider payload fields, semantic-search tables, billing tables, token storage,
or permanent-deletion state.

Future tenant-owned tables must include `tenantId` and be protected by service
and repository-layer tenant checks.

Where practical, tenant-scoped parent models expose `@@unique([id, tenantId])`
so children can use composite foreign keys such as `(personId, tenantId)` or
`(meetingId, tenantId)`. This adds database-level protection in addition to
service-layer tenant validation.

Polymorphic fields such as proposal targets and voice mention resolutions cannot
be represented as direct foreign keys, so services validate that type and id are
provided together and that the referenced entity exists in the same tenant.
