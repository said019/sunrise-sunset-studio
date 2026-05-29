-- ============================================
-- 027 · Restore the loyalty (WalletClub) schema lost in the Catarsis fork
-- ============================================
-- ROOT CAUSE of "el wallet no se actualiza tras comprar":
-- GET /api/wallet/pass runs `SELECT COALESCE(loyalty_points,0) FROM users`,
-- but users.loyalty_points didn't exist in the deployed DB. That SELECT threw,
-- /pass returned 500, and the client treats the error as "no membership" — so an
-- ACTIVE membership never showed in the wallet. The loyalty rewards/redemptions
-- tables were also missing (the whole loyalty subsystem's migration was lost),
-- which 500s /api/loyalty/rewards and the redeem flow.
--
-- Additive + idempotent. Safe on local and production. Matches what the loyalty
-- code (server/src/routes/loyalty.ts, lib/loyalty.ts, routes/wallet.ts) expects.
-- The loyalty_points ledger table already exists in prod; only the user balance
-- column and the rewards/redemptions tables were missing.
-- ============================================

BEGIN;

-- 1) Per-user points balance (read by /wallet/pass and the redeem flow).
ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;

-- 2) Rewards catalog.
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    points_cost  INTEGER NOT NULL,
    reward_type  VARCHAR(50) NOT NULL DEFAULT 'discount',
    reward_value TEXT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    stock        INTEGER, -- NULL = unlimited
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3) Redemptions ledger.
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id    UUID REFERENCES loyalty_rewards(id) ON DELETE SET NULL,
    points_spent INTEGER NOT NULL,
    status       VARCHAR(50) NOT NULL DEFAULT 'pending',
    redeemed_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_user ON loyalty_redemptions(user_id);

COMMIT;
