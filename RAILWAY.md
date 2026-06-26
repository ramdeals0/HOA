# Deploy to Railway

This monorepo deploys as **3 Railway resources**:

1. **PostgreSQL** — database plugin
2. **hoa-api** — Express API (`Dockerfile.api`)
3. **hoa-web** — Next.js frontend (`Dockerfile.web`)

## Option A: Railway Dashboard (recommended)

### 1. Create project

1. Go to [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → select `ramdeals0/HOA`
3. Add **PostgreSQL** from the project canvas (+ New → Database → PostgreSQL)

### 2. Deploy API service

1. **+ New → GitHub Repo** (same repo) → rename service to `hoa-api`
2. **Settings → Build**
   - Builder: **Dockerfile**
   - Dockerfile path: `Dockerfile.api`
   - Root Directory: leave **empty** (repo root)
3. **Settings → Deploy → Health Check Path**: `/health`
4. **Variables** (Settings → Variables):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference from Postgres service) |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | long random string (32+ chars) |
| `CORS_ORIGIN` | `https://<your-web-service>.up.railway.app` |
| `WEB_URL` | `https://<your-web-service>.up.railway.app` |
| `API_URL` | `https://<your-api-service>.up.railway.app` |
| `COOKIE_CROSS_ORIGIN` | `true` |
| `EMAIL_PROVIDER` | `memory` (or `smtp` with SMTP vars) |
| `STRIPE_SECRET_KEY` | your Stripe test/live key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `SEED_DATABASE` | `true` *(first deploy only — remove after)* |

5. Deploy. Migrations run automatically on startup.

### 3. Deploy Web service

1. **+ New → GitHub Repo** (same repo) → rename to `hoa-web`
2. **Settings → Build**
   - Builder: **Dockerfile**
   - Dockerfile path: `Dockerfile.web`
3. **Variables**:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | `https://<your-api-service>.up.railway.app` |

4. Deploy and copy the public URL.

### 4. Wire URLs

Go back to **hoa-api** and update:

- `CORS_ORIGIN` = web public URL
- `WEB_URL` = web public URL

Redeploy API after updating.

### 5. Stripe webhook (optional)

In Stripe Dashboard → Webhooks → Add endpoint:

- URL: `https://<api-service>.up.railway.app/api/payments/webhook`
- Events: `checkout.session.completed`

## Option B: One-command CLI deploy

```bash
# 1. Authenticate (pick one)
railway login
# OR
export RAILWAY_TOKEN=your-token-from-railway.com/account/tokens

# 2. Deploy everything
pnpm railway:deploy
```

This script (`scripts/railway-deploy.sh`) will:
- Create/link the `hoa-saas` Railway project
- Apply `.railway/railway.ts` (Postgres + hoa-api + hoa-web)
- Generate public domains and wire CORS/API URLs
- Deploy both services from local source

Preview infrastructure changes without applying:

```bash
pnpm railway:plan
pnpm railway:apply
```

## Option C: Railway CLI (manual steps)

## Build without Docker (Nixpacks)

If you prefer Nixpacks instead of Docker, create two services with **empty Root Directory**:

**hoa-api**
```
Build:  pnpm install --frozen-lockfile && pnpm --filter @hoa/shared build && pnpm --filter @hoa/api build
Start:  pnpm --filter @hoa/api start:prod
Watch:  apps/api/**, packages/shared/**
```

**hoa-web**
```
Build:  pnpm install --frozen-lockfile && pnpm --filter @hoa/shared build && pnpm --filter @hoa/web build
Start:  pnpm --filter @hoa/web start
Watch:  apps/web/**, packages/shared/**
```

Set `NEXT_PUBLIC_API_URL` on web **before** build (Railway rebuilds when vars change).

## Demo login after seed

Password: `Password123!`

- `member1@whispergroves.example.com`
- `dual.board@example.com`
- `platform@hoa-saas.example.com`

Communities:

- `/t/whisper-groves`
- `/t/lakeside`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ERR_PNPM_NO_PKG_MANIFEST` | Root Directory must be empty, not `apps/api` |
| Login cookies not working | Set `COOKIE_CROSS_ORIGIN=true`, `CORS_ORIGIN` = exact web URL |
| DB connection failed | Ensure `DATABASE_URL` references Postgres service |
| Web can't reach API | Set `NEXT_PUBLIC_API_URL` and redeploy web |
| Empty database | Set `SEED_DATABASE=true` on API, redeploy once |
