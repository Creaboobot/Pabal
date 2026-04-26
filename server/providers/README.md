# Providers

Provider adapters for AI, speech-to-text, storage, jobs, email, billing,
telemetry, and Microsoft Graph live under this root when those stages are
implemented.

Step 11A-1 adds the first speech-to-text provider boundary:

- `speech-to-text/types.ts`: provider contract and safe provider errors.
- `speech-to-text/openai.ts`: OpenAI audio-to-text transcription adapter using
  direct `fetch`.
- `speech-to-text/mock.ts`: deterministic local/test provider.
- `speech-to-text/index.ts`: provider factory.

Application services call only the provider interface. Raw provider response
shapes, provider payloads, and secrets must not leak into services, UI, audit
logs, or persisted records.

Step 12A adds Microsoft Graph readiness only:

- `microsoft-graph/types.ts`: normalized app-level calendar, mail, contact,
  and connection-status DTOs.
- `microsoft-graph/disabled.ts`: default provider that reports disconnected
  readiness state and rejects data retrieval.
- `microsoft-graph/mock.ts`: deterministic local/test provider, rejected in
  production by the factory.
- `microsoft-graph/index.ts`: provider factory.

No provider in Step 12A calls live Microsoft Graph services, starts OAuth,
stores tokens, syncs data, or ingests calendar, email, or contact records.
