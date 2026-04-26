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
ledger without changing the schema. Step 9 uses the existing `AIProposal` and
`AIProposalItem` models for status-only human review without changing the
schema. Step 10A-1 uses the existing `Need` and `Capability` models for manual
relationship-intelligence workflows without changing the schema. Step 10A-2
uses the existing `IntroductionSuggestion` model for manual introduction
tracking without changing the schema.

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

- `Person`: tenant-owned relationship record. Email is optional and indexed by
  tenant, not globally unique.
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
  meeting, note, commitment, and introduction suggestion links.
- `Commitment`: tenant-owned promise/obligation ledger, distinct from generic
  tasks, with owner/counterparty person or company links.
- `Need`: tenant-owned problem, requirement, request, opportunity, or interest.
- `Capability`: tenant-owned expertise, access, asset, experience, or solution
  potential.
- `IntroductionSuggestion`: tenant-owned relationship brokerage suggestion that
  can link a need, capability, people, and companies.

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

## Step 6A people and company workflow

Step 6A uses the existing `Person` and `Company` schema without a migration.
People can be created, edited, and archived with display name, contact details,
title/role, relationship status, and relationship temperature. Companies can be
created, edited, and archived with name, website, industry, and description.

Archived people and companies are hidden from active lists and detail reads by
repository filters. Historical relationship context remains intact.

The current schema does not include a LinkedIn URL field, so Step 6A does not
store LinkedIn URLs.

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

## Step 9 AI proposal confirmation

Step 9 promotes existing `AIProposal` and `AIProposalItem` readiness records
into a status-only human review workflow. It does not add a migration.

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

## Step 10A opportunities workflows

Step 10A-1 promotes the existing `Need` and `Capability` models from
readiness into manual workflows. It does not add a migration.

Needs remain tenant-scoped and can link directly to:

- `Person`
- `Company`
- `Meeting`
- `Note`

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

Step 10A-2 promotes the existing `IntroductionSuggestion` model from readiness
into a manual workflow. It does not add a migration. Introduction suggestions
remain tenant-scoped and can link directly to:

- `Need`
- `Capability`
- from/to `Person`
- from/to `Company`

There are no direct meeting or note foreign keys on `IntroductionSuggestion`,
so meeting/note provenance is recorded with tenant-validated
`SourceReference` rows such as `MEETING -> INTRODUCTION_SUGGESTION` or
`NOTE -> INTRODUCTION_SUGGESTION`. Dismissal maps to the existing `REJECTED`
status. Archiving sets `archivedAt` and never hard-deletes the record.

Step 10A does not add automated matching, scoring, AI generation, semantic
search, embeddings, message drafting, outreach sending, or background jobs.

Future tenant-owned tables must include `tenantId` and be protected by service
and repository-layer tenant checks.

Where practical, tenant-scoped parent models expose `@@unique([id, tenantId])`
so children can use composite foreign keys such as `(personId, tenantId)` or
`(meetingId, tenantId)`. This adds database-level protection in addition to
service-layer tenant validation.

Polymorphic fields such as proposal targets and voice mention resolutions cannot
be represented as direct foreign keys, so services validate that type and id are
provided together and that the referenced entity exists in the same tenant.
