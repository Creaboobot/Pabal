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
