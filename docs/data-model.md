# Data Model

The foundation scaffold includes only the Prisma datasource and client
generator.

No business models are defined yet. Do not add `Person`, `Company`, `Tenant`,
`User`, `AIProposal`, `VoiceNote`, or other product tables until the relevant
build stage.

Future tenant-owned tables must include `tenantId` and be protected by service
and repository-layer tenant checks.
