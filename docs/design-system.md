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
- Mobile-first record forms with compact labels, clear validation messages, and
  explicit save/cancel actions.
- Inline archive confirmation for reversible archive actions.

Cards use compact spacing and small-radius borders. Badges are used for status,
sensitivity, relationship temperature, and readiness labels. Empty states should
state the current condition without implying that a workflow exists.

## Current Limits

This design-system step does not add CRUD screens, capture workflows, AI
proposal review, voice recording, transcription, semantic search, matching,
notifications, analytics, or provider integrations.

Step 6A extends the primitives for people/company record management only. It
does not add LinkedIn URL fields, AI enrichment, voice capture, semantic search,
or matching flows.

Step 6B extends the same mobile-first patterns for affiliations:

- compact affiliation cards instead of tables;
- full-page mobile forms for create/edit;
- inline confirmation controls for end/archive actions;
- short read-only related meeting/note sections;
- badges for primary, ended, and sensitivity states.

The related context sections should stay brief on mobile and must not imply
that meeting capture, note creation, AI summarisation, or semantic search exists
yet.

Step 7A extends the patterns for meetings:

- meeting list cards instead of tables;
- full-page mobile forms for create/edit and participant add;
- compact participant cards/chips with inline remove confirmation;
- source badges for `MANUAL` and `TEAMS_COPILOT_PASTE`;
- short note-count displays without note creation UI.

Meeting screens should preserve bottom-nav spacing, keep archive/remove
confirmations inline, and avoid implying that AI extraction, transcription,
Teams import, or automated note import exists.

Step 7B extends the same mobile-first patterns for notes and pasted capture:

- full-page note and pasted-capture forms;
- large textareas for manual notes and pasted Teams/Copilot text;
- compact note cards with source, type, and sensitivity badges;
- inline archive confirmation for notes;
- linked-note sections on meeting detail;
- short note previews on person/company related context.

Note and pasted-capture screens should make source and sensitivity visible while
avoiding wide tables, AI-processing affordances, voice controls, import
controls, or autonomous extraction language.

Step 8A extends the same patterns for manual follow-up tasks:

- compact task cards instead of tables;
- full-page mobile forms for create/edit;
- due, overdue, priority, and task-type badges;
- linked-context badges for people, companies, meetings, notes, commitments,
  and introduction suggestions;
- inline confirmation controls for complete/reopen/archive lifecycle actions;
- Today sections for overdue, due-today, upcoming, and recently completed
  tasks.

Task screens should preserve bottom-nav spacing, keep lifecycle actions clear,
and avoid notification, background-job, AI recommendation, or automatic
extraction affordances.

Step 8B extends the same patterns for the manual commitment ledger:

- compact commitment cards instead of tables;
- full-page mobile forms for create/edit;
- due, overdue, status, owner, counterparty, and sensitivity badges;
- linked-context badges for people, companies, meetings, and notes;
- read-only linked task displays where an existing task references the
  commitment;
- inline confirmation controls for fulfil/cancel/archive lifecycle actions;
- Today sections for overdue, due-today, upcoming, waiting, and recently
  fulfilled commitments.

Commitment screens should keep tasks distinct from commitments and avoid
automatic task creation, reminder-delivery, background-job, AI extraction, or
autonomous workflow affordances.

Step 9 extends the same patterns for AI proposal confirmation:

- compact proposal inbox cards instead of tables;
- proposal item cards with status, action type, confidence, source, and target
  context;
- readable proposed patch previews that mask sensitive-looking values and
  truncate long text;
- inline confirmation controls for approve, reject, needs-clarification,
  approve-all, reject-all, and dismiss actions;
- clear copy that approval is status-only and does not apply changes.

Proposal screens should avoid provider, generation, extraction, notification,
or background-job affordances. They review existing stored proposal records
only.

Step 10A-1 extends the same patterns for manual needs and capabilities:

- opportunity hub cards for counts and latest manual records;
- compact need and capability cards instead of tables;
- full-page mobile forms for create/edit;
- status, priority, sensitivity, confidence, and context badges;
- source/provenance sections where source references already exist;
- inline archive confirmation controls.

Need and capability screens should keep brokerage readiness manual and avoid
introduction-workflow, matching, scoring, AI generation, semantic-search,
embedding, notification, or background-job affordances.
