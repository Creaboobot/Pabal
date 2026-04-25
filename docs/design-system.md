# Design System

Step 5 establishes the first mobile-first app shell and a small set of reusable
UI patterns. It is intentionally limited to navigation, layout, read-only
summary cards, and common states.

## Shell

- Mobile uses bottom navigation as the primary app control.
- Desktop uses a left sidebar with the same primary navigation.
- The protected shell includes a sticky header, account/settings links, and a
  sign-out control.
- Main content uses semantic landmarks, a skip link, visible focus states, and
  bottom safe-area padding so content does not sit behind the mobile nav.

## Primary Navigation

- Today
- Capture
- People
- Opportunities
- Search

## Primitives

- `AppShell`, `AppHeader`, `MobileBottomNav`, and `DesktopSidebar`
- `PageHeader`
- `CockpitCard`
- `Badge`
- `EmptyState`, `LoadingState`, and `ErrorState`

Cards use compact spacing and small-radius borders. Badges are used for status,
sensitivity, relationship temperature, and readiness labels. Empty states should
state the current condition without implying that a workflow exists.

## Current Limits

This design-system step does not add CRUD screens, capture workflows, AI
proposal review, voice recording, transcription, semantic search, matching,
notifications, analytics, or provider integrations.
