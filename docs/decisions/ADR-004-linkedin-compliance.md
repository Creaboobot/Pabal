# ADR-004: LinkedIn Compliance

## Status

Accepted.

## Decision

Pobal V1 will support only manual, user-provided LinkedIn enrichment.

Allowed:

- storing LinkedIn profile URLs;
- storing Sales Navigator URLs manually added by the user;
- allowing the user to paste selected LinkedIn text;
- AI summarisation of user-provided LinkedIn text;
- creating reminders to review LinkedIn manually.

Prohibited:

- scraping;
- browser automation;
- headless navigation;
- automated profile visits;
- background monitoring;
- automated LinkedIn messages, comments, likes, or connection requests;
- third-party scraped LinkedIn enrichment unless legally and contractually verified.

## Rationale

LinkedIn restrictions make scraping and automation unsuitable as a product foundation.

## Consequences

- LinkedIn must not be treated as an automated data source in V1.
- The app must source-label LinkedIn-derived notes as user-provided.
