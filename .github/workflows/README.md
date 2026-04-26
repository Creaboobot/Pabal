# GitHub Actions Workflows

The CI workflow runs the current V1 quality gates:

- install dependencies;
- Prisma generation and validation;
- migrations and deterministic seed data;
- lint;
- typecheck;
- unit and integration tests;
- production build;
- signed-in mobile Playwright smoke tests with deterministic demo data;
- Docker build;
- Docker Compose config;
- Docker Compose PostgreSQL health verification.

The Playwright job uses development auth only in the CI/test environment and
seeds synthetic V1 review data before running browser checks. It does not
require production OAuth, OpenAI, Microsoft Graph, LinkedIn, Stripe, or other
external provider credentials.
