# V1 Review Walkthrough

This walkthrough uses the deterministic demo workspace created with
`SEED_DEMO_DATA=true pnpm prisma:seed`. The data is synthetic and idempotent.
It does not call external providers or include real personal/customer data.

CI also runs a signed-in mobile Playwright smoke suite against this demo shape.
For local browser smoke checks, seed the demo workspace and run `pnpm test:e2e`;
the suite uses development auth only in non-production test environments.

## 1. Sign In

Open `/sign-in`.

- Local review: set `ENABLE_DEV_AUTH=true` and use the development sign-in
  option.
- Microsoft Entra sign-in appears only when the current Auth.js setup is fully
  configured for it.
- Build and review do not require Microsoft OAuth credentials.

## 2. Today

Open `/today`.

Review:

- overdue/upcoming manual tasks;
- commitments by due state;
- proposal review attention;
- deterministic relationship attention with source-linked reasons.

Boundary: no notifications, reminder delivery, background jobs, AI
recommendations, or persisted relationship scores.

## 3. Search

Open `/search` and try keywords such as `Anna`, `Sofia`, `governance`,
`voice`, or `Harbor`.

Review:

- tenant-scoped keyword results;
- grouped record cards;
- links to existing detail pages.

Boundary: structured keyword lookup only. No semantic search, pgvector,
embeddings, AI ranking, external lookup, or background indexing.

## 4. People, Companies, And Affiliations

Open `/people`, `/people/companies`, and person/company detail pages for Anna,
Sofia, Nordic Industrials, HelioGrid, or Harbor Logistics.

Review:

- mobile-first people/company cards;
- person-company affiliations;
- LinkedIn and Sales Navigator URLs where present;
- related notes and meetings;
- relationship health cards.

Boundary: LinkedIn is manual user-provided context only. Pabal does not fetch,
preview, scrape, automate, or call LinkedIn/Sales Navigator.

## 5. Meetings And Notes

Open `/meetings`, a meeting detail page, and `/notes`.

Review:

- manual meeting detail and participants;
- snapshot-only participant handling in the grid briefing;
- recent notes index;
- source/sensitivity badges;
- pasted Teams/Copilot note source on the PLM governance meeting.

Use `/capture/meeting` to inspect the manual pasted-note capture flow.

Boundary: pasted text is stored as user-provided note content. There is no
Teams import, Microsoft Graph sync, AI extraction, or automatic task/commitment
creation.

## 6. Tasks And Commitments

Open `/tasks` and `/commitments`.

Review:

- due/overdue and status grouping;
- linked people, companies, meetings, and notes;
- manual lifecycle actions such as complete/reopen/fulfil/cancel/archive.

Boundary: no reminder delivery, notifications, recurring tasks, automatic
parsing, or background jobs.

## 7. Opportunities

Open `/opportunities`, then needs, capabilities, and introductions.

Review:

- active needs such as PLM governance RACI and grid enablement examples;
- capabilities such as governance mapping and responsible AI advice;
- introduction suggestions connecting needs to capabilities.

Boundary: opportunities are manual records. There is no automated matching,
scoring, outreach drafting, message sending, semantic search, or embeddings.

## 8. AI Proposal Review

Open `/proposals` and a proposal detail page.

Review:

- source context;
- proposal item status controls;
- proposed patch preview;
- needs-clarification items.

Boundary: proposal approval is status-only. There is no proposal application
engine, automatic record mutation, automatic outreach, or background job.

## 9. Voice Notes

Open `/voice-notes` and a voice note detail page.

Review:

- transcript and reviewed transcript display;
- source context chips;
- retention metadata showing raw audio is not retained by default;
- "Create proposal from transcript" confirmation flow if provider config is
  available or mocked.

Boundary: raw audio is not stored. Voice capture/transcription and transcript
structuring do not update business records automatically.

## 10. Meeting Prep Brief

Open a meeting detail page and choose `View prep brief`, or visit
`/meetings/[meetingId]/prep`.

Review:

- meeting overview;
- participant and company context;
- recent interactions;
- linked notes, tasks, commitments, needs, capabilities, introductions, and
  pending proposals;
- relationship health signals and source links.

Boundary: deterministic, read-only, source-linked, and not AI-generated.

## 11. Settings And Admin

Open `/settings`.

Review:

- `/settings/workspace` for workspace details;
- `/settings/members` for member cards and role/status controls;
- `/settings/features` for read-only feature readiness;
- `/settings/integrations` for Microsoft readiness and LinkedIn manual-only
  copy;
- `/settings/billing` for billing readiness.

Boundary: no invites, complex RBAC matrix, live Microsoft OAuth/sync, live
LinkedIn integration, live Stripe checkout, billing portal, webhooks, pricing,
plan enforcement, quotas, or payment collection.

## 12. Governance, Privacy, And Archive

Open `/settings/governance`, `/settings/privacy`, and `/settings/archive`.

Review:

- tenant-scoped audit log viewer with sanitized metadata;
- personal/workspace JSON exports;
- archive browser by record type;
- restore controls for supported archived records;
- read-only VoiceNote retention information.

Boundary: archive is reversible where supported and is not permanent deletion.
There is no account deletion, tenant deletion, purge job, retention automation,
raw audit metadata download, SIEM export, or legal/GDPR automation.

## Current V1 Limits

V1 deliberately does not include:

- semantic search, pgvector, embeddings, AI search, or external search;
- no proposal application engine or automatic target-record mutation;
- no live Microsoft Graph sync, email/calendar/contact ingestion, or Teams import;
- no live LinkedIn integration, scraping, monitoring, browser automation, or Sales
  Navigator sync;
- no live Stripe checkout, billing portal, webhooks, payment collection, or plan
  enforcement;
- no permanent deletion, retention jobs, account/tenant erasure automation, or
  legal advice;
- notifications, reminder delivery, recurring tasks, background jobs, automatic
  outreach, or message sending.
