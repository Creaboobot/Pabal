# Repositories

Database repositories live here. Tenant-aware repository methods must require
explicit user and tenant context and must not trust caller-provided tenant ids
without service-layer membership checks.

This stage includes auth, tenancy, and Step 4A relationship backbone
repositories for people, companies, affiliations, meetings, participants, notes,
and source references.

Repositories for tasks, commitments, AI proposals, billing, integrations,
search, and voice capture are intentionally not implemented yet.
