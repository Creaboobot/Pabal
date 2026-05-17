# Services

Application services will live here and will orchestrate modules, repositories,
and provider interfaces.

This stage includes foundational auth, tenant, role, session, audit, Step 4A
relationship backbone services, and Step 4B-1 action/intelligence-readiness
services, plus Step 4B-2 AI proposal and voice-note-readiness services. Step 5
adds a read-only app-shell summary service for tenant-scoped counts used by the
authenticated shell. Step 6B adds affiliation services for
create/edit/end/archive flows and read-only related-context services for latest
tenant-scoped meetings and notes. Step 7A promotes meetings into manual
create/edit/archive and participant add/remove services.

Services enforce tenant access before calling repositories. They are the right
place for membership checks, role checks, cross-tenant relation validation,
source-reference validation, polymorphic target validation, and audit logging
decisions.

Step 4B-2 services validate direct and polymorphic links, but they do not call
AI providers, transcribe audio, upload audio, apply proposal patches, mutate
targets, or implement review UI. Current V1 services now include manual
workflows, voice processing, proposal review, governance, exports,
archive/restore, and structured keyword search while still excluding automatic
matching, semantic search, background jobs, and proposal application.

The app-shell summary service is read-only. It must not create records, apply
AI proposals, start capture workflows, or run search/matching logic.

The structured-search service is read-only. It requires explicit tenant
context, filters active records by tenant, and returns keyword result DTOs. It
does not call AI providers, use embeddings or pgvector, perform external
lookup, create background indexes, or mutate records.

Affiliation services own the transaction that keeps a person's primary company
link deterministic: setting one active affiliation as primary unsets other
active primary affiliations for that person in the same tenant. Ending or
archiving an affiliation clears its primary flag and writes a minimal audit log.

Meeting services validate tenant-owned meeting, person, and company links before
mutating records. Participant removal writes `meeting_participant.removed` and
then hard-deletes only the `MeetingParticipant` association.

Note services validate tenant-owned person, company, and meeting links before
mutating records. Pasted-capture services create the meeting, linked note,
optional manually selected participants, source reference, and safe audit logs
in one transaction. They do not parse pasted text, call AI providers, create
proposals, or extract tasks/commitments/needs/capabilities.

Task services validate tenant-owned person, company, meeting, note, commitment,
and legacy internal introduction suggestion links before mutating records. They
own manual task create/update/complete/reopen/archive lifecycle changes, write
safe audit logs, and derive Today task sections from `dueAt` at read time. They
do not send reminders, run background jobs, create tasks automatically, call AI
providers, or implement the commitment-ledger workflow.

Commitment services validate tenant-owned owner/counterparty people and
companies plus meeting/note links before mutating records. They own manual
commitment create/update/fulfil/cancel/archive lifecycle changes, write safe
audit logs, and derive Today commitment sections from `dueAt` or due-window
boundaries at read time. They do not create tasks automatically, send
reminders, run background jobs, parse notes, extract commitments, or call AI
providers.

Relationship-health services are read-only. They compute deterministic
relationship signals and why-now reasons from existing tenant-scoped records,
require explicit tenant context, and do not persist scores, mutate records,
write audit logs, call AI providers, send notifications, or run background
jobs.

Voice transcription services validate tenant-owned source context and audio
metadata, call the speech-to-text provider interface, persist a transcribed
`VoiceNote`, and write safe audit metadata. Voice-note review services update
only tenant-owned title, reviewed transcript text, source links, status, and
archive metadata. They do not store raw audio, persist provider responses,
create `VoiceMention` or `AIProposal` records, structure transcripts, mutate
relationship records, or re-transcribe audio.
