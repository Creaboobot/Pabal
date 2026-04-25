# Services

Application services will live here and will orchestrate modules, repositories,
and provider interfaces.

This stage includes foundational auth, tenant, role, session, audit, Step 4A
relationship backbone services, and Step 4B-1 action/intelligence-readiness
services, plus Step 4B-2 AI proposal and voice-note-readiness services. Step 5
adds a read-only app-shell summary service for tenant-scoped counts used by the
authenticated shell placeholders. Step 6B adds affiliation services for
create/edit/end/archive flows and read-only related-context services for latest
tenant-scoped meetings and notes. Step 7A promotes meetings into manual
create/edit/archive and participant add/remove services.

Services enforce tenant access before calling repositories. They are the right
place for membership checks, role checks, cross-tenant relation validation,
source-reference validation, polymorphic target validation, and audit logging
decisions.

Step 4B-2 services validate direct and polymorphic links, but they do not call
AI providers, transcribe audio, upload audio, apply proposal patches, mutate
targets, or implement review UI. Product workflows, matching algorithms, AI
execution, and voice processing are intentionally not implemented yet.

The app-shell summary service is read-only. It must not create records, apply
AI proposals, start capture workflows, or run search/matching logic.

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
