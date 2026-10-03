# TaskDesk Frontend

Next.js (App Router) frontend for TaskDesk. It follows [frontend-standards/](../frontend-standards/README.md)
without overlays; TaskDesk specifics (features, routes, navigation) are in
[docs/08-frontend/](../docs/08-frontend/README.md).

## Requirements

- Node.js 22 (`nvm use 22`) and pnpm (`corepack enable pnpm`; the version is pinned in `package.json`)
- The backend running (see [backend/README.md](../backend/README.md)), with API docs enabled for `pnpm api:pull`

## First run

```bash
cp .env.example .env      # every variable is required; there are no defaults
pnpm install
pnpm dev                  # http://localhost:3000
```

Sign in with an existing backend user (for example the first Admin from `scripts/create_first_admin.py`).

## Commands

| Command                     | Does                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm dev`                  | Development server                                                                                   |
| `pnpm build` / `pnpm start` | Production build / server                                                                            |
| `pnpm lint`                 | ESLint (boundaries, accessibility, naming, restricted APIs), then the layout and design-token checks |
| `pnpm typecheck`            | Route types + `tsc --noEmit`                                                                         |
| `pnpm test`                 | Unit and component tests (Vitest)                                                                    |
| `pnpm format`               | Prettier                                                                                             |
| `pnpm api:pull`             | Download the backend's `openapi.json` (needs `OPENAPI_URL` in `.env`)                                |
| `pnpm api:types`            | Regenerate `src/lib/api/schema.d.ts` from `openapi.json`                                             |
| `pnpm api:check`            | Regenerate and fail if the committed types differ (CI)                                               |

After a backend change: `pnpm api:pull && pnpm api:types && pnpm typecheck`, then fix what TypeScript reports.

`pnpm test:e2e` runs real-browser tests against the running backend on port 3100 (your `pnpm dev` on
3000 is untouched). It signs in **once** per run as `E2E_EMAIL`/`E2E_PASSWORD` from `.env`, or the
backend's first Admin from `../backend/.env`. If you change that user's password in the app, update
`FIRST_ADMIN_PASSWORD` in `backend/.env`. With a wrong password the run stops after one attempt, so
it never locks the account through the backend's rate limit.

## How a request travels

```
Browser ──/api/backend/v1/...──▶ Next.js server ──Bearer from httpOnly cookie──▶ FastAPI
```

The browser never sees a token or the backend's address (FE-AUTH-001, FE-AUTH-002). Expired access
tokens are renewed once, shared by concurrent requests (FE-AUTH-003).

## Layout

```
src/
├── app/          routes only: (public) login screens, (app) signed-in screens, api/ route handlers
├── features/     one folder per product slice (auth, …) — see nextjs-fe-struct
├── components/   ui (shadcn), layout, feedback, form
├── lib/          api (client, errors), auth (session, BFF), query, format, stores
├── config/       validated environment + product constants (navigation)
└── proxy.ts      optimistic route guard
scripts/          api-pull, check-frontend-layout, check-design-tokens
```
