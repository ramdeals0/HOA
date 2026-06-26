#!/usr/bin/env bash
# Full Railway CLI deploy for HOA SaaS monorepo
# Usage:
#   export RAILWAY_TOKEN=your-token   # from https://railway.com/account/tokens
#   ./scripts/railway-deploy.sh
#
# Or after interactive login:
#   railway login
#   ./scripts/railway-deploy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RAILWAY="npx @railway/cli"

railway_cmd() {
  $RAILWAY "$@"
}

log() { echo "==> $*"; }

# ── Auth check ────────────────────────────────────────────────────────────────
if ! railway_cmd whoami >/dev/null 2>&1; then
  if [[ -z "${RAILWAY_TOKEN:-}" && -z "${RAILWAY_API_TOKEN:-}" ]]; then
    echo "ERROR: Not logged in to Railway."
    echo ""
    echo "Option 1 — token (recommended for CI/agents):"
    echo "  export RAILWAY_TOKEN=\$(railway login --browserless 2>&1 | ...) "
    echo "  Get a token at: https://railway.com/account/tokens"
    echo "  export RAILWAY_TOKEN=your-token"
    echo "  ./scripts/railway-deploy.sh"
    echo ""
    echo "Option 2 — interactive login:"
    echo "  railway login"
    echo "  ./scripts/railway-deploy.sh"
    exit 1
  fi
fi

log "Authenticated as: $(railway_cmd whoami 2>/dev/null || echo 'token user')"

# ── Link or create project ──────────────────────────────────────────────────
if ! railway_cmd status >/dev/null 2>&1; then
  log "Creating Railway project 'hoa-saas'..."
  railway_cmd init --name hoa-saas
else
  log "Using linked project: $(railway_cmd status 2>/dev/null | head -1 || true)"
fi

# ── Apply infrastructure from .railway/railway.ts ───────────────────────────
log "Planning infrastructure changes..."
railway_cmd config plan || true

log "Applying infrastructure (.railway/railway.ts)..."
railway_cmd config apply --yes --confirm-destructive

# ── Generate JWT secret if missing ──────────────────────────────────────────
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
railway_cmd variable set JWT_SECRET="$JWT_SECRET" --service hoa-api --skip-deploys 2>/dev/null || \
  railway_cmd variable set JWT_SECRET="$JWT_SECRET" --skip-deploys 2>/dev/null || true

# ── First deploy: seed database ─────────────────────────────────────────────
railway_cmd variable set SEED_DATABASE=true --service hoa-api --skip-deploys 2>/dev/null || \
  railway_cmd variable set SEED_DATABASE=true --skip-deploys 2>/dev/null || true

# ── Generate public domains ─────────────────────────────────────────────────
log "Generating public domain for hoa-api..."
API_DOMAIN=$(railway_cmd domain --service hoa-api --json 2>/dev/null | grep -o '"domain":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
if [[ -z "$API_DOMAIN" ]]; then
  railway_cmd domain --service hoa-api 2>&1 || true
  sleep 3
  API_DOMAIN=$(railway_cmd domain list --service hoa-api --json 2>/dev/null | grep -o '"[^"]*\.up\.railway\.app"' | head -1 | tr -d '"' || true)
fi

log "Generating public domain for hoa-web..."
WEB_DOMAIN=$(railway_cmd domain --service hoa-web --json 2>/dev/null | grep -o '"domain":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
if [[ -z "$WEB_DOMAIN" ]]; then
  railway_cmd domain --service hoa-web 2>&1 || true
  sleep 3
  WEB_DOMAIN=$(railway_cmd domain list --service hoa-web --json 2>/dev/null | grep -o '"[^"]*\.up\.railway\.app"' | head -1 | tr -d '"' || true)
fi

if [[ -n "$API_DOMAIN" && -n "$WEB_DOMAIN" ]]; then
  API_URL="https://${API_DOMAIN}"
  WEB_URL="https://${WEB_DOMAIN}"
  log "Wiring URLs: API=$API_URL  WEB=$WEB_URL"

  railway_cmd variable set \
    "CORS_ORIGIN=$WEB_URL" \
    "WEB_URL=$WEB_URL" \
    "API_URL=$API_URL" \
    --service hoa-api --skip-deploys 2>/dev/null || true

  railway_cmd variable set \
    "NEXT_PUBLIC_API_URL=$API_URL" \
    --service hoa-web --skip-deploys 2>/dev/null || true
fi

# ── Deploy services from local source ────────────────────────────────────────
log "Deploying hoa-api..."
railway_cmd up --service hoa-api --detach -y

log "Deploying hoa-web..."
railway_cmd up --service hoa-web --detach -y

# ── Wait and show status ────────────────────────────────────────────────────
log "Waiting for deployments..."
sleep 10

railway_cmd service status --json 2>/dev/null || railway_cmd status 2>/dev/null || true

echo ""
echo "════════════════════════════════════════════════════════"
echo "  HOA SaaS deployed to Railway"
echo "════════════════════════════════════════════════════════"
[[ -n "${WEB_URL:-}" ]] && echo "  Web:  $WEB_URL"
[[ -n "${API_URL:-}" ]] && echo "  API:  $API_URL"
echo ""
echo "  Demo login: member1@whispergroves.example.com / Password123!"
echo "  Community:  ${WEB_URL:-}/t/whisper-groves"
echo ""
echo "  After first deploy, remove SEED_DATABASE:"
echo "    railway variable delete SEED_DATABASE --service hoa-api"
echo "════════════════════════════════════════════════════════"
