# Deployment

This scaffold supports local and container-oriented development.

## Local

Use `pnpm dev` for local development after copying `.env.example` to `.env`.

## Docker

`docker compose up --build` starts PostgreSQL and the app container.

Tool profiles are available for migration and seed commands:

```bash
docker compose run --rm migrate
docker compose run --rm seed
```

The production image runs the Next.js production server and must not bake
secrets into the image.
