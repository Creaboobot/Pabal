# Data Model

The Step 3 SaaS foundation defines authentication, tenant/workspace,
membership, role, and audit logging tables. Step 4A adds the first
tenant-scoped relationship backbone tables.

## Foundation tables

- `User`, `Account`, `Session`, and `VerificationToken`: standard Auth.js
  Prisma adapter-compatible models.
- `Tenant`: workspace boundary. The default workspace for a user is marked by
  `defaultForUserId`, which is unique so repeated sign-ins do not create
  duplicate default workspaces.
- `Membership`: joins users to tenants and stores the role assignment.
- `Role`: simple foundation roles: `OWNER`, `ADMIN`, `MEMBER`, and `VIEWER`.
- `AuditLog`: tenant-aware audit entries with minimal sanitized JSON metadata.

## Step 4A relationship backbone

- `Person`: tenant-owned relationship record. Email is optional and indexed by
  tenant, not globally unique.
- `Company`: tenant-owned organisation record. Company name is indexed by
  tenant, not unique, because duplicates, subsidiaries, spelling variants, and
  legal suffixes are expected.
- `CompanyAffiliation`: tenant-owned link between a person and a company. The
  schema uses composite tenant-aware foreign keys to prevent cross-tenant
  person/company links.
- `Meeting`: tenant-owned meeting shell with optional primary company.
- `MeetingParticipant`: tenant-owned meeting participant link with
  `participantRole`, avoiding confusion with the SaaS `Role` model.
- `Note`: tenant-owned note that may link directly to person, company, and/or
  meeting context.
- `SourceReference`: controlled polymorphic provenance link between tenant-owned
  records. Services must validate that both source and target belong to the same
  tenant before creating a reference.

Step 4A intentionally does not add `Task`, `Commitment`, `Need`, `Capability`,
`IntroductionSuggestion`, `AIProposal`, `AIProposalItem`, `VoiceNote`,
`VoiceMention`, billing, Microsoft Graph, or LinkedIn enrichment tables. Those
belong to later steps.

Future tenant-owned tables must include `tenantId` and be protected by service
and repository-layer tenant checks.

Where practical, tenant-scoped parent models expose `@@unique([id, tenantId])`
so children can use composite foreign keys such as `(personId, tenantId)` or
`(meetingId, tenantId)`. This adds database-level protection in addition to
service-layer tenant validation.
