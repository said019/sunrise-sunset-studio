-- Add password_hash to users (bcrypt) — code references it (auth.ts, seed-users.sql)
-- but no prior migration nor schema_complete.sql defines it. Bug inherited from Catarsis.
-- Idempotent: ADD COLUMN IF NOT EXISTS.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_password_hash_not_null
  ON users(id) WHERE password_hash IS NOT NULL;
