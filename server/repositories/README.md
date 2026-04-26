# Repositories

Database repositories live here. Tenant-aware repository methods must require
explicit user and tenant context and must not trust caller-provided tenant ids
without service-layer membership checks.

This stage includes auth, tenancy, Step 4A relationship backbone repositories,
Step 4B-1 repositories for tasks, commitments, needs, capabilities, and
introduction suggestions, Step 4B-2 repositories for AI proposal and voice note
readiness, and Step 6B tenant-scoped affiliation and related-context read
methods. Step 7A adds meeting summary/profile queries, meeting updates, and
participant lookup/delete helpers used by tenant-aware meeting services.
Step 7B adds note profile/update helpers, meeting-linked note summaries, and
source-reference source lookups used by note detail and pasted-capture flows.
Step 8A extends task repositories with context-aware task profiles, list
queries, and update helpers for manual follow-up lifecycle workflows.
Step 8B extends commitment repositories with context-aware commitment profiles,
list queries, update helpers, and linked task display for the manual commitment
ledger. Step 10B-1 adds read-only relationship-health fact queries. These
helpers accept explicit tenant ids and return tenant-scoped records for
deterministic service-layer signal computation only.

Step 11A-1 reuses the existing voice-note repository to persist backend
transcription results as `VoiceNote` records. Raw audio and provider responses
are not stored by repositories.

Step 15B-1 keeps search as a service-level structured keyword read over
existing tenant-scoped repositories/models. There is still no semantic search,
embedding index, background search job, live integration sync, or provider call
inside repository code.
