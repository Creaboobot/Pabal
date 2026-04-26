# Auth and Tenancy

Pobal uses Auth.js / NextAuth-compatible App Router wiring:

- `auth.config.ts` contains middleware-safe shared auth settings.
- `auth.ts` contains the Prisma adapter, providers, JWT/session callbacks, and
  user onboarding hooks.
- `app/api/auth/[...nextauth]/route.ts` exposes the Auth.js route handlers.
- `middleware.ts` protects `/account` and `/settings` with coarse
  authentication only.

## Session strategy

The foundation uses JWT sessions. This keeps the development-only credentials
provider simple and avoids unused database session behavior while still keeping
the standard Auth.js Prisma models for future OAuth compatibility.

## Development sign-in

Local credentials sign-in is available only when both conditions are true:

- `ENABLE_DEV_AUTH=true`
- `NODE_ENV` is not `production`

It accepts an email and optional name. It does not use hardcoded passwords and
cannot be enabled in production by setting the flag alone.

## Microsoft OAuth readiness

Microsoft Entra OAuth variables are optional placeholders. The provider is
registered only when the client id, secret, and issuer or tenant id are present.
No Microsoft Graph sync is implemented in this stage.

The Step 12A Microsoft Graph readiness variables are separate from these
sign-in variables. They do not enable OAuth, token storage, sync, or ingestion.

## Tenant onboarding

On first authenticated access, `ensureDefaultTenantForUser` creates exactly one
default workspace for a user using the unique `Tenant.defaultForUserId`
constraint. Repeated sign-ins reuse the same workspace and membership.

## Authorization boundary

Middleware checks only whether a session exists. Tenant access and role checks
belong in server-side services, route handlers, and server actions. Tenant-aware
repositories require explicit user and tenant context.

## Audit baseline

Foundation events such as default tenant creation and membership creation write
audit logs. Audit metadata is minimal JSON and is sanitized before persistence
to avoid storing secrets, tokens, session values, headers, or connection
strings.
