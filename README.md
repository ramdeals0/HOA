# HOA Portal SaaS

Multi-tenant HOA management platform built with TypeScript, Express, Next.js 14, Prisma, and PostgreSQL.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

### Setup

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Run migrations and seed
pnpm db:migrate
pnpm db:seed

# Start dev servers (API on :4000, Web on :3000)
pnpm dev
```

### Demo Credentials

Password for all seeded users: `Password123!`

| Email | Role |
|-------|------|
| platform@hoa-saas.example.com | Platform owner (SaaS admin) |
| dual.board@example.com | Board member in both tenants |
| superadmin@whispergroves.example.com | Whisper Groves SUPER_ADMIN |
| member1@whispergroves.example.com | Whisper Groves MEMBER |
| board@lakeside.example.com | Lakeside BOARD |

### Demo Communities

- [Whisper Groves](/t/whisper-groves) — PRO plan, full features
- [Lakeside HOA](/t/lakeside) — FREE plan, limited features

## Architecture

```
hoa-saas/
├── apps/
│   ├── api/          # Express REST API
│   └── web/          # Next.js 14 frontend
├── packages/
│   └── shared/       # Zod schemas, types, constants
└── docker-compose.yml
```

### Multi-Tenancy

- All domain data is scoped by `tenant_id`
- Tenant resolved via URL path `/t/[tenantSlug]` or `x-tenant-slug` header
- Global `User` table for identity; per-tenant roles via `TenantUser`
- RBAC checks use `TenantUser.role`, not global roles

### API Routes

- `POST /api/auth/signup|login|logout`
- `GET /api/auth/me`
- `POST /api/tenants/signup` — Create new HOA
- `GET /api/t/:tenantSlug/*` — Tenant-scoped endpoints
- `GET /api/saas-admin/tenants` — Platform admin (owner only)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run API + Web concurrently |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed demo data |
| `pnpm test` | Run Jest tests |

## Stripe

Configure test keys in `.env` or per-tenant in admin settings. Webhook endpoint: `POST /api/payments/webhook`.

## Email

Set `EMAIL_PROVIDER=memory` (default) or `EMAIL_PROVIDER=smtp` with SMTP credentials.
