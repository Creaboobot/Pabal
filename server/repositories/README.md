# Repositories

Database repositories live here. Tenant-aware repository methods must require
explicit user and tenant context and must not trust caller-provided tenant ids
without service-layer membership checks.

This stage includes only auth and tenancy repositories. Product repositories for
people, companies, meetings, tasks, AI proposals, billing, integrations, and
voice capture are intentionally not implemented yet.
