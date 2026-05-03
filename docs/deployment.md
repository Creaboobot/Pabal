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

## Public Hosting From GitHub

The GitHub source repository is `Creaboobot/Pabal`. The recommended first
public deployment is:

```text
GitHub -> Vercel -> Neon PostgreSQL
```

Use this path for normal public hosting because it keeps deploys simple,
supports preview deployments from pull requests, and matches the current
Next.js architecture without locking the app away from future container or Azure
hosting.

Configure Vercel from GitHub:

- import `Creaboobot/Pabal` into Vercel;
- keep the framework preset as Next.js;
- use the commands from `vercel.json`;
- create a Neon PostgreSQL database and copy the pooled connection string into
  `DATABASE_URL`;
- copy the values from `.env.public.example` into Vercel environment
  variables, replacing all placeholders with real secrets;
- set `APP_URL` to the final public URL;
- set `AUTH_SECRET` to a long random production value;
- set `AUTH_TRUST_HOST=true`;
- keep `ENABLE_DEV_AUTH=false`.

Apply production migrations with `pnpm prisma:deploy` against the production
database. Do not run `pnpm prisma:migrate` or seed demo data against production
tenant data. `SEED_DEMO_DATA=true` is only for private review environments.

## Cloudflare Tunnel Review Hosting

Pabal can also be exposed through Cloudflare Tunnel from a local machine or a
small VM. This mirrors the board setup and is useful for private review links
while the product is still moving quickly.

For a local private review tunnel:

```powershell
Copy-Item .env.example .env.local
.\scripts\start-public-dev.ps1 -SeedDemoData
```

Before starting, edit `.env.local`:

- set `AUTH_SECRET`;
- set `ENABLE_DEV_AUTH=true` only for this private review tunnel;
- set `AUTH_TRUST_HOST=true`;
- keep provider secrets blank unless you are explicitly testing live providers.

In Cloudflare, route the tunnel hostname to `http://localhost:3000` and protect
the hostname with Cloudflare Access.

For a Docker-backed public or VM deployment:

```bash
cp .env.public.example .env.public
docker compose --env-file .env.public -f deploy/docker-compose.public.yml up -d postgres
docker compose --env-file .env.public -f deploy/docker-compose.public.yml run --rm migrate
docker compose --env-file .env.public -f deploy/docker-compose.public.yml up -d app
```

Then configure a named Cloudflare Tunnel using
`deploy/cloudflare-tunnel.example.yml`, replace the placeholders, route the
hostname to `http://localhost:3000`, and enable Cloudflare Access if the
environment is not meant to be fully public.

## Runtime Checks

- `GET /api/health` returns a basic service health payload.
- `GET /api/ready` validates runtime readiness and returns `503` when required
  runtime values such as `DATABASE_URL` or `AUTH_SECRET` are missing.

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
