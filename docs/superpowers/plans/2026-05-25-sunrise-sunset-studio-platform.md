# Sunrise Sunset — Studio Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up an independent, rebranded Sunrise Sunset studio platform by reusing Catarsis's canonical (working) frontend + backend, then add type-aware package credits ("credit buckets") so Group A/B/C packages enforce the correct class types and exact mixed compositions.

**Architecture:** Copy the canonical pieces from the messy Catarsis repo (`src/` frontend + `Catarsis/server/` backend + `database/`) into the empty, git-fresh `Sunrise Sunset/` folder as a single clean frontend + single backend. Rebrand identity/tokens, seed Sunrise's class types and catalog, and extend the membership credit model from a single pool to per-type buckets with a small pure helper wired into booking + membership activation.

**Tech Stack:** Vite + React + TypeScript + Tailwind + shadcn/ui (frontend); Node + Express + TypeScript + PostgreSQL (backend); vitest for backend unit tests; Railway for deploy.

**Source repo (read-only, do NOT modify):** `/Users/saidromero/Desktop/Catarsis`
- Canonical frontend: `/Users/saidromero/Desktop/Catarsis/src/`
- Canonical backend: `/Users/saidromero/Desktop/Catarsis/Catarsis/server/`
- Canonical database: `/Users/saidromero/Desktop/Catarsis/database/`

**Target repo:** `/Users/saidromero/Desktop/Sunrise Sunset` (git already initialized, `main`, has the spec committed)

**Spec:** `docs/superpowers/specs/2026-05-25-sunrise-sunset-studio-platform-design.md`

**Conventions:**
- Run all commands from the target repo root unless stated: `cd "/Users/saidromero/Desktop/Sunrise Sunset"`
- `SRC` = `/Users/saidromero/Desktop/Catarsis` (the source repo).
- Commit messages end with: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`

---

## Phase 0 — Consolidation (one frontend + one backend that runs)

### Task 1: Copy the canonical pieces into the target repo

**Files:**
- Create: `src/`, `server/`, `database/`, `public/` and root config files in target.

- [ ] **Step 1: Copy frontend, backend, database, public (excluding heavy/dirty dirs)**

```bash
cd "/Users/saidromero/Desktop/Sunrise Sunset"
SRC="/Users/saidromero/Desktop/Catarsis"
rsync -a --exclude node_modules --exclude dist --exclude .git --exclude .vite "$SRC/src/" ./src/
rsync -a --exclude node_modules --exclude dist --exclude .git "$SRC/Catarsis/server/" ./server/
rsync -a --exclude node_modules "$SRC/database/" ./database/
rsync -a --exclude node_modules "$SRC/public/" ./public/
```

- [ ] **Step 2: Copy root config files (one frontend app at root)**

```bash
SRC="/Users/saidromero/Desktop/Catarsis"
for f in .gitignore components.json eslint.config.js index.html nixpacks.toml \
         package.json package-lock.json playwright.config.ts postcss.config.js \
         railway.json tailwind.config.ts tsconfig.app.json tsconfig.json \
         tsconfig.node.json vercel.json vite.config.ts; do
  cp "$SRC/$f" "./$f"
done
```

- [ ] **Step 3: Verify structure is clean (no nested `Catarsis/`)**

Run:
```bash
ls -d src server database public 2>/dev/null && find . -maxdepth 2 -type d -name Catarsis -not -path './node_modules/*'
```
Expected: `src server database public` printed; the `find` prints **nothing** (no nesting).

- [ ] **Step 4: Confirm `.gitignore` ignores build/deps/env**

Run: `grep -E "node_modules|dist|\.env" .gitignore`
Expected: all three appear. If `.env` is missing, append it:
```bash
printf "\n.env\n.env.local\nserver/.env\n" >> .gitignore
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: import canonical Catarsis frontend + backend + database

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Install dependencies and verify both apps build

**Files:** Modify: `package-lock.json`, `server/package-lock.json` (generated).

- [ ] **Step 1: Install frontend deps**

Run: `npm install`
Expected: completes without ERESOLVE errors (warnings OK).

- [ ] **Step 2: Install backend deps**

Run: `npm install --prefix server`
Expected: completes; `server/node_modules` created.

- [ ] **Step 3: Verify frontend builds**

Run: `npm run build`
Expected: Vite build succeeds, `dist/` produced. Fix any import errors before continuing (these indicate a missing copied file).

- [ ] **Step 4: Verify backend type-checks/builds**

