# ADR-001: Hosting and Migration Strategy

## Status

Accepted.

## Decision

Pobal will initially target a Vercel + Neon deployment path for speed, but must remain migration-ready for Azure from day one.

The application must:

- run as a Docker-compatible Next.js application;
- avoid Vercel-only business logic;
- avoid Neon-specific application dependencies;
- use PostgreSQL-compatible database design;
- keep infrastructure-specific logic in adapters or deployment configuration;
- document all environment variables.

## Rationale

The initial build should optimise for development velocity, but the product roadmap may require Microsoft/Azure enterprise alignment later.

## Consequences

- Local Docker support is mandatory for development and migration validation.
- Azure migration readiness is a non-functional requirement.
- Provider-specific optimisations must not leak into core business logic.
