-- Migration 024: Add password_hash to users (bcrypt).
-- Code references it (auth.ts) but no prior migration nor schema_complete.sql
-- defines the column. Idempotent: ADD COLUMN IF NOT EXISTS.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_password_hash_not_null
  ON users(id) WHERE password_hash IS NOT NULL;
