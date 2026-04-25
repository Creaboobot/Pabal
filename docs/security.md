# Security

The Step 3 foundation implements the first authentication, tenant isolation,
role, protected route, and audit logging baseline.

Foundation rules:

- Do not commit secrets.
- Keep runtime secrets in environment variables.
- Keep external providers behind server-side adapters.
- Keep Next.js middleware limited to coarse authentication checks.
- Enforce tenant and role checks in server-side services, route handlers, or
  server actions.
- Future tenant-owned data models must go through tenant-aware repositories.
- Sensitive operations must be audit-logged.
- Health and readiness endpoints must return status only, never secret values.

## Development auth

Development credentials sign-in is local-only. It is enabled only when
`ENABLE_DEV_AUTH=true` and `NODE_ENV` is not `production`. It does not use or
store reusable passwords.

## Audit logging

Audit metadata is JSON, but the audit service removes sensitive keys and redacts
known secret-looking values before persistence. Do not log tokens, cookies,
session values, raw headers, connection strings, provider secrets, or raw
environment values.
