-- Sunrise Sunset singles: clase muestra (trial) + clases sueltas (drop-ins). 1 class each.
-- Run after sunrise_class_types.sql. Re-seedable (deletes by name first; buckets cascade).

DELETE FROM plans WHERE name IN (
  'Clase Muestra',
  'Clase Suelta - Sculpt-Funcional',
  'Clase Suelta - Surf-Pilates',
  'Clase Suelta - Yoga',
  'Inscripción'
);

-- Clase Muestra (prueba) $300 — 1 clase, cualquiera de los 3 tipos
INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Clase Muestra', 300.00, 'MXN', 30, 1, 'Clase de prueba · 1 clase', '["1 clase de prueba","Cualquier tipo"]'::jsonb, true, 0);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Clase Muestra'),
       ARRAY(SELECT id FROM class_types WHERE name IN ('Sculpt-Funcional','Surf-Pilates','Yoga')), 1, 0;

-- Clase Suelta - Sculpt-Funcional $380
INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Clase Suelta - Sculpt-Funcional', 380.00, 'MXN', 30, 1, 'Drop-in · Sculpt-Funcional', '["1 clase","Sculpt-Funcional"]'::jsonb, true, 1);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Clase Suelta - Sculpt-Funcional'),
       ARRAY(SELECT id FROM class_types WHERE name='Sculpt-Funcional'), 1, 0;

-- Clase Suelta - Surf-Pilates $420
INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Clase Suelta - Surf-Pilates', 420.00, 'MXN', 30, 1, 'Drop-in · Surf-Pilates', '["1 clase","Surf-Pilates"]'::jsonb, true, 2);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Clase Suelta - Surf-Pilates'),
       ARRAY(SELECT id FROM class_types WHERE name='Surf-Pilates'), 1, 0;

-- Clase Suelta - Yoga $350
INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Clase Suelta - Yoga', 350.00, 'MXN', 30, 1, 'Drop-in · Yoga', '["1 clase","Yoga"]'::jsonb, true, 3);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Clase Suelta - Yoga'),
       ARRAY(SELECT id FROM class_types WHERE name='Yoga'), 1, 0;

-- Inscripción (pago único) $500 — enrollment fee, grants NO class credits (class_limit=0, no buckets).
-- The booking engine excludes class_limit=0 plans from being used to book classes.
INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Inscripción', 500.00, 'MXN', 365, 0, 'Inscripción · pago único', '["Pago único de inscripción","Vigencia 1 año"]'::jsonb, true, 5);

-- Deactivate any non-Sunrise plans (legacy defaults seeded by schema_complete.sql),
-- so only the Sunrise catalog (12 packages + 4 singles + inscripción = 17) is active.
UPDATE plans SET is_active = false
WHERE name NOT IN (
  'Sunrise Pack','Golden Hour','Sunset Flow','Full Day Experience',
  'Wave Starter','Ocean Flow','Deep Flow','Endless Waves',
  'Balanced Flow','Elevate Experience','Full Experience','Sunrise Sunset Combo',
  'Clase Muestra','Clase Suelta - Sculpt-Funcional','Clase Suelta - Surf-Pilates','Clase Suelta - Yoga',
  'Inscripción'
);
