# AI Contracts

AI execution is out of scope for the foundation and Step 4A relationship
backbone.

Future AI work must follow the build brief and ADR-003:

- AI may propose record changes only.
- Applied AI-assisted changes must be source-linked and audit-logged.
- Provider-specific logic must live behind server-side provider adapters.
- Strict schemas and tests are required before AI output can affect state.

Step 4A adds only source-linking primitives that future AI proposals can use for
traceability. It does not add `AIProposal`, AI provider calls, prompt logic,
approval UI, or mutation application logic.
