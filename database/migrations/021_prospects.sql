-- Sesión Muestra / Prospectos.
-- Marca usuarios "prospecto" (chicas que vinieron a sesión muestra y aún no
-- son socias). Se completan y convierten en clientas formales al pagar.

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_prospect BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS prospect_created_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_is_prospect ON users(is_prospect);
