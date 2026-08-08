# Tebaqi AI

A Media and Information Literacy (MIL) platform that helps users think critically about digital content — analyse suspicious text/URLs/emails with AI, chat with an AI educator, take literacy lessons, and browse community scam reports.

## Run & Operate

- `pnpm install` — install workspace dependencies
- `pnpm --filter @workspace/api-server run dev` — run the API server (workflow port 8080)
- `PORT=24814 BASE_PATH=/ pnpm --filter @workspace/Tebaqi run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required runtime env: `DATABASE_URL` — provisioned PostgreSQL connection string
- Google sign-in secrets: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Google Cloud Console must list the exact deployed web URL ending in `/login` under Authorized redirect URIs. The browser and API use that same URI for the OAuth exchange.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Vite builds require both `PORT` and `BASE_PATH`; use the same values as the web workflow.
- Google OAuth redirect URIs are exact-match values. If the Replit preview/deployment domain changes, update Google Cloud Console to match the new URL ending in `/login`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
