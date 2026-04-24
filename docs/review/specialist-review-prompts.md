# Specialist Review Prompts for Codex / Review Agents

Use these prompts after Codex creates a pull request.

## Product & UX Review Prompt

Review this PR from the perspective of a mobile-web-first product for consultants. Check whether the flow supports relationship capture, follow-up, commitments, brokerage, and meeting preparation. Identify issues with usability, information hierarchy, mobile constraints, empty states, error states, and AI confirmation. Categorise findings as: must fix, should fix, can defer.

## Architecture & Data Model Review Prompt

Review this PR for architecture, data model quality, modularity, tenancy, Prisma migration safety, indexing, provider abstraction, and Azure migration readiness. Check whether business logic is kept out of UI components and whether vendor-specific code is isolated in adapters. Categorise findings as: must fix, should fix, can defer.

## Security & Privacy Review Prompt

Review this PR for authentication, RBAC, tenant isolation, audit logging, secrets handling, sensitive data exposure, raw audio/transcript retention, GDPR-style export/delete implications, LinkedIn compliance, and AI mutation safety. Categorise findings as: must fix, should fix, can defer.

## QA & Performance Review Prompt

Review this PR for test coverage, integration behaviour, mobile E2E coverage, loading/error states, database query efficiency, retry/failure handling, unnecessary AI calls, and production build reliability. Categorise findings as: must fix, should fix, can defer.

## AI Behaviour Review Prompt

Review this PR for AI output schemas, prompt quality, confidence handling, entity resolution, clarification behaviour, sensitive-context flags, source links, auditability, and the rule that AI must not apply record changes without explicit confirmation. Categorise findings as: must fix, should fix, can defer.

## Alignment Review Prompt

Consolidate the specialist reviews into one decision list. Remove duplicates, resolve contradictions, and group the result into: must fix before merge, should fix before merge, can defer, false positive/no action. Provide a clear final recommendation: approve, approve after fixes, or request changes.
