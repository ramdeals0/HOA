#!/usr/bin/env bash
set -euo pipefail

# One-time Railway project bootstrap (requires Railway CLI + login)
# Usage: ./scripts/railway-setup.sh

if ! command -v railway >/dev/null 2>&1; then
  echo "Installing Railway CLI..."
  npm install -g @railway/cli
fi

echo "==> Login to Railway (browser will open if needed)"
railway login

echo "==> Create or link project"
railway init --name hoa-saas || railway link

echo "==> Add PostgreSQL"
railway add --database postgres || true

echo ""
echo "Manual steps in Railway dashboard:"
echo "  1. Create service 'hoa-api' from GitHub repo"
echo "     - Dockerfile path: Dockerfile.api"
echo "     - Variables: see RAILWAY.md"
echo "  2. Create service 'hoa-web' from same repo"
echo "     - Dockerfile path: Dockerfile.web"
echo "     - NEXT_PUBLIC_API_URL = hoa-api public URL"
echo "  3. Link DATABASE_URL from Postgres to hoa-api"
echo "  4. Set CORS_ORIGIN on hoa-api to hoa-web public URL"
echo "  5. Set WEB_URL on hoa-api to hoa-web public URL"
echo "  6. First deploy: set SEED_DATABASE=true on hoa-api, redeploy once, then remove"
