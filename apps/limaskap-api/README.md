# Limaskap API

Backend service for the Limaskap product.

## What This Project Does

`limaskap-api` is the source of truth for:

- Authentication/session handling (`better-auth`)
- Organizations and programs
- Member records and enrollments
- Payment session creation and webhook processing
- OpenAPI contract used by the frontend SDK

Tech stack:

- Hono + TypeScript
- Drizzle ORM + PostgreSQL
- Zod/OpenAPI route definitions

## How It Relates To `limaskap-app`

The frontend app (`apps/limaskap-app`) consumes this API directly.

- API routes are mounted under `/api` (except `/health`)
- Auth endpoints are served at `/api/auth/*`
- OpenAPI is exposed at `/doc` and consumed by the app SDK generator
- If you change request/response contracts here, regenerate SDK in the app (`pnpm --filter @limaskap/app openapi-ts`)

Root commands are canonical in this monorepo; run commands from repository root.

## Route Surface

Main groups:

- `/api/organizations`
- `/api/programs`
- `/api/user/*`
- `/api/enrollments`
- `/api/payments/*`
- `/api/webhooks/frisbii`
- `/api/auth/*` (auth handler)
- `/health` (root health endpoint)

OpenAPI docs:

- `/doc` (OpenAPI JSON)
- `/reference` (interactive API reference)

## Data Model (High Level)

Core entities:

- `organization`
- `program`
- `member_record`
- `enrollment`
- `payment`
- `webhook_event`
- auth tables from `better-auth`

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env` with required values (see `src/env.ts`).

3. Run in dev mode:

```bash
pnpm --filter @limaskap/api dev
```

Default local URL:

- `http://localhost:9999`
- Docs: `http://localhost:9999/doc`
- Reference: `http://localhost:9999/reference`

## Build And Run

```bash
pnpm --filter @limaskap/api build
pnpm --filter @limaskap/api start
```

## Database Commands

```bash
pnpm --filter @limaskap/api db:generate
pnpm --filter @limaskap/api db:migrate
pnpm --filter @limaskap/api db:studio
pnpm --filter @limaskap/api db:seed
```

## Environment Variables

Defined/validated in `src/env.ts`. Key values include:

- `NODE_ENV`
- `PORT`
- `LOG_LEVEL`
- `DATABASE_URL`
- `APP_BASE_DOMAIN`
- `API_BASE_URL`
- `FRISBII_API_BASE`
- `LOGTAIL_SOURCE_TOKEN` and `LOGTAIL_INGEST_ENDPOINT` (required outside development)

## Adding New Endpoints

Route pattern in this codebase:

1. Define route schema in `src/routes/<feature>/<feature>.routes.ts`
2. Implement handler in `src/routes/<feature>/<feature>.handlers.ts`
3. Register in `src/routes/<feature>/<feature>.index.ts`
4. Ensure feature index is mounted from `src/app.ts`
5. If contract changed, regenerate frontend SDK in `apps/limaskap-app`
