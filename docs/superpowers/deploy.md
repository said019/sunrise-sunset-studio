# Deploy — Sunrise Sunset (Railway)

Architecture: **1 Railway project, 3 resources**
- `Postgres` (Railway DB) — provides `DATABASE_URL`
- `sunrise-api` service — backend, root `server/`, port `${PORT}` (Railway-assigned)
- `sunrise-web` service — frontend, root `.`, port `${PORT}` (serves `dist/` via `serve`)

Each service has its own `nixpacks.toml` + `railway.json` checked in (root for frontend, `server/` for backend).

## What you need

1. A valid **Railway account token** (PAT, not a project-scoped token). Get one at https://railway.app/account/tokens. Export as `RAILWAY_TOKEN` — the rest of this guide assumes it's set.
2. A GitHub repo for Sunrise (recommended, enables auto-deploy on push). Either: push this local repo to `said019/SunriseSunset` (or similar), or skip GitHub and use `railway up` for direct local uploads.

## Quick deploy (the one-shot sequence)

```bash
export RAILWAY_TOKEN="<your-account-pat>"
cd "/Users/saidromero/Desktop/Sunrise Sunset"

# 1. Create the project
railway init -n sunrise-sunset

# 2. Add the database (auto-injects DATABASE_URL into all services)
railway add -d postgres

# 3. Add the two services (linked to a GitHub repo with --repo)
railway add -s sunrise-api  -r said019/<repo>
railway add -s sunrise-web -r said019/<repo>
# (If not using GitHub: skip --repo; use `railway up --service sunrise-api` from server/ and `railway up --service sunrise-web` from repo root.)

# 4. Set env vars (run BOTH lines)
#    Backend service:
railway variables --service sunrise-api \
  --set "JWT_SECRET=$(openssl rand -hex 32)" \
  --set "NODE_ENV=production" \
  --set "PORT=3001" \
  --set "CORS_ALLOWED_ORIGINS=https://<frontend-public-url>"
#    Frontend service (point at backend's public URL):
railway variables --service sunrise-web \
  --set "VITE_API_URL=https://<api-public-url>/api"

# 5. Generate public domains
railway domain --service sunrise-api
railway domain --service sunrise-web
# Copy the URLs back into the env vars above (CORS_ALLOWED_ORIGINS and VITE_API_URL).

# 6. Deploy
railway up --service sunrise-api --ci
railway up --service sunrise-web --ci

# 7. Seed the production DB (one-time, from local against the Railway Postgres)
#    NOTE: schema_complete.sql is an older consolidated snapshot — it's missing
#    columns that the code references (e.g. users.password_hash, users.is_prospect).
#    You MUST apply EVERY migration in database/migrations/ after schema_complete,
#    not just 022/023. All migrations are idempotent (IF NOT EXISTS guards).
#    Use the proxy DATABASE_URL from `railway variables --service Postgres`.
DB_PROXY="<paste from `railway variables --service Postgres`>"
psql "$DB_PROXY" -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS pgcrypto;'
# Schema snapshot. Use psql WITHOUT -v ON_ERROR_STOP=1; the snapshot contains a
# bad ADD CONSTRAINT IF NOT EXISTS line that errors on PG18 but is harmless.
psql "$DB_PROXY" -f database/schema_complete.sql 2>&1 | tail -5
# All migrations in numeric order (the loop handles the 001/002/003 duplicates fine).
for f in database/migrations/*.sql; do
  echo "→ $(basename "$f")"
  psql "$DB_PROXY" -f "$f" 2>&1 | grep -E "^(ALTER|CREATE|INSERT|UPDATE|DELETE|ERROR)" | tail -2
done
# Sunrise catalog seeds.
psql "$DB_PROXY" -f database/seeds/sunrise_class_types.sql
psql "$DB_PROXY" -f database/seeds/sunrise_packages.sql
psql "$DB_PROXY" -f database/seeds/sunrise_singles.sql
# Sanity (expect: 17 active plans, 3 class_types, 22 buckets, users.password_hash exists)
psql "$DB_PROXY" -c "SELECT 'plans' k, count(*) FROM plans WHERE is_active UNION ALL
SELECT 'class_types', count(*) FROM class_types WHERE is_active UNION ALL
SELECT 'buckets', count(*) FROM plan_credit_buckets;"
psql "$DB_PROXY" -tAc "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name IN ('password_hash','is_prospect');"

# 8. Smoke test the live URLs
curl -s -o /dev/null -w "api/health -> %{http_code}\n" https://<api-public-url>/api/health
curl -s -o /dev/null -w "web ->         %{http_code}\n" https://<frontend-public-url>
```

## What's pre-configured in the repo

- Root `nixpacks.toml` + `railway.json` — frontend build (Vite) and `serve dist/` start
- `server/nixpacks.toml` + `server/railway.json` — backend build (`tsc`) and `node dist/index.js` start
- The frontend reads `VITE_API_URL` at build time → set it BEFORE `railway up --service sunrise-web`
- The backend reads `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ALLOWED_ORIGINS`, `NODE_ENV` (+ optional integration keys, all default to empty)

## Optional integrations (off by default)

These keys are read by the backend but left empty so the app boots cleanly. Set them in `railway variables --service sunrise-api` only when ready:
- Email (Resend): `RESEND_API_KEY`, `EMAIL_FROM`
- Payments (Clip MX): `CLIP_API_KEY`, `CLIP_*`
- WhatsApp (Evolution API): `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`
- Wallet (Apple/Google): the cert/key blobs

## Custom domains

Once stable, point a real domain (e.g. `app.sunrisesunsetloscabos.com`) at the frontend service in Railway → Settings → Domains, and update `CORS_ALLOWED_ORIGINS` on the backend to match.
