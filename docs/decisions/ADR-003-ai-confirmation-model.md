# ADR-003: AI Confirmation Model

## Status

Accepted.

## Decision

AI may propose record changes, but must never apply changes to core records without explicit user confirmation.

Every applied AI-assisted change must be:

- source-linked;
- audit-logged;
- explainable to the user;
- reversible where practical.

## Rationale

Pobal manages sensitive relationship intelligence. Trust requires that the user remains in control of all record mutations.

## Consequences

- AI outputs must use structured schemas.
- Ambiguous entity matches must trigger clarification.
- Low-confidence proposals must not be silently applied.
- Review UI is a core product component, not an optional layer.
