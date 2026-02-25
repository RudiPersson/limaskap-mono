# Limaskap App

Frontend web app for the Limaskap product.

## What This Project Does

`limaskap-app` is the user-facing interface for:

- Multi-tenant organization pages by subdomain
- Program browsing and program detail pages
- User registration/sign-in/sign-out
- Member profile management
- Enrollment flows and payment success UX

Tech stack:

- Next.js App Router
- React 19
- TanStack Query
- Tailwind + shadcn/ui
- OpenAPI-generated SDK client

## Backend Integration

`limaskap-app` now contains both frontend and backend runtime.

- Backend endpoints are implemented in `app/api/*`
- Auth endpoints are served from `app/api/auth/*`
- OpenAPI is exposed at `http://localhost:3000/doc` for SDK generation

If API contracts change, regenerate SDK:

```bash
pnpm --filter @limaskap/app openapi-ts
```

Root commands are canonical in this monorepo; run commands from repository root.

## Multi-Tenant Routing

Subdomain routing logic is implemented in `proxy.ts`.

- Requests on tenant subdomains are rewritten to `/s/[subdomain]/*`
- Root domain pages remain on standard routes
- Reserved subdomains (for example `api`, `admin`, `www`) are not treated as tenants

## Key App Areas

- `app/(main)`:
  - Root-domain pages, auth pages, user profile
- `app/(subdomain)/s/[subdomain]`:
  - Tenant-specific pages (organization programs, program details, payment success)
- `features/*`:
  - Domain features (auth, organizations, programs, profile)
- `lib/sdk`:
  - OpenAPI-generated API client and query helpers

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Set environment variables (for example in `.env.local`):

```bash
NEXT_PUBLIC_REST_API=http://localhost:3000
```

3. Start development server:

```bash
pnpm --filter @limaskap/app dev
```

Default local URL:

- `http://localhost:3000`

## Build And Run

```bash
pnpm --filter @limaskap/app build
pnpm --filter @limaskap/app start
```

## API Integration Notes

- Runtime API base URL is configured in `lib/hey-api.ts` from `NEXT_PUBLIC_REST_API`.
- SDK generation config lives in `openapi-ts.config.ts`.
- Tenant data reads are API-driven via the generated SDK.

## Collaboration Contract With API

When changing this app, verify:

1. The API route exists and contract matches generated types.
2. Authenticated calls include required headers/cookies.
3. Any API route/schema changes in `app/api/*` are followed by SDK regeneration here.
