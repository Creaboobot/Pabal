# V1 Release Readiness

Status: green - ready for human V1 review.

This report records the Step 15C release-readiness pass after the V1 demo data,
documentation refresh, and signed-in Playwright smoke coverage were merged.

## Scope Reviewed

- V1 review walkthrough route references and flow order.
- Primary navigation and settings navigation.
- Deterministic demo seed coverage for review flows.
- CI workflow and Playwright smoke route coverage.
- Current implementation docs and stated V1 boundaries.
- Security and privacy boundaries for auth, providers, exports, governance, and
  archive controls.

## Route And Navigation Findings

- Primary navigation points to active V1 routes: Today, Capture, People,
  Opportunities, and Search.
- Settings links cover workspace, members, features, integrations, billing,
  governance, privacy, and archive controls.
- The V1 walkthrough routes are represented by existing app routes, including
  notes, voice notes, meeting preparation, proposal review, privacy export, and
  archive controls.
- Owner/admin-only settings surfaces are role-gated and use admin-required copy
  rather than future-placeholder copy.

## Demo Data Findings

- `SEED_DEMO_DATA=true` creates deterministic, synthetic review data for the
  demo workspace.
- The demo story covers people, companies, affiliations, meetings, notes,
  Teams/Copilot-style pasted notes, LinkedIn user-provided notes, tasks,
  commitments, opportunities, needs, capabilities, legacy internal introduction
  suggestion rows, AI proposals, voice notes, source references, archived
  records, and audit events.
- Demo data is scoped to the active demo tenant and does not depend on external
  services.

## CI And Smoke Findings

- CI includes lint, typecheck, unit/integration tests, Prisma validation,
  migration/seed checks, build, Playwright smoke, Docker build, Compose config,
  and PostgreSQL health.
- The signed-in Playwright smoke suite uses development auth in test only,
  deterministic demo data, and disabled/mock providers.
- Smoke coverage focuses on review-critical routes plus stable seeded deep
  routes for person, company, meeting prep, and proposal detail.

## Security And Privacy Findings

- Development auth remains blocked in production.
- Mock providers remain blocked in production where provider factories support
  mock mode.
- Microsoft Graph, LinkedIn, and billing surfaces are readiness/manual-only and
  do not perform live external calls.
- Data exports are tenant-scoped and audit export requests without logging
  exported content.
- Governance and export audit metadata display/export paths use defensive
  sanitization.
- Archive controls restore supported records but do not implement permanent
  deletion, retention jobs, audit deletion, or legal automation.

## Current V1 Boundaries

V1 deliberately does not include:

- semantic search, pgvector, or embeddings;
- live Microsoft Graph sync;
- LinkedIn scraping, automation, OAuth, or API integration;
- live Stripe checkout, billing portal, or webhooks;
- an AI proposal application engine;
- automatic outreach or message sending;
- background sync, reminder delivery, retention, or notification jobs;
- recurring tasks;
- team invite flows;
- permanent deletion or automated GDPR/legal workflows.

## Recommendation

Pabal is ready for human V1 review and local/demo deployment.

Remaining limitations are intentional V1 boundaries and should stay out of
release-readiness hardening unless separately approved.
