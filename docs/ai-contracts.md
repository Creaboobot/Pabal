# AI Contracts

AI execution remains out of scope for the current implementation. Step 9 adds a
status-only proposal confirmation framework for existing stored
`AIProposal`/`AIProposalItem` records, but it does not call AI providers,
generate proposals, or apply proposed patches.

Future AI work must follow the build brief and ADR-003:

- AI may propose record changes only.
- Applied AI-assisted changes must be source-linked and audit-logged.
- Provider-specific logic must live behind server-side provider adapters.
- Strict schemas and tests are required before AI output can affect state.

## Step 9 Review Contract

- Review operates only on existing `AIProposal` and `AIProposalItem` records.
- Approving an item means the user accepted it as conceptually valid.
- Approval does not apply the proposed patch.
- Proposal review actions must never mutate Person, Company, Meeting, Note,
  Task, Commitment, Need, Capability, IntroductionSuggestion, VoiceNote, or
  VoiceMention records.
- Proposed patch JSON can be displayed after masking/truncation, but is not
  editable in this step and is never written to audit metadata.
- Audit logs record status transitions and safe ids only.

The proposal application engine, provider adapters, prompt contracts, schema
versioning, extraction jobs, and generated proposal creation belong to later
explicit steps.

## Step 10A Boundary

Manual needs, capabilities, and introduction suggestions are not AI-generated
in Step 10A. Creating or editing these records never invokes an AI provider,
computes matches, generates recommendations, drafts messages, sends outreach,
or mutates records from model output. Future AI-assisted brokerage must create
reviewable, source-linked proposals before any user-approved application step
exists.

## Step 10B-1 Relationship Health Boundary

Relationship health and why-now reasons in Step 10B-1 are deterministic and
read-only. They are computed from existing tenant-scoped records such as tasks,
commitments, meetings, notes, needs, capabilities, introductions, and proposal
review records. They do not invoke AI providers, generate recommendations,
apply proposal patches, mutate target records, run embeddings/search, or create
background jobs. Future AI-assisted reasoning must remain proposal-based and
human-confirmed before any state mutation exists.

## Step 10C Meeting Prep Boundary

Meeting prep briefs in Step 10C are deterministic and read-only. They aggregate
existing tenant-scoped records and relationship-health signals for an existing
meeting, but they do not invoke AI providers, generate summaries, perform
semantic search, apply proposal patches, mutate target records, create tasks or
commitments, sync Outlook/Teams, or save generated brief records. Future
AI-generated meeting preparation must remain an explicit proposal-based,
human-confirmed workflow.

## Step 11A-1 Voice Transcription Boundary

Voice transcription in Step 11A-1 is limited to audio-to-text through a
server-side speech-to-text provider interface. OpenAI may be used only by the
OpenAI transcription adapter. The transcription endpoint stores the resulting
`VoiceNote` transcript and safe audio metadata, but it does not call chat or
completion APIs, structure the transcript, extract entities, create
`VoiceMention` records, create `AIProposal` records, mutate target records,
summarise, search, or run background jobs.

Raw audio is not retained by default, and raw provider responses are not stored
or written to audit logs.

## Step 11A-2 Voice Review Boundary

Voice capture and transcript review in Step 11A-2 remain transcription-only.
The browser UI records audio with MediaRecorder and submits it to the existing
transcription endpoint. VoiceNote detail/edit screens can review transcript
text, save edited transcript text, update direct source links, and archive the
VoiceNote. They do not structure transcripts, extract entities, create
`VoiceMention`, `AIProposal`, or `AIProposalItem` records, mutate linked
records, call chat/completion APIs, summarise, search, or run background jobs.

## Step 11B Voice Structuring Boundary

Voice-to-proposal structuring in Step 11B sends the stored transcript or
reviewed transcript to the configured transcript-structuring provider adapter
and creates review-only `AIProposal` and `AIProposalItem` records.

The provider output must pass strict schema validation before any proposal rows
are created. Entity resolution is deterministic and tenant-local: exact
person/company names, person emails, company domains, direct VoiceNote context,
and meeting participant context are the only allowed inputs. Ambiguous or
missing matches become unresolved proposal items or `NEEDS_CLARIFICATION`
items.

Step 11B still does not apply proposals. It does not mutate Person, Company,
Meeting, Note, Task, Commitment, Need, Capability, IntroductionSuggestion,
VoiceNote, or VoiceMention records. It does not create `VoiceMention` records,
perform external search, access LinkedIn/Microsoft/Teams/Outlook, generate
messages, run embeddings, or start background jobs. Approved proposal items
remain conceptual review states until a later explicit application engine
exists.
