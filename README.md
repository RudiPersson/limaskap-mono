# Limaskap Monorepo

This repository is a pnpm workspace with two apps:

- `apps/limaskap-app` (Next.js frontend)
- `apps/limaskap-api` (Hono API)

Root commands are canonical in this monorepo. Prefer running commands from the repository root.

## Quick Start

```bash
pnpm install
pnpm dev
```

## Common Root Commands

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

## App-Scoped Commands (From Root)

```bash
pnpm --filter @limaskap/app dev
pnpm --filter @limaskap/api dev
pnpm --filter @limaskap/app openapi-ts
pnpm --filter @limaskap/api db:migrate
```
