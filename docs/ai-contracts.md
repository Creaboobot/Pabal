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
