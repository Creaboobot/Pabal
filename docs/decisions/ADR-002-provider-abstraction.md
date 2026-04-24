# ADR-002: Provider Abstraction

## Status

Accepted.

## Decision

All external services must be accessed through internal provider interfaces.

This applies to:

- AI models;
- speech-to-text;
- embeddings;
- storage;
- notifications;
- background jobs;
- billing;
- Microsoft integrations;
- telemetry/monitoring.

## Rationale

Provider abstraction protects migration readiness, cost control, and enterprise deployment options.

## Consequences

- Product logic must call internal services, not vendor SDKs directly.
- Vendor-specific SDK calls belong in provider adapters.
- Tests should mock provider interfaces.
