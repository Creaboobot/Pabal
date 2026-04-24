# Codex Instructions for Pobal

This repository contains **Pobal**, a mobile-web-first network companion application for relationship-driven professionals. The product is not a generic CRM and must not drift into one. It must help the user capture relationship intelligence, reason across the network, identify follow-ups, track commitments, and broker valuable introductions.

Before making any code changes, always read:

- `/docs/product/network-companion-final-build-brief.md`
- `/docs/development/codex-operating-model.md`
- the relevant ADRs in `/docs/decisions/`

## Non-negotiable principles

- The product is a **mobile-web-first hosted SaaS web application**.
- Local Docker support is required only for development, testing, CI, and migration readiness.
- The application must remain **Azure-migration-ready** from day one.
- No Vercel-only, Neon-only, OpenAI-only, Azure-only, or provider-specific business logic is allowed outside provider adapters.
- All external services must be accessed through internal provider interfaces.
- AI may propose record changes, but must never apply them without explicit user confirmation.
- Every AI-assisted applied change must be source-linked and audit-logged.
- LinkedIn scraping, browser automation, headless navigation, background monitoring, or automated LinkedIn activity is prohibited.
- Tenant isolation, RBAC, audit logging, privacy controls, and secure secret handling must be preserved.
- Every meaningful change must include tests.
- Every architecture or data-model change must update documentation.
- Pull requests must include implementation summary, tests run, risks, assumptions, and screenshots/video for UI changes where possible.

## Development operating model

- Work in feature branches only.
- Open pull requests for review.
- Do not commit directly to the production branch once the initial repository foundation is in place.
- Keep tasks small and aligned to one build stage.
- Do not implement later-stage features before the required foundation exists.
- Prefer stable, maintainable code over clever abstractions.

## Review priorities

When reviewing or changing code, prioritise in this order:

1. Security, privacy, and tenant isolation
2. Data model correctness and migration safety
3. Mobile-first UX
4. AI confirmation and auditability
5. Azure migration readiness
6. Test coverage
7. Performance and cost control

## Required output from Codex for each implementation task

Codex must return:

- implementation summary;
- changed files;
- tests added/updated;
- commands run;
- risks and assumptions;
- follow-up work;
- screenshots or preview notes for UI changes when available.

## Prohibited shortcuts

Codex must not:

- store secrets in source code;
- bypass tenant isolation;
- put vendor SDK calls in UI components;
- directly mutate records from AI output;
- implement LinkedIn automation;
- skip tests for data model, auth, AI proposal, or voice-processing changes;
- create broad, unreviewable PRs that mix unrelated features.
