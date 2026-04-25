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

Repositories for billing, integrations, search, actual voice capture,
transcription, notifications, background jobs, embeddings, and provider-backed
AI execution are intentionally not implemented yet.
