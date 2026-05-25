-- Agrega columna cancelled_by a bookings para registrar quien cancelo
-- (admin/cliente). Antes solo guardabamos cancellation_reason que decia
-- "Cancelada por admin" sin precisar cual admin la canceló.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_by
  ON bookings(cancelled_by) WHERE cancelled_by IS NOT NULL;
