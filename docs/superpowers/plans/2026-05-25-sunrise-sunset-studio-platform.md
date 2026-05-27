# Sunrise Sunset Platform — Implementation Plan (Archived)

> **Status:** Completed. This document is a historical placeholder.
>
> The original 17-task implementation plan (project setup, credit-bucket
> data model, type-aware booking engine, brand/identity, deploy, etc.)
> has been executed. The codebase is now the source of truth.

## What was built

See [`docs/superpowers/specs/2026-05-25-sunrise-sunset-studio-platform-design.md`](../specs/2026-05-25-sunrise-sunset-studio-platform-design.md)
for the canonical design (architecture, plan catalog, credit bucket model,
policies, brand tokens).

Major chunks of work delivered:

| Area | Implementation |
|---|---|
| Frontend identity | Coral/cream/amber/wine palette · Fraunces + Inter type · `.bg-sunset` radial gradient · boutique `/app` layout · admin panel |
| Backend stack | Express + TS + PostgreSQL · JWT auth · TanStack Query · Resend (email) · Clip (payments) · Evolution (WhatsApp, off) |
| Credit buckets | `plan_credit_buckets` + `membership_credits` tables · pure `selectBucketForClassType` selector · transactional booking with multi-class atomicity and double-spend prevention · cancel-refund path · 26 unit tests |
| Catalog | 17 active plans (3 class types × 4 packages = 12 group plans + 4 singles + Inscripción) loaded via `database/seeds/sunrise_*.sql` |
| Wallet | Apple Wallet (.pkpass storeCard) + Google Wallet (LoyaltyClass + LoyaltyObject) with sunset gradient strip, plan badge, credits/expiry/next-class secondary fields, El Tezal location, MST timezone |
| Deploy | Railway: sunrise-web (Vite static) + sunrise-api (Node) + Postgres · GitHub auto-deploy on push to main |
| Timezone | `America/Mazatlan` (GMT-7) end-to-end — backend queries, cron, payments, bookings cutoff, wallet `relevantDate`, settings default |

## Day-to-day operations

- **Add a plan:** insert via admin UI or seed file in `database/seeds/`, then run `sunrise_singles.sql` if you need to deactivate replaced ones.
- **Edit studio info / address / IG:** admin UI → Settings → General (or update `system_settings` row with key `studio_info`).
- **Update wallet pass design:** edit `server/src/lib/apple-wallet.ts` + `server/src/lib/google-wallet.ts`, regenerate strip via `node scripts/build-wallet-assets.mjs`, commit.
- **New migration:** add `database/migrations/NNN_description.sql` (idempotent, `IF NOT EXISTS` guards), then `psql "$DATABASE_URL" -f database/migrations/NNN_description.sql`.

## Why this document is short

The original plan was a one-time setup playbook. It's been executed and the
code embodies the result. Keeping the long-form task list around adds noise
without helping the next reader — the spec describes intent, the code shows
implementation, and `git log` shows history.
