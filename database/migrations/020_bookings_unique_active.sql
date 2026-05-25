-- Cambia el unique sobre (class_id, user_id) para que aplique solo a
-- reservas activas (no canceladas). Antes el constraint impedia volver a
-- reservar una clase de la cual el usuario tenia una reserva cancelada
-- previamente, lo que rompia /bookings y /bookings/bulk-month con 500.

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS unique_booking;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_unique_active
  ON bookings(class_id, user_id)
  WHERE status != 'cancelled';
