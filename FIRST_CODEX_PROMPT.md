# First Prompt to Give Codex

Use this prompt as the first development task after the repository starter files have been uploaded.

---

## Task

Create the initial repository foundation for the Pobal application.

## Context

Before starting, read:

- `/AGENTS.md`
- `/docs/product/network-companion-final-build-brief.md`
- `/docs/development/codex-operating-model.md`
- all ADRs in `/docs/decisions/`

## Scope

Set up only the technical foundation:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui readiness
- Prisma
- PostgreSQL configuration
- Docker Compose for local development
- environment variable validation
- initial folder structure
- GitHub Actions CI skeleton
- README setup instructions
- basic health route/page
- placeholder mobile-first shell

## Do not implement yet

Do not implement:

- authentication;
- billing;
- people/company records;
- meeting notes;
- AI workflows;
- voice capture;
- Microsoft Graph;
- LinkedIn enrichment;
- semantic search;
- production deployment.

## Acceptance criteria

- The app runs locally with documented commands.
- Docker Compose starts local PostgreSQL.
- TypeScript typecheck passes.
- Lint passes.
- Production build passes.
- Prisma validates.
- `.env.example` documents required variables.
- Folder structure reflects the modular monolith target.
- CI workflow runs basic checks.
- No provider-specific business logic is introduced.
- No application feature is built beyond the foundation scope.

## Expected response from Codex

Return:

- implementation summary;
- files changed;
- setup commands;
- tests/checks run;
- risks and assumptions;
- recommended next task.
