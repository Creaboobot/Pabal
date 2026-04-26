# Deployment

This scaffold supports local and container-oriented development.

## Local

Use `pnpm dev` for local development after copying `.env.example` to
`.env.local`, setting `AUTH_SECRET`, enabling `ENABLE_DEV_AUTH=true` only when
local development sign-in is needed, starting PostgreSQL, and applying
migrations.

## Docker

`docker compose up --build` starts PostgreSQL and the app container.
`APP_PORT` and `POSTGRES_PORT` can be overridden from `.env.local` for local
port conflicts.

Tool profiles are available for migration and seed commands:

```bash
docker compose run --rm migrate
docker compose run --rm seed
```

`SEED_DEMO_DATA=true` is intended for local review/demo environments only. It
creates deterministic fake V1 review records and does not call providers, store
raw audio, or require OpenAI/Microsoft/LinkedIn/Stripe credentials. Do not use
the demo seed for production tenant data.

The production image runs the Next.js production server and must not bake
secrets into the image. The image includes a container health check against
`/api/health`.

Runtime environments must provide `DATABASE_URL` and `AUTH_SECRET` for
readiness. Missing values make `/api/ready` return `503` without exposing the
values.

## Voice Transcription

Step 11A introduces optional runtime transcription configuration:

- `SPEECH_TO_TEXT_PROVIDER`: `openai` by default; `mock` is for local/test only
  and is rejected in production.
- `OPENAI_API_KEY`: required only at runtime when using the OpenAI
  speech-to-text provider.
- `OPENAI_TRANSCRIPTION_MODEL`: optional, defaults to
  `gpt-4o-mini-transcribe`.

Builds and readiness checks must not require `OPENAI_API_KEY`. Missing runtime
provider configuration fails the transcription request safely without exposing
secret values. The browser recorder posts multipart audio to the app runtime;
raw audio is not retained by default, and review pages do not require additional
deployment services beyond the existing app and database.

## Voice Transcript Structuring

Step 11B adds optional runtime transcript structuring:

- `TRANSCRIPT_STRUCTURING_PROVIDER`: `openai` by default; `mock` is for
  local/test only and is rejected in production.
- `OPENAI_API_KEY`: required only at runtime when using the OpenAI transcript
  structuring provider.
- `OPENAI_STRUCTURING_MODEL`: optional, defaults to `gpt-4o-mini`.

Builds and readiness checks must not require `OPENAI_API_KEY`. Missing runtime
provider configuration fails the structuring request safely without exposing
secret values. The structuring path creates review-only `AIProposal` and
`AIProposalItem` records linked to a VoiceNote; it does not apply proposal
patches, mutate target records, create voice mentions, or call external lookup
services.

## Microsoft Graph Readiness

Step 12A introduces readiness-only Microsoft Graph configuration:

- `MICROSOFT_GRAPH_PROVIDER`: `disabled` by default. `mock` is for local/test
  only and is rejected in production.
- `MICROSOFT_GRAPH_CLIENT_ID`, `MICROSOFT_GRAPH_CLIENT_SECRET`,
  `MICROSOFT_GRAPH_TENANT_ID`, `MICROSOFT_GRAPH_AUTHORITY`, and
  `MICROSOFT_GRAPH_REDIRECT_URI`: optional future OAuth configuration values.

Builds and readiness checks must not require these variables. They are separate
from the existing Microsoft Entra/Auth.js sign-in variables. Step 12A does not
start OAuth, acquire or refresh tokens, store tokens, call live Microsoft Graph
services, create sync jobs, or ingest calendar, email, or contact data.

## Billing Readiness

Step 13B introduces readiness-only billing configuration:

- `BILLING_PROVIDER`: `disabled` by default. `mock` is for local/test only and
  is rejected in production.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_ID_PRO`:
  optional future Stripe values.

Builds and readiness checks must not require billing or Stripe variables. Step
13B does not add a live Stripe provider, Stripe SDK, checkout sessions, billing
portal sessions, webhook endpoints, customer/subscription creation, payment
method collection, card storage, invoices, tax/VAT handling, plan enforcement,
or billing background jobs.
