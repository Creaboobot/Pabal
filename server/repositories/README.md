# Repositories

Database repositories live here. Tenant-aware repository methods must require
explicit user and tenant context and must not trust caller-provided tenant ids
without service-layer membership checks.

This stage includes auth, tenancy, Step 4A relationship backbone repositories,
and Step 4B-1 repositories for tasks, commitments, needs, capabilities, and
introduction suggestions.

Repositories for AI proposals, billing, integrations, search, voice capture,
notifications, background jobs, and embeddings are intentionally not
implemented yet.
