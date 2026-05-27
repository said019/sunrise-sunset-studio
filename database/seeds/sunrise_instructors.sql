-- ============================================
-- Sunrise Sunset — Coaches (Instructores)
-- ============================================
--
-- Crea las 4 coaches del studio: Adri, Amber, Khalia, Ceci.
-- Cada una tiene una fila en `users` (role='instructor') y otra en
-- `instructors` enlazada por user_id (FK NOT NULL).
--
-- Las fotos viven en public/ y se sirven desde el mismo origin que el
-- admin panel, así que la URL relativa /Coach%20<Nombre>.jpeg funciona
-- tanto en producción como en localhost.
--
-- Idempotente: re-correrlo solo asegura que existen y están activas;
-- no duplica.

-- Step 1 — Usuarios con rol instructor (upsert por email)
INSERT INTO users (
    email, display_name, role, phone,
    accepts_communications, receive_reminders, receive_promotions, receive_weekly_summary
) VALUES
    ('coach.adri@sunrisesunset.studio',   'Coach Adri',   'instructor', '+5216241000001', false, true, false, false),
    ('coach.amber@sunrisesunset.studio',  'Coach Amber',  'instructor', '+5216241000002', false, true, false, false),
    ('coach.khalia@sunrisesunset.studio', 'Coach Khalia', 'instructor', '+5216241000003', false, true, false, false),
    ('coach.ceci@sunrisesunset.studio',   'Coach Ceci',   'instructor', '+5216241000004', false, true, false, false)
ON CONFLICT (email) DO UPDATE
    SET role         = 'instructor',
        display_name = EXCLUDED.display_name;

-- Step 2 — Instructores enlazados (idempotente: solo inserta si no existe
-- una fila instructors para ese user_id)
INSERT INTO instructors (
    user_id, display_name, bio, photo_url, specialties,
    is_active, visible_public, email, phone
)
SELECT
    u.id,
    c.display_name,
    c.bio,
    c.photo_url,
    c.specialties::jsonb,
    true,
    true,
    u.email,
    u.phone
FROM users u
JOIN (VALUES
    ('coach.adri@sunrisesunset.studio',   'Coach Adri',   'Sculpt-Funcional y Surf-Pilates', '/Coach%20Adri.jpeg',   '["Sculpt-Funcional","Surf-Pilates"]'),
    ('coach.amber@sunrisesunset.studio',  'Coach Amber',  'Sculpt-Funcional',                 '/Coach%20Amber.jpeg',  '["Sculpt-Funcional"]'),
    ('coach.khalia@sunrisesunset.studio', 'Coach Khalia', 'Surf-Pilates',                     '/Coach%20Kalhia.jpeg', '["Surf-Pilates"]'),
    ('coach.ceci@sunrisesunset.studio',   'Coach Ceci',   'Yoga',                             '/Coach%20ceci.jpeg',   '["Yoga"]')
) AS c(email, display_name, bio, photo_url, specialties)
  ON c.email = u.email
WHERE NOT EXISTS (
    SELECT 1 FROM instructors WHERE user_id = u.id
);

-- Verificación
SELECT i.display_name, i.specialties, i.photo_url, i.is_active, i.visible_public, u.email
  FROM instructors i
  JOIN users u ON i.user_id = u.id
 WHERE u.email LIKE 'coach.%@sunrisesunset.studio'
 ORDER BY i.display_name;
