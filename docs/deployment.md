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
