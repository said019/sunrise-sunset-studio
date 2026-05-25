-- Sunrise Sunset packages (12) with type-aware credit buckets. Vigencia 30 días.
-- Groups: A = Sculpt-Funcional + Yoga; B = Surf-Pilates + Yoga; C (mixto) = fixed per-type composition.
-- Run on a fresh DB after sunrise_class_types.sql. Deletes existing Sunrise plans first
-- (buckets cascade via plan_credit_buckets.plan_id ON DELETE CASCADE).

DELETE FROM plans WHERE name IN (
  'Sunrise Pack','Golden Hour','Sunset Flow','Full Day Experience',
  'Wave Starter','Ocean Flow','Deep Flow','Endless Waves',
  'Balanced Flow','Elevate Experience','Full Experience','Sunrise Sunset Combo'
);

-- ============ GRUPO A — Sculpt-Funcional + Yoga ============
INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Sunrise Pack', 1400.00, 'MXN', 30, 4, 'Sculpt-Funcional + Yoga · 4 clases', '["4 clases","Sculpt-Funcional o Yoga","Vigencia 30 días"]'::jsonb, true, 10);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Sunrise Pack'),
       ARRAY(SELECT id FROM class_types WHERE name IN ('Sculpt-Funcional','Yoga')), 4, 0;

INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Golden Hour', 2600.00, 'MXN', 30, 8, 'Sculpt-Funcional + Yoga · 8 clases', '["8 clases","Sculpt-Funcional o Yoga","Vigencia 30 días"]'::jsonb, true, 11);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Golden Hour'),
       ARRAY(SELECT id FROM class_types WHERE name IN ('Sculpt-Funcional','Yoga')), 8, 0;

INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Sunset Flow', 3600.00, 'MXN', 30, 12, 'Sculpt-Funcional + Yoga · 12 clases', '["12 clases","Sculpt-Funcional o Yoga","Vigencia 30 días"]'::jsonb, true, 12);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Sunset Flow'),
       ARRAY(SELECT id FROM class_types WHERE name IN ('Sculpt-Funcional','Yoga')), 12, 0;

INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Full Day Experience', 4500.00, 'MXN', 30, NULL, 'Sculpt-Funcional + Yoga · ilimitadas', '["Clases ilimitadas","Sculpt-Funcional o Yoga","Vigencia 30 días"]'::jsonb, true, 13);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Full Day Experience'),
       ARRAY(SELECT id FROM class_types WHERE name IN ('Sculpt-Funcional','Yoga')), NULL, 0;

-- ============ GRUPO B — Surf-Pilates + Yoga ============
INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Wave Starter', 1560.00, 'MXN', 30, 4, 'Surf-Pilates + Yoga · 4 clases', '["4 clases","Surf-Pilates o Yoga","Vigencia 30 días"]'::jsonb, true, 20);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Wave Starter'),
       ARRAY(SELECT id FROM class_types WHERE name IN ('Surf-Pilates','Yoga')), 4, 0;

INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Ocean Flow', 2960.00, 'MXN', 30, 8, 'Surf-Pilates + Yoga · 8 clases', '["8 clases","Surf-Pilates o Yoga","Vigencia 30 días"]'::jsonb, true, 21);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Ocean Flow'),
       ARRAY(SELECT id FROM class_types WHERE name IN ('Surf-Pilates','Yoga')), 8, 0;

INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Deep Flow', 4080.00, 'MXN', 30, 12, 'Surf-Pilates + Yoga · 12 clases', '["12 clases","Surf-Pilates o Yoga","Vigencia 30 días"]'::jsonb, true, 22);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Deep Flow'),
       ARRAY(SELECT id FROM class_types WHERE name IN ('Surf-Pilates','Yoga')), 12, 0;

INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Endless Waves', 5200.00, 'MXN', 30, NULL, 'Surf-Pilates + Yoga · ilimitadas', '["Clases ilimitadas","Surf-Pilates o Yoga","Vigencia 30 días"]'::jsonb, true, 23);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Endless Waves'),
       ARRAY(SELECT id FROM class_types WHERE name IN ('Surf-Pilates','Yoga')), NULL, 0;

-- ============ GRUPO C — Mixto (composición exacta) ============
-- Balanced Flow: 3 Sculpt-Funcional + 3 Surf-Pilates + 2 Yoga = 8
INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Balanced Flow', 2280.00, 'MXN', 30, 8, 'Mixto · 3 Sculpt-Funcional, 3 Surf-Pilates, 2 Yoga', '["8 clases","3 Sculpt-Funcional","3 Surf-Pilates","2 Yoga","Vigencia 30 días"]'::jsonb, true, 30);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Balanced Flow'), ARRAY(SELECT id FROM class_types WHERE name='Sculpt-Funcional'), 3, 0;
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Balanced Flow'), ARRAY(SELECT id FROM class_types WHERE name='Surf-Pilates'), 3, 1;
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Balanced Flow'), ARRAY(SELECT id FROM class_types WHERE name='Yoga'), 2, 2;

-- Elevate Experience: 6 Sculpt-Funcional + 4 Surf-Pilates + 2 Yoga = 12
INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Elevate Experience', 3700.00, 'MXN', 30, 12, 'Mixto · 6 Sculpt-Funcional, 4 Surf-Pilates, 2 Yoga', '["12 clases","6 Sculpt-Funcional","4 Surf-Pilates","2 Yoga","Vigencia 30 días"]'::jsonb, true, 31);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Elevate Experience'), ARRAY(SELECT id FROM class_types WHERE name='Sculpt-Funcional'), 6, 0;
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Elevate Experience'), ARRAY(SELECT id FROM class_types WHERE name='Surf-Pilates'), 4, 1;
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Elevate Experience'), ARRAY(SELECT id FROM class_types WHERE name='Yoga'), 2, 2;

-- Full Experience: 8 Sculpt-Funcional + 6 Surf-Pilates + 2 Yoga = 16
INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Full Experience', 4900.00, 'MXN', 30, 16, 'Mixto · 8 Sculpt-Funcional, 6 Surf-Pilates, 2 Yoga', '["16 clases","8 Sculpt-Funcional","6 Surf-Pilates","2 Yoga","Vigencia 30 días"]'::jsonb, true, 32);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Full Experience'), ARRAY(SELECT id FROM class_types WHERE name='Sculpt-Funcional'), 8, 0;
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Full Experience'), ARRAY(SELECT id FROM class_types WHERE name='Surf-Pilates'), 6, 1;
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Full Experience'), ARRAY(SELECT id FROM class_types WHERE name='Yoga'), 2, 2;

-- Sunrise Sunset Combo: ilimitadas, cualquiera de los 3 tipos
INSERT INTO plans (name, price, currency, duration_days, class_limit, description, features, is_active, sort_order)
VALUES ('Sunrise Sunset Combo', 5600.00, 'MXN', 30, NULL, 'Mixto · ilimitadas (los 3 tipos)', '["Clases ilimitadas","Sculpt-Funcional, Surf-Pilates o Yoga","Vigencia 30 días"]'::jsonb, true, 33);
INSERT INTO plan_credit_buckets (plan_id, allowed_class_type_ids, credit_count, sort_order)
SELECT (SELECT id FROM plans WHERE name='Sunrise Sunset Combo'),
       ARRAY(SELECT id FROM class_types WHERE name IN ('Sculpt-Funcional','Surf-Pilates','Yoga')), NULL, 0;
