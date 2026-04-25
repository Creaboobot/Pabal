# Data Model

The Step 3 SaaS foundation defines only authentication, tenant/workspace,
membership, role, and audit logging tables.

## Foundation tables

- `User`, `Account`, `Session`, and `VerificationToken`: standard Auth.js
  Prisma adapter-compatible models.
- `Tenant`: workspace boundary. The default workspace for a user is marked by
  `defaultForUserId`, which is unique so repeated sign-ins do not create
  duplicate default workspaces.
- `Membership`: joins users to tenants and stores the role assignment.
- `Role`: simple foundation roles: `OWNER`, `ADMIN`, `MEMBER`, and `VIEWER`.
- `AuditLog`: tenant-aware audit entries with minimal sanitized JSON metadata.

No business models are defined yet. Do not add `Person`, `Company`, `Meeting`,
`Task`, `Commitment`, `AIProposal`, `VoiceNote`, billing, Microsoft Graph, or
LinkedIn enrichment tables until the relevant build stage.

Future tenant-owned tables must include `tenantId` and be protected by service
and repository-layer tenant checks.
