# ADR-006: OpenAI as Default V1 AI Provider

## Status

Accepted.

## Decision

OpenAI will be the default V1 provider for:

- speech-to-text transcription;
- transcript cleanup;
- structured extraction;
- AI proposals;
- meeting preparation;
- relationship brokerage suggestions;
- semantic summarisation.

However, OpenAI-specific logic must be isolated in provider adapters.

## Rationale

Using one AI provider for V1 reduces implementation complexity and improves development velocity. Provider abstraction preserves future optionality for Azure, private models, or customer-specific deployments.

## Consequences

- Core product logic must not depend on OpenAI-specific response shapes.
- Prompts and schemas must be versioned and tested.
- AI output must remain structured, explainable, source-linked, and user-confirmed before mutation.
