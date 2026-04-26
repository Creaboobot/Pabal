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

Step 6A extends the primitives for people/company record management only. Step
12B later adds simple manual LinkedIn URL fields to the existing person form;
these are still plain mobile-first inputs with validation messages, not an
embedded or automated LinkedIn experience.

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
- meeting source badges for `MANUAL` and `TEAMS_COPILOT_PASTE`;
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

Step 12B extends note source badges with `LINKEDIN_USER_PROVIDED`. The person
detail LinkedIn card is compact, text-first, and uses safe external links plus
latest user-provided note previews. It must not embed LinkedIn, render automatic
previews, or suggest that pasted LinkedIn context is verified by Pabal.

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

Step 10A extends the same patterns for manual needs, capabilities, and
introduction suggestions:

- opportunity hub cards for counts and latest manual records;
- compact need, capability, and introduction cards instead of tables;
- full-page mobile forms for create/edit;
- status, priority, sensitivity, confidence, and context badges;
- source/provenance sections where source references already exist;
- inline archive confirmation controls.

Need, capability, and introduction screens should keep brokerage readiness
manual and avoid automated matching, scoring, AI generation, message drafting,
outreach sending, semantic-search, embedding, notification, or background-job
affordances.

Step 10B-1 extends the same mobile-first card language for relationship health:

- compact health cards on person and company detail pages;
- deterministic reason rows with severity badges and safe source/context links;
- a short relationship-attention board on Today;
- explicit copy that signals are computed at read time and no score is stored.

Relationship health UI should stay concise on mobile, avoid diagnostic tables,
and must not imply AI reasoning, automatic matching, notifications, or
background jobs.

Step 10C extends those patterns for meeting prep briefs:

- compact overview, participant, company, and record-list cards;
- source, sensitivity, due/overdue, status, and health badges;
- short source-linked previews instead of full pasted notes or raw proposal
  patches;
- explicit copy that the brief is deterministic, read-only, and not
  AI-generated.

Prep briefs should remain bounded on mobile, avoid wide tables, and must not
suggest Outlook/Teams sync, generated summaries, recommendations, or
background processing.

Step 11A-2 extends the same patterns for voice capture and transcript review:

- a large mobile record button with stop, cancel, retry, and progress states;
- clear unsupported-browser and permission-denied messages;
- compact source-context chips;
- transcript review/detail cards with status and retention badges;
- full-page mobile edit form for title, reviewed transcript, and source links;
- explicit privacy copy that raw audio is not retained and no records are
  updated automatically.

Voice UI must avoid tables, re-transcription controls, audio storage controls,
AI extraction affordances, proposal-creation affordances, and generated-summary
language.

Step 13A extends the settings area with mobile-first admin cards:

- settings hub cards for workspace, members, features, integrations, and a
  billing readiness link;
- compact member cards instead of tables;
- role and membership-status badges;
- inline confirmation before role or membership-status changes;
- read-only feature readiness cards.

Step 13B adds the billing readiness page with card-based status, provider,
future subscription, and privacy/payment boundary sections. Billing actions use
disabled buttons with clear "coming later" copy. There are no tables, pricing
pages, payment forms, card fields, checkout widgets, or portal controls.

Step 14A adds governance cards and audit event cards. Audit events must show
action/entity badges, actor fallback text, timestamps, and sanitized key/value
metadata previews. Filters use compact mobile form controls. Do not use wide
tables, raw JSON walls, raw metadata downloads, analytics dashboards, or alert
surfaces for governance in this step.

Step 14B adds privacy and export cards under settings:

- privacy overview cards for tenant scope, personal scope, raw-audio handling,
  and future deletion controls;
- personal and workspace export cards with confirmation before generating a
  JSON download;
- compact included/excluded data cards with badges;
- clear copy that exports may contain sensitive relationship intelligence and
  that deletion/retention controls come later.

Privacy/export UI must stay mobile-first, avoid tables, avoid CSV/ZIP or
external-storage affordances, and avoid presenting product guidance as legal
advice.

Admin UI should make authorization boundaries visible without exposing
cross-tenant data. Invite flows, SCIM/SSO provisioning, entitlement
matrices, quota controls, and analytics dashboards are not represented as
active workflows in this step.
