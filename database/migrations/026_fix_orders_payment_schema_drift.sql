-- ============================================
-- 026 · Fix orders / payment_proofs schema drift
-- ============================================
-- ROOT CAUSE
-- The deployed `orders` and `payment_proofs` tables were created by the
-- Catarsis base import with an OLD column set (notes, approved_by, rejected_by,
-- mime_type, ...). Migration 003_orders_payment_system.sql defines the CURRENT
-- schema the backend expects (customer_notes, tax_rate, reviewed_by/at,
-- membership_id, cancelled_at, file_type, additional_notes, validated_by/at,
-- validation_notes) but it guards the tables with CREATE TABLE IF NOT EXISTS,
-- so on a DB where the tables already existed it was a silent no-op — only the
-- trigger/function/sequence parts of 003 ran. The discount-code subsystem
-- (discount_codes, discount_code_plans, orders.discount_code_id/discount_amount)
-- has NO migration in this repo at all (lost 017/018 in the fork).
--
-- SYMPTOM
-- POST /api/orders -> "INSERT ... (tax_rate, customer_notes, discount_code_id,
-- discount_amount)" hit "column does not exist" -> 500 -> red "no se pudo crear
-- la orden" toast in /app/checkout. POST /api/orders/:id/upload-proof failed the
-- same way (file_type / additional_notes). Admin approve/reject would fail next
-- (reviewed_by/at, validated_by/at, validation_notes).
--
-- This migration is purely ADDITIVE and IDEMPOTENT (ADD COLUMN IF NOT EXISTS /
-- CREATE TABLE IF NOT EXISTS / guarded back-fills). Safe to run more than once
-- and safe on both local and production. No existing column is dropped.
-- Types mirror 003_orders_payment_system.sql.
-- ============================================

-- --------------------------------------------
-- 0) payment_method enum: add the missing 'bank_transfer' value.
-- The shared `payment_method` enum (used by orders, payments, memberships,
-- video_purchases, guest_bookings, event_registrations) had only
-- cash/transfer/card/online. The checkout sends 'bank_transfer' for transfer
-- plans, so the order INSERT failed with "invalid input value for enum
-- payment_method: bank_transfer". The code comment "bank_transfer now supported
-- in enum" confirms a migration that added it was lost in the fork.
-- Run OUTSIDE the transaction below: ADD VALUE may not be usable in the same
-- transaction that adds it on some PG versions. IF NOT EXISTS makes it idempotent.
-- --------------------------------------------
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'bank_transfer';

BEGIN;

-- --------------------------------------------
-- 1) Discount-code subsystem (entirely missing)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS discount_codes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            VARCHAR(50) NOT NULL UNIQUE,
    description     TEXT DEFAULT '',
    discount_type   VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value  DECIMAL(10, 2) NOT NULL,
    max_uses        INTEGER,
    current_uses    INTEGER NOT NULL DEFAULT 0,
    valid_from      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until     TIMESTAMP WITH TIME ZONE,
    min_purchase    DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);

CREATE TABLE IF NOT EXISTS discount_code_plans (
    discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
    plan_id          UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    PRIMARY KEY (discount_code_id, plan_id)
);

-- --------------------------------------------
-- 2) orders: add columns the current code reads/writes
-- --------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate         DECIMAL(5, 4) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_notes   TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES discount_codes(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount  DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS membership_id    UUID REFERENCES memberships(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reviewed_by      UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reviewed_at      TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at     TIMESTAMP WITH TIME ZONE;

-- back-fill customer_notes from the legacy `notes` column when present
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'orders' AND column_name = 'notes') THEN
        UPDATE orders SET customer_notes = notes
         WHERE customer_notes IS NULL AND notes IS NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_discount_code ON orders(discount_code_id);

-- --------------------------------------------
-- 3) payment_proofs: add columns the current code reads/writes
-- --------------------------------------------
ALTER TABLE payment_proofs ADD COLUMN IF NOT EXISTS file_type        VARCHAR(100);
ALTER TABLE payment_proofs ADD COLUMN IF NOT EXISTS additional_notes TEXT;
ALTER TABLE payment_proofs ADD COLUMN IF NOT EXISTS validated_by     UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE payment_proofs ADD COLUMN IF NOT EXISTS validated_at     TIMESTAMP WITH TIME ZONE;
ALTER TABLE payment_proofs ADD COLUMN IF NOT EXISTS validation_notes TEXT;

-- back-fill from the legacy equivalents when present (mime_type -> file_type,
-- reviewed_by/at -> validated_by/at)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'payment_proofs' AND column_name = 'mime_type') THEN
        UPDATE payment_proofs SET file_type = mime_type
         WHERE file_type IS NULL AND mime_type IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'payment_proofs' AND column_name = 'reviewed_by') THEN
        UPDATE payment_proofs SET validated_by = reviewed_by
         WHERE validated_by IS NULL AND reviewed_by IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'payment_proofs' AND column_name = 'reviewed_at') THEN
        UPDATE payment_proofs SET validated_at = reviewed_at
         WHERE validated_at IS NULL AND reviewed_at IS NOT NULL;
    END IF;
END $$;

COMMIT;
