-- ============================================
-- Migration 025: Sunrise Sunset studio branding
-- ============================================
--
-- Rewrites the `studio_info` system_settings row to point at Sunrise Sunset,
-- and renames any legacy event locations that still carry the previous
-- studio name. Idempotent.

-- 1) studio_info — overwrite with Sunrise Sunset values
INSERT INTO system_settings (key, value, description)
VALUES (
    'studio_info',
    '{"name": "Sunrise Sunset", "address": "El Tezal, Cabo San Lucas, BCS", "phone": "", "email": "hola@sunrisesunset.mx", "social_media": {"instagram": "@sunrisesunsetloscabos"}}'::jsonb,
    'Información del estudio'
)
ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = NOW();

-- 2) events.location — rename any legacy default
UPDATE events
   SET location = 'Sunrise Sunset · El Tezal'
 WHERE location IN ('Catarsis Studio', 'Catarsis');

-- 3) instructors / users — null out any legacy admin@catarsis.* placeholders
--    (kept conservative: only the placeholder pattern, never a real user email)
UPDATE instructors
   SET email = NULL
 WHERE email IN ('admin@catarsis.studio', 'admin@catarsis.com', 'instructor@catarsis.com');
