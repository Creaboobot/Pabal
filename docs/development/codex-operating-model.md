# Codex Operating Model for Pobal

## Purpose

This document defines how Codex should be used to develop Pobal safely and systematically.

## Recommended workflow

```text
User task
  -> Codex build agent creates feature branch and PR
  -> CI checks run
  -> Specialist review prompts are applied
  -> Alignment review consolidates feedback
  -> Codex fixes issues
  -> User reviews preview and PR
  -> Merge only after approval
```

## Agent roles

Use one implementation agent and several review agents.

### 1. Build Agent

Implements the requested task. May write code on a feature branch. Must not merge.

Must produce:

- code changes;
- tests;
- documentation updates where relevant;
- implementation summary;
- risks and assumptions;
- instructions to verify locally.

### 2. Product & UX Review Agent

Checks:

- Does the implementation match the consultant workflow?
- Is the feature mobile-web-first?
- Are empty/loading/error states present?
- Does it avoid becoming a generic CRM table?
- Is user confirmation required for AI-generated record changes?

### 3. Architecture & Data Model Review Agent

Checks:

- Is the implementation modular?
- Are data models clean and indexed?
- Are tenant boundaries respected?
- Is business logic kept outside UI components?
- Are provider abstractions preserved?
- Is Azure migration readiness preserved?

### 4. Security & Privacy Review Agent

Checks:

- Auth and RBAC implications;
- tenant isolation;
- audit logging;
- secrets handling;
- raw audio/transcript retention;
- GDPR-style export/delete implications;
- LinkedIn compliance restrictions;
- AI mutation safety.

### 5. QA & Performance Review Agent

Checks:

- Unit tests;
- integration tests;
- Playwright mobile flows;
- slow-network states;
- database query efficiency;
- background job retry behaviour;
- unnecessary AI calls;
- production build stability.

### 6. AI Behaviour Review Agent

Checks:

- Are AI outputs schema-bound?
- Are proposals explainable?
- Are confidence values used correctly?
- Do ambiguous entity matches trigger clarification?
- Are sensitive details flagged?
- Are records never updated without confirmation?

### 7. Alignment Reviewer

Consolidates specialist feedback into:

- must fix before merge;
- should fix before merge;
- can defer;
- false positive / no action.

## Pull request policy

Every meaningful change should use a PR. The PR should include:

- summary;
- scope;
- screenshots/video for UI changes where possible;
- tests run;
- risks and assumptions;
- notes on migration readiness;
- notes on security/privacy impact.

## Task sizing

Prefer tasks that can be reviewed in one sitting. Avoid asking Codex to implement several unrelated features in a single PR.

## Recommended build stages

1. Repository foundation
2. SaaS foundation
3. Core relationship database
4. AI proposal layer
5. Differentiating intelligence
6. Voice capture
7. Integrations and operations

Do not skip foundation stages.
