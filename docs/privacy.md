# Privacy And Export Controls

Step 14B adds tenant-scoped JSON exports and privacy-control visibility.

## Export Types

Personal export means the current user's contribution inside the active
workspace. It may include safe user profile fields, the current membership/role,
records created by the user where the model supports `createdByUserId`,
user-created voice notes and AI proposals, user-created source references, and
sanitized audit events where the user is the actor.

Workspace export requires owner/admin access. It may include tenant-owned
people, companies, affiliations, meetings, participants, notes, tasks,
commitments, needs, capabilities, introduction suggestions, AI proposals,
proposal items, voice notes, voice mentions, source references, memberships,
roles, and sanitized audit logs.

Both exports are scoped to the active workspace. They do not collect data across
all workspaces.

## Format And Delivery

Exports are synchronous JSON downloads with a stable versioned shape:

- export version and type;
- generated timestamp;
- tenant and requested-by metadata;
- scope description;
- per-section limits;
- counts;
- sections;
- omissions.

The V1 export is a single JSON file. CSV, ZIP, background export jobs, scheduled
exports, email delivery, external object storage, and SIEM export are not
implemented.

## Sensitive Data

Exports may contain sensitive relationship intelligence when that content is
part of the exported business record, including note bodies, pasted
Teams/Copilot notes, user-provided LinkedIn notes, voice transcripts, edited
voice transcripts, and AI proposal patches.

Exports do not include Auth.js account/session/verification tokens, provider
access or refresh tokens, cookies, headers, environment values, secrets, raw
provider payloads, raw OpenAI responses, raw audio files, payment/card data, or
raw audit metadata.

Raw audio is not retained by default and is not exported. `VoiceNote` retention
metadata may be exported, but `audioStorageKey` is excluded.

Audit logs inside exports include sanitized metadata previews only. Sensitive
keys, suspicious credential-looking values, note bodies, pasted text,
transcripts, raw AI output, provider payloads, and proposed patches are redacted
from audit metadata.

## Auditability

Generating an export writes one safe audit event before the export is returned:

- `privacy.personal_export_requested`
- `privacy.workspace_export_requested`

Audit metadata contains only export type, requester id, tenant id, generated
timestamp, section counts, and truncation flags. Exported content is not written
to audit metadata.

If the audit event cannot be written, the export should fail rather than return
sensitive data unaudited.

## Later Controls

Step 14B is not a deletion, erasure, or retention workflow. Account deletion,
tenant deletion, permanent deletion, automated retention enforcement, and full
data-subject request workflows are deferred to later steps.

This document is product and engineering guidance, not legal advice.
