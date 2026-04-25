# Services

Application services will live here and will orchestrate modules, repositories,
and provider interfaces.

This stage includes foundational auth, tenant, role, session, audit, Step 4A
relationship backbone services, and Step 4B-1 action/intelligence-readiness
services, plus Step 4B-2 AI proposal and voice-note-readiness services.

Services enforce tenant access before calling repositories. They are the right
place for membership checks, role checks, cross-tenant relation validation,
source-reference validation, polymorphic target validation, and audit logging
decisions.

Step 4B-2 services validate direct and polymorphic links, but they do not call
AI providers, transcribe audio, upload audio, apply proposal patches, mutate
targets, or implement review UI. Product workflows, matching algorithms, AI
execution, and voice processing are intentionally not implemented yet.
