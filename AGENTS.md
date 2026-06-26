# HOA Portal SaaS

Multi-tenant HOA management platform. pnpm + Turborepo monorepo:

- `apps/api` — Express REST API (`@hoa/api`), port `4000`, run via `tsx`.
- `apps/web` — Next.js 14 frontend (`@hoa/web`), port `3000`.
- `packages/shared` — `@hoa/shared` Zod schemas/types (consumed via `workspace:*`).

See `README.md` for the documented setup flow, demo credentials, and scripts.

## Cursor Cloud specific instructions

Dependencies are refreshed automatically by the startup update script (`pnpm install` + `pnpm db:generate`). The notes below cover only the non-obvious, durable gotchas.

### Database (PostgreSQL)

- Postgres is installed locally (not Docker, despite `docker-compose.yml`). Docker is not available in this environment; do **not** run `docker compose up`.
- The cluster does not auto-start on a fresh VM. Start it before running anything that touches the DB: `sudo pg_ctlcluster 16 main start`.
- Connection matches `.env`: role `hoa` / password `hoa_dev_password` / database `hoa_saas` on `localhost:5432`.
- After the DB is up, apply schema + demo data if needed: `pnpm db:migrate` then `pnpm db:seed` (idempotent-ish; seed prints demo credentials).

### Env files (gitignored — not in the repo)

- `dotenv.config()` and Prisma load `.env` from each app's own working directory, **not** the repo root. The README's root `cp .env.example .env` alone is not enough.
- Required files (already created in this VM; recreate from `.env.example` if missing):
  - `apps/api/.env` — copy of root `.env` (provides `DATABASE_URL`, `JWT_SECRET`, etc.).
  - `apps/web/.env.local` — must set `NEXT_PUBLIC_API_URL="http://localhost:4000"`.
- For local dev, set `CORS_ORIGIN`/`WEB_URL` to `http://localhost:3000`, `API_URL` to `http://localhost:4000`, and `COOKIE_CROSS_ORIGIN="false"`.

### Run / test / lint

- Run everything: `pnpm dev` (turbo runs API, Web, and `@hoa/shared` in `tsc --watch`). The API depends on `packages/shared/dist`, which `pnpm dev` and `pnpm test` build automatically; if running the API standalone, build it first with `pnpm --filter @hoa/shared build`.
- Tests: `pnpm test` (Jest; `@hoa/api` only). Passes without a DB connection.
- Lint: `pnpm lint` runs `next lint` for `@hoa/web` only. No ESLint config is committed, so it prompts interactively and effectively cannot run non-interactively until a config is added. `@hoa/api` and `@hoa/shared` have no lint scripts.
- Stripe and SMTP are optional; `EMAIL_PROVIDER=memory` is the default and needs no external service. Payment endpoints return "Stripe not configured" without keys.
