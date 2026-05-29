-- ============================================
-- 028 · Reconcile remaining Catarsis-fork schema drift (full audit sweep)
-- ============================================
-- Found by auditing every backend route's SQL against the live prod schema.
-- All additive + idempotent. Adds columns/tables/enum values the code uses but
-- that were missing in the deployed DB (each would 500 the moment a user hit it).
-- Types match what the code INSERT/SELECT/UPDATEs. New-table columns are nullable
-- (besides PKs) so inserts can't fail on an unanticipated NOT NULL.
-- ============================================

-- egreso_category: the egresos Zod schema accepts these, but the enum only had
-- nomina/servicios/marketing → INSERT/UPDATE 500'd. ADD VALUE must run outside a
-- transaction block; IF NOT EXISTS makes it idempotent.
ALTER TYPE egreso_category ADD VALUE IF NOT EXISTS 'renta';
ALTER TYPE egreso_category ADD VALUE IF NOT EXISTS 'internet';
ALTER TYPE egreso_category ADD VALUE IF NOT EXISTS 'insumos';
ALTER TYPE egreso_category ADD VALUE IF NOT EXISTS 'mantenimiento';
ALTER TYPE egreso_category ADD VALUE IF NOT EXISTS 'seguros';
ALTER TYPE egreso_category ADD VALUE IF NOT EXISTS 'otros';

BEGIN;

-- memberships: per-membership cancellation tracking (the whole cancel-booking flow
-- reads/writes these).
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS cancellations_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS cancellation_limit INTEGER; -- NULL = unlimited

-- reviews: rating fields collected by the review form / read by the stats query.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS punctuality_rating INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS would_recommend BOOLEAN;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS would_repeat BOOLEAN;

-- event_registrations: transfer proof for paid events.
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS payment_proof_file_name VARCHAR(255);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS transfer_date DATE;

-- coach_playlists: thumbnail.
ALTER TABLE coach_playlists ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Referrals subsystem (entirely missing; also referenced by the Apple/Google
-- wallet pass builders, so its absence 500s pass downloads).
CREATE TABLE IF NOT EXISTS referral_codes (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code       VARCHAR(32) NOT NULL UNIQUE,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);

CREATE TABLE IF NOT EXISTS referrals (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- Videos: missing columns the on-demand video subsystem uses.
ALTER TABLE videos ADD COLUMN IF NOT EXISTS category_id    UUID;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS level          VARCHAR(20);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS published_at   TIMESTAMP WITH TIME ZONE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS slug           VARCHAR(255);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS cloudinary_id  VARCHAR(255);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS likes_count    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;

-- video_purchases: missing transfer/proof/review columns.
ALTER TABLE video_purchases ADD COLUMN IF NOT EXISTS amount            NUMERIC(10,2);
ALTER TABLE video_purchases ADD COLUMN IF NOT EXISTS currency          VARCHAR(3) DEFAULT 'MXN';
ALTER TABLE video_purchases ADD COLUMN IF NOT EXISTS customer_notes    TEXT;
ALTER TABLE video_purchases ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);
ALTER TABLE video_purchases ADD COLUMN IF NOT EXISTS transfer_date     DATE;
ALTER TABLE video_purchases ADD COLUMN IF NOT EXISTS proof_file_url    TEXT;
ALTER TABLE video_purchases ADD COLUMN IF NOT EXISTS proof_file_name   VARCHAR(255);
ALTER TABLE video_purchases ADD COLUMN IF NOT EXISTS proof_file_type   VARCHAR(100);
ALTER TABLE video_purchases ADD COLUMN IF NOT EXISTS admin_notes       TEXT;
ALTER TABLE video_purchases ADD COLUMN IF NOT EXISTS reviewed_by       UUID;
ALTER TABLE video_purchases ADD COLUMN IF NOT EXISTS reviewed_at       TIMESTAMP WITH TIME ZONE;

-- Videos supporting tables (categories / likes / watch history / comments).
CREATE TABLE IF NOT EXISTS video_categories (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(120) NOT NULL,
    description TEXT,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_likes (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS video_history (
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id      UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    last_position INTEGER DEFAULT 0,
    completed     BOOLEAN DEFAULT FALSE,
    watched_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS video_comments (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    parent_id  UUID REFERENCES video_comments(id) ON DELETE CASCADE,
    status     VARCHAR(20) NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_video_comments_video ON video_comments(video_id);

-- cron_job_logs: internal cron logging (currently guarded by try/catch, but make
-- it real so the logs actually persist).
CREATE TABLE IF NOT EXISTS cron_job_logs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name   VARCHAR(100),
    status     VARCHAR(20),
    message    TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