Run: `npm run build --prefix server`
Expected: `tsc` completes; `server/dist/index.js` exists.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: install frontend and backend dependencies

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Local database + env, boot backend and frontend

**Files:** Create: `server/.env`, `.env`.

- [ ] **Step 1: Create local Postgres DB and load schema**

```bash
createdb sunrise_sunset
psql -d sunrise_sunset -f database/schema_complete.sql
```
Expected: schema loads (NOTICEs OK). If `uuid_generate_v4()` errors, first run `psql -d sunrise_sunset -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'` and retry.

- [ ] **Step 2: Enumerate required backend env vars**

Run: `grep -rhoE "process\.env\.[A-Z_]+" server/src | sort -u`
Read the output. At minimum you will see `DATABASE_URL`, `JWT_SECRET`, `PORT`, plus integration keys (email/Resend, Clip, Evolution/WhatsApp, Cloudinary, Apple/Google Wallet, CORS origins).

- [ ] **Step 3: Write `server/.env`**

Create `server/.env` (fill integration keys later; only DB/JWT/PORT/CORS needed to boot):
```
DATABASE_URL=postgresql://localhost:5432/sunrise_sunset
JWT_SECRET=dev-secret-change-me
PORT=3001
CORS_ALLOWED_ORIGINS=http://localhost:8080
NODE_ENV=development
```
(Add the remaining keys from Step 2 with empty/placeholder values so optional features don't crash on boot. Integrations stay off until real keys arrive.)

- [ ] **Step 4: Write frontend `.env` and fix the hardcoded API fallback**

Create `.env`:
```
VITE_API_URL=http://localhost:3001/api
```
Edit `src/lib/api.ts:5` — replace the Catarsis production fallback URL so it does not leak to Sunrise:
```ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

- [ ] **Step 5: Boot backend, then frontend (two terminals)**

Run (terminal A): `npm run dev --prefix server`
Expected: logs "listening on :3001" (or similar) with no crash.

Run (terminal B): `npm run dev`
Expected: Vite serves on `http://localhost:8080`; opening it loads the app and the network tab hits `localhost:3001/api`.

- [ ] **Step 6: Commit (env files are gitignored; this commit is the api.ts fix)**

```bash
git add src/lib/api.ts .gitignore
git commit -m "chore: point frontend API at local backend, stop leaking Catarsis prod URL

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 1 — Rebrand to Sunrise Sunset

### Task 4: Replace brand name strings

**Files:** Modify: `package.json`, `server/package.json`, `index.html`, plus the ~40 frontend + ~21 backend files containing `catarsis`/`balance` (identified by grep).

- [ ] **Step 1: List every brand reference**

Run:
```bash
grep -rilE "catarsis|balance" src server index.html package.json server/package.json 2>/dev/null
```
Read the list. These are your edit targets.

- [ ] **Step 2: Rename package identifiers**

Edit `package.json` → `"name": "sunrise-sunset"`. Edit `server/package.json` → `"name": "sunrise-sunset-server"`.

- [ ] **Step 3: Update page title + meta**

Edit `index.html`: set `<title>Sunrise Sunset</title>` and update any `og:title`/`description`/author meta that say Catarsis/Balance to Sunrise Sunset (El Tezal, Los Cabos studio).

- [ ] **Step 4: Replace user-visible brand text**

For each file from Step 1 that renders or sends user-facing text (UI strings, email subjects/bodies, wallet pass labels), replace `Catarsis`/`Balance` → `Sunrise Sunset`. Leave variable/function names alone unless trivially safe. Verify nothing references the old studio name in emails: `grep -rilE "catarsis|balance" src server | grep -iE "mail|notif|wallet|template"`.

- [ ] **Step 5: Verify build still green**

Run: `npm run build && npm run build --prefix server`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: rebrand app identity to Sunrise Sunset

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Apply brand color tokens + typography

**Files:** Modify: `tailwind.config.ts`, `src/index.css` (shadcn CSS variables).

- [ ] **Step 1: Inspect current theme tokens**

Run: `grep -nE "primary|secondary|accent|background|--" src/index.css | head -40` and open `tailwind.config.ts`.
Note where the shadcn HSL variables (`--primary`, `--background`, etc.) and the tailwind color extensions live.

- [ ] **Step 2: Set Sunrise tokens in `src/index.css`**

In the `:root` block, set the brand palette (hex from spec §7; convert to the format already used — if the file uses HSL triplets, convert these hex values). Map roles:
```
/* Sunrise Sunset palette */
--background: 40 38% 90%;     /* cream #EFE7D9 */
--foreground: 22 47% 29%;     /* chocolate #6E4528 */
--primary: 14 72% 60%;        /* coral #E36F4C */
--primary-foreground: 40 38% 90%; /* cream on coral */
--secondary: 33 91% 70%;      /* amber #F8B069 */
--accent: 14 72% 60%;         /* coral */
--muted: 12 41% 60%;          /* rose #C67E6F */
--card: 353 100% 97%;         /* blush #FEF3F4 */
--destructive: 0 100% 24%;    /* wine #7B0000 */
```
(If the file uses raw hex instead of HSL, use the hex values from spec §7 directly.)

- [ ] **Step 3: Add brand colors to `tailwind.config.ts`**

In `theme.extend.colors`, add named tokens so components can use `bg-coral`, `text-cream`, etc.:
```ts
coral: '#E36F4C',
amber: '#F8B069',
wine: '#7B0000',
chocolate: '#6E4528',
rose: '#C67E6F',
cream: '#EFE7D9',
blush: '#FEF3F4',
```

- [ ] **Step 4: Set display + body fonts**

In `index.html` add the font links (display serif for headings like the logo + a clean sans for body — e.g. a Google Fonts pair), then map them in `tailwind.config.ts` `theme.extend.fontFamily` (`serif`/`display` for headings, `sans` for body). Apply the display font to headings via the existing typography layer in `src/index.css`.

- [ ] **Step 5: Verify visually**

Run: `npm run dev`, open `http://localhost:8080`.
Expected: cream background, coral buttons/accents, warm sunset feel. Adjust HSL/hex until it matches the brand images.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts src/index.css index.html
git commit -m "feat: apply Sunrise Sunset color tokens and typography

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Logo, favicon, and contact/location config

**Files:** Create: `public/logo.svg` (or `.png`), `public/favicon.ico`; Modify: location/IG/contact references.

- [ ] **Step 1: Place brand assets**

Add the Sunrise Sunset logo to `public/` (e.g. `public/logo.png`) and replace `public/favicon.ico`. Until the official files arrive, use a coral placeholder with the wordmark so layout is correct; leave a note in `docs/` listing the asset to swap.

- [ ] **Step 2: Wire the logo into the header/landing**

Find the current logo usage: `grep -rinE "logo|favicon" src public/index.html index.html | head`. Point those references at the new asset.

- [ ] **Step 3: Set studio location, Instagram, contact**

Find footer/contact/about strings: `grep -rinE "instagram|direccion|address|tezal|telefono|whatsapp" src | head`. Set:
- Address: `Carret. Trans. 3.5 Tezal, 23454 Cabo San Lucas, B.C.S.` (El Tezal, Los Cabos)
- Instagram: `@sunrisesunsetloscabos` (link `https://instagram.com/sunrisesunsetloscabos`)
- Remove/hide phone + WhatsApp UI for v1 (email-only); keep components but feature-flag off.

- [ ] **Step 4: Verify + commit**

Run: `npm run build`
Expected: succeeds.
```bash
git add -A
git commit -m "feat: add Sunrise Sunset logo, favicon, location and Instagram

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 — Class types

### Task 7: Seed Sunrise class types

**Files:** Create: `database/seeds/sunrise_class_types.sql`.

- [ ] **Step 1: Inspect the `class_types` columns**

Run: `awk '/CREATE TABLE IF NOT EXISTS class_types/,/\);/' database/schema_complete.sql`
Note the exact columns (expected: `id, name, ...` possibly `color`, `description`, `is_active`, `sort_order`).

- [ ] **Step 2: Write the seed (adjust columns to match Step 1)**

Create `database/seeds/sunrise_class_types.sql`:
```sql
INSERT INTO class_types (name, description, is_active, sort_order) VALUES
('Sculpt-Funcional', 'Entrenamiento de fuerza y funcional', true, 1),
('Surf-Pilates',     'Pilates inspirado en surf',          true, 2),
('Yoga',             'Yoga consciente',                    true, 3)
ON CONFLICT DO NOTHING;
```
(If the table has a `color` column, add coral/amber/rose hex per type.)

- [ ] **Step 3: Apply and verify**

Run:
```bash
psql -d sunrise_sunset -f database/seeds/sunrise_class_types.sql
psql -d sunrise_sunset -c "SELECT name FROM class_types WHERE is_active ORDER BY sort_order;"
```
Expected: the 3 Sunrise class types listed.

- [ ] **Step 4: Commit**

```bash
git add database/seeds/sunrise_class_types.sql
git commit -m "feat: seed Sunrise class types (Sculpt-Funcional, Surf-Pilates, Yoga)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 — Type-aware credit model (the custom feature, TDD)

### Task 8: DB migration for credit buckets

**Files:** Create: `database/migrations/020_credit_buckets.sql`.

- [ ] **Step 1: Write the migration**

Create `database/migrations/020_credit_buckets.sql`:
```sql
-- Plan-level: defines allowed class types + count per credit bucket
CREATE TABLE IF NOT EXISTS plan_credit_buckets (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id                UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    allowed_class_type_ids UUID[] NOT NULL,
    credit_count           INTEGER,            -- NULL = ilimitado
    sort_order             INTEGER DEFAULT 0,
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_plan_credit_buckets_plan ON plan_credit_buckets(plan_id);

-- Membership-level: per-bucket remaining for an active membership
CREATE TABLE IF NOT EXISTS membership_credits (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id          UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    allowed_class_type_ids UUID[] NOT NULL,
    remaining              INTEGER,            -- NULL = ilimitado
    sort_order             INTEGER DEFAULT 0,
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_membership_credits_membership ON membership_credits(membership_id);
```

- [ ] **Step 2: Apply and verify**

Run:
```bash
psql -d sunrise_sunset -f database/migrations/020_credit_buckets.sql
psql -d sunrise_sunset -c "\d plan_credit_buckets" -c "\d membership_credits"
```
Expected: both tables described with the columns above.

- [ ] **Step 3: Commit**

```bash
git add database/migrations/020_credit_buckets.sql
git commit -m "feat(db): add plan_credit_buckets and membership_credits tables

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Set up vitest in the backend

**Files:** Modify: `server/package.json`; Create: `server/vitest.config.ts`.

- [ ] **Step 1: Add vitest**

Run: `npm install -D vitest --prefix server`

- [ ] **Step 2: Add test script**

Edit `server/package.json` scripts, add: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Create `server/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```

- [ ] **Step 4: Verify the runner works (no tests yet = "no test files")**

Run: `npm test --prefix server`
Expected: vitest runs and reports no test files found (exit without error is fine at this stage).

- [ ] **Step 5: Commit**

```bash
git add server/package.json server/vitest.config.ts server/package-lock.json
git commit -m "chore(server): add vitest for unit tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Pure bucket-selection helper (TDD)

**Files:** Create: `server/src/lib/credit-buckets.ts`, `server/src/lib/credit-buckets.test.ts`.

- [ ] **Step 1: Write the failing test**

Create `server/src/lib/credit-buckets.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { selectBucketForClassType, CreditBucket } from './credit-buckets';

const SF = 'sf-id', SP = 'sp-id', YOGA = 'yoga-id';

describe('selectBucketForClassType', () => {
  it('selects the shared bucket for an allowed type (Group A)', () => {
    const buckets: CreditBucket[] = [
      { id: 'a', allowed_class_type_ids: [SF, YOGA], remaining: 4, sort_order: 0 },
    ];
    expect(selectBucketForClassType(buckets, YOGA)?.id).toBe('a');
  });

  it('returns null when no bucket allows the type (Group A booking Surf)', () => {
    const buckets: CreditBucket[] = [
      { id: 'a', allowed_class_type_ids: [SF, YOGA], remaining: 4, sort_order: 0 },
    ];
    expect(selectBucketForClassType(buckets, SP)).toBeNull();
  });

  it('prefers the most specific bucket for mixed packages (Group C)', () => {
    const buckets: CreditBucket[] = [
      { id: 'sf', allowed_class_type_ids: [SF], remaining: 3, sort_order: 0 },
      { id: 'sp', allowed_class_type_ids: [SP], remaining: 3, sort_order: 1 },
      { id: 'yoga', allowed_class_type_ids: [YOGA], remaining: 2, sort_order: 2 },
    ];
    expect(selectBucketForClassType(buckets, SP)?.id).toBe('sp');
  });

  it('treats remaining=null as unlimited (eligible)', () => {
    const buckets: CreditBucket[] = [
      { id: 'u', allowed_class_type_ids: [SF, SP, YOGA], remaining: null, sort_order: 0 },
    ];
    expect(selectBucketForClassType(buckets, SF)?.id).toBe('u');
  });

  it('skips exhausted buckets (remaining=0)', () => {
    const buckets: CreditBucket[] = [
      { id: 'sp', allowed_class_type_ids: [SP], remaining: 0, sort_order: 0 },
    ];
    expect(selectBucketForClassType(buckets, SP)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test --prefix server`
Expected: FAIL — `Cannot find module './credit-buckets'`.

- [ ] **Step 3: Implement the helper**

Create `server/src/lib/credit-buckets.ts`:
```ts
export interface CreditBucket {
  id: string;
  allowed_class_type_ids: string[];
  remaining: number | null; // null = unlimited
  sort_order: number;
}

/**
 * Choose which bucket to deduct for a class of `classTypeId`.
 * Eligible = bucket allows the type AND has availability (remaining > 0 or null).
 * Preference: most specific bucket (fewest allowed types) first, so mixed
 * packages consume the single-type bucket; tiebreak by sort_order.
 * Returns null when nothing is eligible (caller rejects the booking).
 */
export function selectBucketForClassType(
  buckets: CreditBucket[],
  classTypeId: string
): CreditBucket | null {
  const eligible = buckets.filter(
    (b) =>
      b.allowed_class_type_ids.includes(classTypeId) &&
      (b.remaining === null || b.remaining > 0)
  );
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => {
    const specA = a.allowed_class_type_ids.length;
    const specB = b.allowed_class_type_ids.length;
    if (specA !== specB) return specA - specB;
    return a.sort_order - b.sort_order;
  });
  return eligible[0];
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm test --prefix server`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/lib/credit-buckets.ts server/src/lib/credit-buckets.test.ts
git commit -m "feat(server): add type-aware credit bucket selection helper

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Copy plan buckets into membership on activation

**Files:** Modify: `server/src/routes/memberships.ts` (membership activation handler).

- [ ] **Step 1: Read the activation handler**

Run: `grep -nE "INSERT INTO memberships|classes_remaining|status.*active|activat" server/src/routes/memberships.ts`
Read the handler that sets a membership to active and sets `classes_remaining` from the plan.

- [ ] **Step 2: After the membership is activated, copy the plan's buckets**

Immediately after the membership row is created/activated (you have `membership.id` and `plan_id`), insert one `membership_credits` row per `plan_credit_buckets` row:
```ts
await query(
  `INSERT INTO membership_credits (membership_id, allowed_class_type_ids, remaining, sort_order)
   SELECT $1, allowed_class_type_ids, credit_count, sort_order
   FROM plan_credit_buckets WHERE plan_id = $2`,
  [membershipId, planId]
);
```
(Use the same DB helper the file already uses — `query`/`pool.query`. Match its style.)

- [ ] **Step 3: Keep `classes_remaining` as the derived total (compat)**

Set `classes_remaining` = sum of bucket counts (NULL if any bucket is unlimited) so existing Wallet/report views keep working:
```ts
// after copying buckets
await query(
  `UPDATE memberships m SET classes_remaining =
     CASE WHEN EXISTS (SELECT 1 FROM membership_credits c WHERE c.membership_id = m.id AND c.remaining IS NULL)
          THEN NULL
          ELSE (SELECT COALESCE(SUM(remaining),0) FROM membership_credits c WHERE c.membership_id = m.id) END
   WHERE m.id = $1`,
  [membershipId]
);
```

- [ ] **Step 4: Verify build**

Run: `npm run build --prefix server`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/memberships.ts
git commit -m "feat(server): copy plan credit buckets into membership on activation

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Enforce buckets when booking + refund on cancel

**Files:** Modify: `server/src/routes/bookings.ts` (booking creation + cancellation handlers).

- [ ] **Step 1: Read current credit logic**

Run: `grep -nE "classes_remaining|class_type_id|INSERT INTO bookings|DELETE FROM bookings|UPDATE memberships SET classes_remaining" server/src/routes/bookings.ts`
Read the create-booking handler (deducts a credit) and the cancel handler (currently refunds to `classes_remaining`).

- [ ] **Step 2: On booking, deduct from the correct bucket**

In the create-booking handler, after you know the class's `class_type_id` and the chosen `membership_id`:
```ts
import { selectBucketForClassType } from '../lib/credit-buckets';

// load this membership's buckets
const buckets = await query(
  `SELECT id, allowed_class_type_ids, remaining, sort_order
   FROM membership_credits WHERE membership_id = $1`,
  [membershipId]
).then(r => r.rows);

const bucket = selectBucketForClassType(buckets, classTypeId);
if (!bucket) {
  return res.status(400).json({ error: 'Tu paquete no incluye este tipo de clase o no te quedan créditos disponibles.' });
}
// store bucket.id on the booking so cancel can refund the same bucket
// (add column if needed: see Step 4)
if (bucket.remaining !== null) {
  await query(`UPDATE membership_credits SET remaining = remaining - 1 WHERE id = $1`, [bucket.id]);
}
```
Then recompute the membership's derived `classes_remaining` total (see the SQL in Step 3 of this task) so existing Wallet/report views stay correct.

- [ ] **Step 3: On cancel (within policy), refund the same bucket**

In the cancel handler, refund to the bucket recorded on the booking:
```ts
if (booking.credit_bucket_id) {
  await query(
    `UPDATE membership_credits SET remaining = remaining + 1
     WHERE id = $1 AND remaining IS NOT NULL`,
    [booking.credit_bucket_id]
  );
}
```
Then recompute the derived `classes_remaining` total:
```ts
await query(
  `UPDATE memberships m SET classes_remaining =
     CASE WHEN EXISTS (SELECT 1 FROM membership_credits c WHERE c.membership_id = m.id AND c.remaining IS NULL)
          THEN NULL
          ELSE (SELECT COALESCE(SUM(remaining),0) FROM membership_credits c WHERE c.membership_id = m.id) END
   WHERE m.id = $1`,
  [booking.membership_id]
);
```

- [ ] **Step 4: Add the `credit_bucket_id` column on bookings (migration)**

Create `database/migrations/021_booking_credit_bucket.sql`:
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS credit_bucket_id UUID REFERENCES membership_credits(id);
```
Apply: `psql -d sunrise_sunset -f database/migrations/021_booking_credit_bucket.sql`
Then set `credit_bucket_id = bucket.id` in the INSERT/UPDATE of Step 2.

- [ ] **Step 5: Verify build + smoke test the rejection path**

Run: `npm run build --prefix server`
Expected: succeeds.
Manual smoke (after Phase 4 seed): a Group A membership trying to book Surf-Pilates returns the 400 "no incluye" message; a valid Yoga booking decrements the `[SF,Yoga]` bucket.

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/bookings.ts database/migrations/021_booking_credit_bucket.sql
git commit -m "feat(server): enforce per-type credit buckets on booking and refund on cancel

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4 — Seed Sunrise catalog (packages, drop-ins, trial, inscription)

### Task 13: Seed the 12 packages with credit buckets

**Files:** Create: `database/seeds/sunrise_packages.sql`.

- [ ] **Step 1: Write the seed (plans + buckets), resolving class_type IDs by name**

Create `database/seeds/sunrise_packages.sql`. Each plan inserts a `plans` row, then `plan_credit_buckets` rows referencing class types by name. Pattern (repeat for all 12; Group A/B = one multi-type bucket, Group C = one bucket per type, unlimited = `credit_count NULL`):
```sql
-- Helper CTE values pulled inline via subselects on class_types.name
-- GROUP A — Sculpt-Funcional + Yoga
WITH p AS (
  INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
  VALUES ('Sunrise Pack', 1400.00, 'MXN', 30, 4, 'Sculpt-Funcional + Yoga', '["4 clases","Vigencia 30 días"]'::jsonb, true, 10)
  RETURNING id
)
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT p.id,
       ARRAY(SELECT id FROM class_types WHERE name IN ('Sculpt-Funcional','Yoga')),
       4, 0
FROM p;
```
Full set to seed (name, price, duration 30, class_limit, bucket rules):

| Plan | Price | class_limit | Buckets |
|---|---|---|---|
| Sunrise Pack | 1400 | 4 | [SF,Yoga]=4 |
| Golden Hour | 2600 | 8 | [SF,Yoga]=8 |
| Sunset Flow | 3600 | 12 | [SF,Yoga]=12 |
| Full Day Experience | 4500 | NULL | [SF,Yoga]=NULL |
| Wave Starter | 1560 | 4 | [SP,Yoga]=4 |
| Ocean Flow | 2960 | 8 | [SP,Yoga]=8 |
| Deep Flow | 4080 | 12 | [SP,Yoga]=12 |
| Endless Waves | 5200 | NULL | [SP,Yoga]=NULL |
| Balanced Flow | 2280 | 8 | [SF]=3, [SP]=3, [Yoga]=2 |
| Elevate Experience | 3700 | 12 | [SF]=6, [SP]=4, [Yoga]=2 |
| Full Experience | 4900 | 16 | [SF]=8, [SP]=6, [Yoga]=2 |
| Sunrise Sunset Combo | 5600 | NULL | [SF,SP,Yoga]=NULL |

(SF=Sculpt-Funcional, SP=Surf-Pilates. For mixed plans emit one `plan_credit_buckets` INSERT per type with the right `credit_count` and incrementing `sort_order`. For unlimited use `NULL` as `credit_count` and `class_limit`.)

- [ ] **Step 2: Apply and verify counts**

Run:
```bash
psql -d sunrise_sunset -f database/seeds/sunrise_packages.sql
psql -d sunrise_sunset -c "SELECT name, price, class_limit FROM plans WHERE sort_order >= 10 ORDER BY sort_order;"
psql -d sunrise_sunset -c "SELECT p.name, count(b.*) AS buckets FROM plans p JOIN plan_credit_buckets b ON b.plan_id=p.id GROUP BY p.name ORDER BY p.name;"
```
Expected: 12 plans; Group A/B plans show 1 bucket, the 3 fixed-mix plans show 3 buckets, the combo shows 1.

- [ ] **Step 3: Verify a mixed package's composition**

Run:
```bash
psql -d sunrise_sunset -c "SELECT b.credit_count, array_length(b.allowed_class_type_ids,1) AS types FROM plans p JOIN plan_credit_buckets b ON b.plan_id=p.id WHERE p.name='Balanced Flow' ORDER BY b.sort_order;"
```
Expected: three rows with credit_count 3, 3, 2, each `types = 1`.

- [ ] **Step 4: Commit**

```bash
git add database/seeds/sunrise_packages.sql
git commit -m "feat: seed Sunrise's 12 packages with type-aware credit buckets

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: Seed drop-ins, trial, inscription + same-day discount config

**Files:** Create: `database/seeds/sunrise_singles.sql`; Modify: settings for inscription amount + discount rule.

- [ ] **Step 1: Seed drop-ins + trial as single-class plans with buckets**

Create `database/seeds/sunrise_singles.sql` (each is `class_limit=1`, one-type bucket=1):
```sql
-- Drop-ins (one class each)
WITH p AS (INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
  VALUES ('Clase Suelta - Sculpt-Funcional', 380.00, 'MXN', 30, 1, 'Drop-in', '["1 clase"]'::jsonb, true, 1) RETURNING id)
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT p.id, ARRAY(SELECT id FROM class_types WHERE name='Sculpt-Funcional'), 1, 0 FROM p;
-- repeat for 'Clase Suelta - Surf-Pilates' (420) and 'Clase Suelta - Yoga' (350),
-- and 'Clase Muestra' (300, sort_order 0) with its single matching type bucket.
```
(Emit the same WITH/INSERT block for Surf-Pilates $420, Yoga $350, and the $300 trial.)

- [ ] **Step 2: Configure inscription amount + same-day discount**

Find how Catarsis stores the inscription fee: `grep -rinE "inscrip" server/src database/schema_complete.sql | head`. Set the inscription amount to `500` and the trial price to `300` in whatever settings table/route holds them. Implement/verify the rule: if a user enrolls the same calendar day they took the trial, subtract the trial price (300) from the inscription (net 200). If the rule doesn't already exist, add it in the enrollment/order handler guarded by a date comparison; write a unit test for the discount calculation first (TDD) in `server/src/lib/inscription.test.ts` if you extract it into a pure function.

- [ ] **Step 3: Apply + verify**

Run:
```bash
psql -d sunrise_sunset -f database/seeds/sunrise_singles.sql
psql -d sunrise_sunset -c "SELECT name, price FROM plans WHERE class_limit = 1 ORDER BY sort_order;"
```
Expected: trial $300 + the 3 drop-ins at $380/$420/$350.

- [ ] **Step 4: Commit**

```bash
git add database/seeds/sunrise_singles.sql server/src
git commit -m "feat: seed trial + drop-ins and configure inscription with same-day discount

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 5 — Configurable policy + final verification

### Task 15: Cancellation window setting (admin-configurable)

**Files:** Modify: settings table/route + the cancel handler in `server/src/routes/bookings.ts` + admin settings UI.

- [ ] **Step 1: Find the existing cancellation-window logic**

Run: `grep -rinE "cancel|anticipa|hours_before|cutoff" server/src/routes/bookings.ts server/src/routes/settings.ts | head`
Determine whether a cancellation cutoff already exists in settings.

- [ ] **Step 2: Ensure a `cancellation_window_hours` setting exists with a safe default**

If absent, add it to the settings table/seed with default `12` (the spec leaves 1/12/24 to the studio; 12 is the middle, change later in admin). Expose it in the admin settings route + UI so the studio sets the real value without code.

- [ ] **Step 3: Enforce it in cancel**

In the cancel handler, reject cancellations later than `cancellation_window_hours` before class start with a clear message; only refund the credit bucket (Task 12 Step 3) when within the window.

- [ ] **Step 4: Verify build + commit**

Run: `npm run build --prefix server && npm run build`
Expected: both succeed.
```bash
git add -A
git commit -m "feat: configurable cancellation window (default 12h, admin-editable)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: End-to-end smoke test

**Files:** none (manual verification) — optionally Create: `e2e/tests/sunrise-smoke.spec.ts`.

- [ ] **Step 1: Reset DB to a clean seeded state**

```bash
dropdb sunrise_sunset && createdb sunrise_sunset
psql -d sunrise_sunset -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
psql -d sunrise_sunset -f database/schema_complete.sql
psql -d sunrise_sunset -f database/migrations/020_credit_buckets.sql
psql -d sunrise_sunset -f database/migrations/021_booking_credit_bucket.sql
psql -d sunrise_sunset -f database/seeds/sunrise_class_types.sql
psql -d sunrise_sunset -f database/seeds/sunrise_packages.sql
psql -d sunrise_sunset -f database/seeds/sunrise_singles.sql
```
Expected: all succeed with no errors.

- [ ] **Step 2: Boot both apps and walk the happy path**

Run backend + frontend (Task 3 Step 5). In the browser: register a client → buy a package (e.g. Balanced Flow) → see membership active with the 3 buckets → book a Surf-Pilates class (SP bucket 3→2) → attempt a 4th Surf-Pilates beyond the bucket (rejected) → check-in via QR → confirm loyalty points awarded.
Expected: each step behaves per spec; mixed composition is enforced.

- [ ] **Step 3: Run the existing test suites**

Run: `npm test --prefix server` and `npm run build && npm run build --prefix server`
Expected: unit tests pass; both builds succeed.

- [ ] **Step 4: Commit any fixes found**

```bash
git add -A
git commit -m "test: end-to-end smoke pass for Sunrise booking + credit buckets

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 17: Deploy configuration (Railway)

**Files:** Modify: `railway.json`, `nixpacks.toml`, env on Railway.

- [ ] **Step 1: Review existing deploy config**

Run: `cat railway.json nixpacks.toml`
Confirm build/start commands. Backend start = `node dist/index.js` (from `server/`); frontend served from `dist/`.

- [ ] **Step 2: Create Railway project with 3 services**

Provision: Postgres, backend service (root `server/`, build `npm install && npm run build`, start `node dist/index.js`), frontend service (build `npm install && npm run build`, serve `dist`). Set env vars: backend `DATABASE_URL` (Railway Postgres), `JWT_SECRET`, `CORS_ALLOWED_ORIGINS` (frontend URL), integration keys when available; frontend `VITE_API_URL` (backend URL + `/api`).

- [ ] **Step 3: Run schema + migrations + seeds against Railway Postgres**

Apply the same SQL files from Task 16 Step 1 against the Railway `DATABASE_URL`.

- [ ] **Step 4: Smoke-test production URLs**

Run: `curl -s -o /dev/null -w "%{http_code}\n" <frontend-url>` and `curl -s <backend-url>/api/health` (or the real health route).
Expected: 200s; the deployed app loads with Sunrise branding and the 12 packages.

- [ ] **Step 5: Commit deploy config**

```bash
git add railway.json nixpacks.toml
git commit -m "chore: Railway deploy config for Sunrise Sunset

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Pending config values (filled by the studio, no code change)

These are admin-editable settings (spec §12). Track but don't block:
- Capacity per class → set per class/schedule in admin.
- Real weekly schedule (days + times) → schedule editor.
- Cancellation window (1 / 12 / 24 h) → settings (default 12h shipped).
- Exact brand hex → replace approximations in Task 5 if a source file arrives.
- Confirm contact channels (email-only assumed; phone/WhatsApp off).
