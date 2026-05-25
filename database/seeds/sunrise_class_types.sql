-- Sunrise Sunset class types: Sculpt-Funcional, Surf-Pilates, Yoga.
-- Removes the Catarsis default class types (Barre Studio, Pilates Mat, Yoga Sculpt)
-- and seeds Sunrise's. Idempotent: re-running inserts nothing new.
-- NOTE: max_capacity (8) is a default; the studio adjusts capacity per class/schedule in admin.

DELETE FROM class_types WHERE name NOT IN ('Sculpt-Funcional', 'Surf-Pilates', 'Yoga');

INSERT INTO class_types (name, description, color, max_capacity, duration_minutes, is_active)
SELECT v.name, v.description, v.color, v.max_capacity, v.duration_minutes, true
FROM (VALUES
  ('Sculpt-Funcional', 'Entrenamiento de fuerza y funcional', '#E36F4C', 8, 60),
  ('Surf-Pilates',     'Pilates inspirado en surf',          '#F8B069', 8, 60),
  ('Yoga',             'Yoga consciente',                    '#C67E6F', 8, 60)
) AS v(name, description, color, max_capacity, duration_minutes)
WHERE NOT EXISTS (SELECT 1 FROM class_types ct WHERE ct.name = v.name);
