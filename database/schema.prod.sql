--
-- PostgreSQL database dump
--

\restrict 5r5g3FadbqBvUxayGDH1eKW5u8ZgYxqcdzF0wfnetv4B799xmOJUSPAnCupEImE

-- Dumped from database version 18.4 (Debian 18.4-1.pgdg13+1)
-- Dumped by pg_dump version 18.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_status AS ENUM (
    'confirmed',
    'waitlist',
    'checked_in',
    'no_show',
    'cancelled'
);


--
-- Name: checkin_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.checkin_method AS ENUM (
    'qr_scan',
    'manual_reception',
    'self_checkin',
    'nfc_tap',
    'wallet_scan'
);


--
-- Name: class_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.class_level AS ENUM (
    'beginner',
    'intermediate',
    'advanced',
    'all'
);


--
-- Name: class_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.class_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
);


--
-- Name: egreso_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.egreso_category AS ENUM (
    'nomina',
    'servicios',
    'marketing',
    'renta',
    'internet',
    'insumos',
    'mantenimiento',
    'seguros',
    'otros'
);


--
-- Name: egreso_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.egreso_status AS ENUM (
    'pendiente',
    'pagado',
    'cancelado'
);


--
-- Name: event_registration_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_registration_status AS ENUM (
    'confirmed',
    'pending',
    'waitlist',
    'cancelled',
    'no_show'
);


--
-- Name: event_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_status AS ENUM (
    'draft',
    'published',
    'cancelled',
    'completed'
);


--
-- Name: event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_type AS ENUM (
    'masterclass',
    'workshop',
    'retreat',
    'challenge',
    'openhouse',
    'special'
);


--
-- Name: loyalty_points_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.loyalty_points_type AS ENUM (
    'class_attended',
    'referral',
    'bonus',
    'redemption'
);


--
-- Name: membership_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.membership_status AS ENUM (
    'pending_payment',
    'pending_activation',
    'active',
    'expired',
    'paused',
    'cancelled'
);


--
-- Name: notification_channel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_channel AS ENUM (
    'apple',
    'google'
);


--
-- Name: notification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_status AS ENUM (
    'pending',
    'sent',
    'failed'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'booking_reminder',
    'class_cancelled',
    'membership_expiring',
    'points_earned',
    'promotion',
    'coach_assigned',
    'coach_removed',
    'coach_substituted',
    'class_updated'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending_payment',
    'pending_verification',
    'approved',
    'rejected',
    'expired',
    'cancelled'
);


--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'cash',
    'transfer',
    'card',
    'online',
    'bank_transfer'
);


--
-- Name: redemption_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.redemption_status AS ENUM (
    'pending',
    'fulfilled',
    'cancelled'
);


--
-- Name: response_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.response_type AS ENUM (
    'thank_you',
    'apology',
    'explanation',
    'offer',
    'follow_up'
);


--
-- Name: review_request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.review_request_status AS ENUM (
    'pending',
    'sent',
    'completed',
    'expired'
);


--
-- Name: review_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.review_status AS ENUM (
    'pending',
    'published',
    'hidden',
    'flagged',
    'removed'
);


--
-- Name: reward_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reward_category AS ENUM (
    'merchandise',
    'class',
    'discount',
    'experience'
);


--
-- Name: suspicious_activity_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.suspicious_activity_type AS ENUM (
    'multiple_devices',
    'rapid_checkins',
    'location_mismatch',
    'duplicate_qr_attempt',
    'invalid_qr',
    'device_clone_suspected'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'client',
    'instructor',
    'admin',
    'super_admin',
    'reception'
);


--
-- Name: TYPE user_role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.user_role IS 'Roles de usuario: client (cliente), instructor (instructor), admin (administrador), super_admin (super administrador), reception (recepción)';


--
-- Name: video_purchase_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.video_purchase_status AS ENUM (
    'pending_payment',
    'pending_verification',
    'approved',
    'rejected',
    'expired'
);


--
-- Name: wallet_platform; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.wallet_platform AS ENUM (
    'apple',
    'google'
);


--
-- Name: award_review_points(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.award_review_points() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    points_for_review INTEGER := 50;
    bonus_for_comment INTEGER := 25;
    total_points INTEGER;
BEGIN
    -- Solo cuando se publica una reseña nueva
    IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
        total_points := points_for_review;

        -- Bonus por comentario de más de 50 caracteres
        IF NEW.comment_length > 50 THEN
            total_points := total_points + bonus_for_comment;
        END IF;

        -- Insertar puntos de lealtad
        INSERT INTO loyalty_points (user_id, points, type, description, related_booking_id)
        VALUES (
            NEW.user_id,
            total_points,
            'bonus',
            CASE
                WHEN NEW.comment_length > 50 THEN 'Reseña con comentario detallado'
                ELSE 'Reseña de clase'
            END,
            NEW.booking_id
        );

        -- Actualizar la reseña con los puntos
        NEW.points_earned := total_points;
        NEW.points_awarded_at := CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION award_review_points(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.award_review_points() IS 'Trigger que otorga puntos de lealtad cuando se publica una reseña';


--
-- Name: calculate_distance_from_studio(numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_distance_from_studio(p_lat numeric, p_lon numeric) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    studio_lat DECIMAL := 19.4326;  -- TODO: Obtener de settings
    studio_lon DECIMAL := -99.1332;
    R DECIMAL := 6371000; -- Radio de la tierra en metros
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := radians(p_lat - studio_lat);
    dlon := radians(p_lon - studio_lon);

    a := sin(dlat/2) * sin(dlat/2) +
         cos(radians(studio_lat)) * cos(radians(p_lat)) *
         sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));

    RETURN R * c;
END;
$$;


--
-- Name: FUNCTION calculate_distance_from_studio(p_lat numeric, p_lon numeric); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_distance_from_studio(p_lat numeric, p_lon numeric) IS 'Calcula distancia en metros desde coordenadas hasta el estudio';


--
-- Name: create_review_request(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_review_request() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    class_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Solo cuando el status cambia a checked_in
    IF NEW.status = 'checked_in' AND (OLD IS NULL OR OLD.status != 'checked_in') THEN
        -- Obtener hora de fin de la clase
        SELECT (c.date + c.end_time)::timestamp with time zone
        INTO class_end
        FROM classes c
        WHERE c.id = NEW.class_id;

        -- Crear solicitud de reseña para 2 horas después de que termine la clase
        INSERT INTO review_requests (
            booking_id, user_id, class_id,
            class_ended_at, send_at, status
        ) VALUES (
            NEW.id, NEW.user_id, NEW.class_id,
            class_end,
            class_end + INTERVAL '2 hours',
            'pending'
        )
        ON CONFLICT (booking_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION create_review_request(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_review_request() IS 'Trigger que crea solicitud de reseña después del check-in';


--
-- Name: detect_suspicious_checkin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.detect_suspicious_checkin() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    recent_checkins_count INTEGER;
    different_devices_count INTEGER;
    studio_lat DECIMAL := 19.4326;  -- Configurar con lat real
    studio_lon DECIMAL := -99.1332; -- Configurar con lon real
    max_distance DECIMAL := 500;     -- 500 metros
BEGIN
    -- Verificar check-ins rápidos (< 5 minutos) del mismo usuario
    SELECT COUNT(*) INTO recent_checkins_count
    FROM checkin_logs
    WHERE user_id = NEW.user_id
    AND checked_in_at > (NEW.checked_in_at - INTERVAL '5 minutes')
    AND id != NEW.id;

    IF recent_checkins_count > 0 THEN
        INSERT INTO suspicious_activity (
            user_id, booking_id, checkin_log_id,
            activity_type, severity, description, evidence
        ) VALUES (
            NEW.user_id, NEW.booking_id, NEW.id,
            'rapid_checkins', 'medium',
            'Múltiples check-ins en menos de 5 minutos',
            jsonb_build_object(
                'recent_count', recent_checkins_count + 1,
                'device_id', NEW.device_id,
                'ip', NEW.ip_address::text
            )
        );
    END IF;

    -- Verificar múltiples dispositivos en las últimas 24 horas
    IF NEW.device_id IS NOT NULL THEN
        SELECT COUNT(DISTINCT device_id) INTO different_devices_count
        FROM checkin_logs
        WHERE user_id = NEW.user_id
        AND device_id IS NOT NULL
        AND checked_in_at > (NEW.checked_in_at - INTERVAL '24 hours');

        IF different_devices_count > 2 THEN
            INSERT INTO suspicious_activity (
                user_id, booking_id, checkin_log_id,
                activity_type, severity, description, evidence
            ) VALUES (
                NEW.user_id, NEW.booking_id, NEW.id,
                'multiple_devices', 'high',
                'Check-in desde múltiples dispositivos en 24 horas',
                jsonb_build_object(
                    'device_count', different_devices_count,
                    'current_device', NEW.device_id,
                    'device_type', NEW.device_type
                )
            );
        END IF;
    END IF;

    -- Verificar distancia del estudio (si tenemos geolocalización)
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        IF NEW.distance_from_studio > max_distance THEN
            INSERT INTO suspicious_activity (
                user_id, booking_id, checkin_log_id,
                activity_type, severity, description, evidence
            ) VALUES (
                NEW.user_id, NEW.booking_id, NEW.id,
                'location_mismatch', 'high',
                'Check-in desde ubicación lejana al estudio',
                jsonb_build_object(
                    'distance_meters', NEW.distance_from_studio,
                    'latitude', NEW.latitude,
                    'longitude', NEW.longitude,
                    'accuracy', NEW.location_accuracy
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION detect_suspicious_checkin(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.detect_suspicious_checkin() IS 'Trigger que detecta automáticamente actividad sospechosa en check-ins';


--
-- Name: generate_coach_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_coach_number() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_number VARCHAR(20);
    max_num INTEGER;
BEGIN
    -- Get the highest existing coach number
    SELECT COALESCE(MAX(CAST(SUBSTRING(coach_number FROM 7) AS INTEGER)), 0) 
    INTO max_num
    FROM instructors 
    WHERE coach_number IS NOT NULL;
    
    -- Generate new coach number
    new_number := 'COACH-' || LPAD((max_num + 1)::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$;


--
-- Name: generate_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_order_number() RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
    new_order_number TEXT;
    year_prefix TEXT;
    sequence_num INTEGER;
BEGIN
    year_prefix := 'BS' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-';
    
    -- Obtener siguiente número
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM orders
    WHERE order_number LIKE year_prefix || '%';
    
    new_order_number := year_prefix || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN new_order_number;
END;
$_$;


--
-- Name: get_review_conversion_rate(date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_review_conversion_rate(p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), p_end_date date DEFAULT CURRENT_DATE) RETURNS TABLE(total_completed_classes bigint, total_reviews bigint, conversion_rate numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT b.id) as total_completed_classes,
        COUNT(DISTINCT r.id) as total_reviews,
        ROUND(
            (COUNT(DISTINCT r.id)::numeric /
            NULLIF(COUNT(DISTINCT b.id), 0) * 100), 2
        ) as conversion_rate
    FROM bookings b
    JOIN classes c ON b.class_id = c.id
    LEFT JOIN reviews r ON b.id = r.booking_id
    WHERE b.status = 'checked_in'
    AND c.date BETWEEN p_start_date AND p_end_date;
END;
$$;


--
-- Name: FUNCTION get_review_conversion_rate(p_start_date date, p_end_date date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_review_conversion_rate(p_start_date date, p_end_date date) IS 'Calcula tasa de conversión de reseñas en un período';


--
-- Name: get_top_review_tags(integer, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_top_review_tags(p_limit integer DEFAULT 10, p_instructor_id uuid DEFAULT NULL::uuid) RETURNS TABLE(tag_id uuid, tag_name character varying, tag_icon character varying, category character varying, usage_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        rt.id,
        rt.name,
        rt.icon,
        rt.category,
        COUNT(rts.id) as usage_count
    FROM review_tags rt
    LEFT JOIN review_tag_selections rts ON rt.id = rts.tag_id
    LEFT JOIN reviews r ON rts.review_id = r.id
    WHERE rt.is_active = true
    AND (p_instructor_id IS NULL OR r.instructor_id = p_instructor_id)
    GROUP BY rt.id, rt.name, rt.icon, rt.category
    ORDER BY usage_count DESC
    LIMIT p_limit;
END;
$$;


--
-- Name: FUNCTION get_top_review_tags(p_limit integer, p_instructor_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_top_review_tags(p_limit integer, p_instructor_id uuid) IS 'Obtiene los tags más usados, opcionalmente filtrado por instructor';


--
-- Name: get_user_points(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_points(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_points INTEGER;
BEGIN
    SELECT COALESCE(SUM(points), 0) INTO total_points
    FROM loyalty_points
    WHERE user_id = p_user_id;
    RETURN total_points;
END;
$$;


--
-- Name: set_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_order_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_class_booking_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_class_booking_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status IN ('confirmed', 'checked_in') THEN
            UPDATE classes SET current_bookings = current_bookings + 1 WHERE id = NEW.class_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status NOT IN ('confirmed', 'checked_in') AND NEW.status IN ('confirmed', 'checked_in') THEN
            UPDATE classes SET current_bookings = current_bookings + 1 WHERE id = NEW.class_id;
        ELSIF OLD.status IN ('confirmed', 'checked_in') AND NEW.status NOT IN ('confirmed', 'checked_in') THEN
            UPDATE classes SET current_bookings = GREATEST(current_bookings - 1, 0) WHERE id = NEW.class_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status IN ('confirmed', 'checked_in') THEN
            UPDATE classes SET current_bookings = GREATEST(current_bookings - 1, 0) WHERE id = OLD.class_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_event_registration_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_event_registration_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status IN ('confirmed', 'pending') THEN
            UPDATE events 
            SET registered = registered + 1 
            WHERE id = NEW.event_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status NOT IN ('confirmed', 'pending') AND NEW.status IN ('confirmed', 'pending') THEN
            UPDATE events 
            SET registered = registered + 1 
            WHERE id = NEW.event_id;
        ELSIF OLD.status IN ('confirmed', 'pending') AND NEW.status NOT IN ('confirmed', 'pending') THEN
            UPDATE events 
            SET registered = GREATEST(registered - 1, 0) 
            WHERE id = NEW.event_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status IN ('confirmed', 'pending') THEN
            UPDATE events 
            SET registered = GREATEST(registered - 1, 0) 
            WHERE id = OLD.event_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_template_uses_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_template_uses_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE workout_templates SET uses_count = uses_count + 1 WHERE id = NEW.template_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE workout_templates SET uses_count = uses_count - 1 WHERE id = OLD.template_id;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memberships (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status public.membership_status DEFAULT 'pending_payment'::public.membership_status NOT NULL,
    classes_remaining integer,
    start_date date,
    end_date date,
    activated_by uuid,
    activated_at timestamp with time zone,
    payment_method public.payment_method,
    payment_reference character varying(255),
    paused_at timestamp with time zone,
    pause_reason text,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    order_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    cancellations_used integer DEFAULT 0 NOT NULL,
    cancellation_limit integer
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'MXN'::character varying,
    duration_days integer NOT NULL,
    class_limit integer,
    features jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    display_name character varying(255) NOT NULL,
    photo_url text,
    role public.user_role DEFAULT 'client'::public.user_role NOT NULL,
    emergency_contact_name character varying(255),
    emergency_contact_phone character varying(20),
    health_notes text,
    accepts_communications boolean DEFAULT false,
    date_of_birth date,
    receive_reminders boolean DEFAULT true,
    receive_promotions boolean DEFAULT false,
    receive_weekly_summary boolean DEFAULT false,
    firebase_uid character varying(128),
    instructor_notes text,
    alert_flag boolean DEFAULT false,
    alert_message character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_prospect boolean DEFAULT false NOT NULL,
    prospect_created_by uuid,
    converted_at timestamp with time zone,
    password_hash character varying(255),
    loyalty_points integer DEFAULT 0 NOT NULL
);


--
-- Name: active_memberships_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_memberships_view AS
 SELECT m.id AS membership_id,
    m.status,
    m.classes_remaining,
    m.start_date,
    m.end_date,
    u.id AS user_id,
    u.email,
    u.display_name,
    u.phone,
    p.name AS plan_name,
    p.class_limit AS plan_class_limit
   FROM ((public.memberships m
     JOIN public.users u ON ((m.user_id = u.id)))
     JOIN public.plans p ON ((m.plan_id = p.id)))
  WHERE (m.status = 'active'::public.membership_status);


--
-- Name: admin_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_actions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    admin_user_id uuid NOT NULL,
    action_type character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    description text,
    old_data jsonb,
    new_data jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: admin_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_notes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    created_by uuid NOT NULL,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: apple_wallet_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apple_wallet_devices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    device_id character varying(255) NOT NULL,
    push_token character varying(255) NOT NULL,
    pass_type_id character varying(255) NOT NULL,
    membership_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: apple_wallet_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apple_wallet_updates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    membership_id uuid NOT NULL,
    classes_old integer,
    classes_new integer,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    user_id uuid NOT NULL,
    membership_id uuid,
    status public.booking_status DEFAULT 'confirmed'::public.booking_status NOT NULL,
    waitlist_position integer,
    checked_in_at timestamp with time zone,
    checked_in_by uuid,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    credit_bucket_id uuid,
    cancelled_by uuid
);


--
-- Name: checkin_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checkin_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    user_id uuid NOT NULL,
    class_id uuid NOT NULL,
    membership_id uuid,
    checkin_method public.checkin_method DEFAULT 'qr_scan'::public.checkin_method NOT NULL,
    checked_in_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    checked_in_by uuid,
    device_id character varying(255),
    device_type character varying(100),
    device_model character varying(100),
    app_version character varying(20),
    ip_address inet,
    user_agent text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    location_accuracy numeric(6,2),
    distance_from_studio numeric(8,2),
    qr_code_used character varying(255),
    qr_generated_at timestamp with time zone,
    is_late boolean DEFAULT false,
    minutes_early_late integer,
    is_first_class boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE checkin_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.checkin_logs IS 'Log detallado de todos los check-ins con tracking de dispositivo y ubicación';


--
-- Name: checkin_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.checkin_stats AS
 SELECT date(checked_in_at) AS date,
    count(*) AS total_checkins,
    count(DISTINCT user_id) AS unique_users,
    count(DISTINCT class_id) AS classes_with_checkins,
    count(*) FILTER (WHERE (checkin_method = 'qr_scan'::public.checkin_method)) AS qr_checkins,
    count(*) FILTER (WHERE (checkin_method = 'manual_reception'::public.checkin_method)) AS manual_checkins,
    count(*) FILTER (WHERE (checkin_method = 'self_checkin'::public.checkin_method)) AS self_checkins,
    count(*) FILTER (WHERE (is_late = true)) AS late_checkins,
    count(*) FILTER (WHERE (is_late = false)) AS on_time_checkins,
    round(avg(minutes_early_late), 1) AS avg_minutes_early_late,
    count(*) FILTER (WHERE (is_first_class = true)) AS first_time_users
   FROM public.checkin_logs
  GROUP BY (date(checked_in_at))
  ORDER BY (date(checked_in_at)) DESC;


--
-- Name: class_substitutions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_substitutions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    original_instructor_id uuid NOT NULL,
    substitute_instructor_id uuid,
    reason text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    requested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    responded_at timestamp with time zone,
    response_note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT class_substitutions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: class_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    level public.class_level DEFAULT 'all'::public.class_level,
    duration_minutes integer DEFAULT 60 NOT NULL,
    max_capacity integer DEFAULT 8 NOT NULL,
    icon character varying(50),
    color character varying(7),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: class_workouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_workouts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    template_id uuid NOT NULL,
    assigned_by uuid NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE class_workouts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.class_workouts IS 'Links workout templates to specific class instances';


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    schedule_id uuid,
    class_type_id uuid NOT NULL,
    instructor_id uuid NOT NULL,
    facility_id uuid,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    max_capacity integer DEFAULT 8 NOT NULL,
    current_bookings integer DEFAULT 0,
    status public.class_status DEFAULT 'scheduled'::public.class_status,
    level public.class_level,
    notes text,
    cancellation_reason text,
    cancelled_by uuid,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: coach_playlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coach_playlists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    instructor_id uuid NOT NULL,
    class_type_id uuid,
    name character varying(255) NOT NULL,
    description text,
    platform character varying(50) DEFAULT 'spotify'::character varying NOT NULL,
    url text NOT NULL,
    duration_minutes integer,
    is_public boolean DEFAULT false,
    is_favorite boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    thumbnail_url text,
    CONSTRAINT coach_playlists_platform_check CHECK (((platform)::text = ANY ((ARRAY['spotify'::character varying, 'apple_music'::character varying, 'youtube'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: coach_substitutions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coach_substitutions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    original_instructor_id uuid NOT NULL,
    new_instructor_id uuid NOT NULL,
    reason text,
    substituted_by uuid NOT NULL,
    notified_original boolean DEFAULT false,
    notified_new boolean DEFAULT false,
    notified_clients boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: cron_job_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cron_job_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    job_name character varying(100),
    status character varying(20),
    message text,
    duration_ms integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: discount_code_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_code_plans (
    discount_code_id uuid NOT NULL,
    plan_id uuid NOT NULL
);


--
-- Name: discount_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_codes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    description text DEFAULT ''::text,
    discount_type character varying(20) NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    max_uses integer,
    current_uses integer DEFAULT 0 NOT NULL,
    valid_from timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    valid_until timestamp with time zone,
    min_purchase numeric(10,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT discount_codes_discount_type_check CHECK (((discount_type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying])::text[])))
);


--
-- Name: egresos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.egresos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category public.egreso_category NOT NULL,
    concept character varying(255) NOT NULL,
    description text,
    amount numeric(12,2) NOT NULL,
    currency character varying(3) DEFAULT 'MXN'::character varying NOT NULL,
    status public.egreso_status DEFAULT 'pendiente'::public.egreso_status NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    paid_at timestamp with time zone,
    is_recurring boolean DEFAULT false NOT NULL,
    recurring_day integer,
    receipt_url text,
    receipt_file_name character varying(255),
    distribution jsonb DEFAULT '{}'::jsonb,
    vendor character varying(255),
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT egresos_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT egresos_recurring_day_check CHECK (((recurring_day >= 1) AND (recurring_day <= 31)))
);


--
-- Name: egresos_monthly_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.egresos_monthly_summary AS
 SELECT date_trunc('month'::text, (date)::timestamp with time zone) AS month,
    category,
    count(*) AS count,
    sum(amount) AS total,
    sum(
        CASE
            WHEN (status = 'pagado'::public.egreso_status) THEN amount
            ELSE (0)::numeric
        END) AS paid_total,
    sum(
        CASE
            WHEN (status = 'pendiente'::public.egreso_status) THEN amount
            ELSE (0)::numeric
        END) AS pending_total
   FROM public.egresos
  WHERE (status <> 'cancelado'::public.egreso_status)
  GROUP BY (date_trunc('month'::text, (date)::timestamp with time zone)), category
  ORDER BY (date_trunc('month'::text, (date)::timestamp with time zone)) DESC, category;


--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_registrations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    status public.event_registration_status DEFAULT 'pending'::public.event_registration_status NOT NULL,
    amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    payment_method public.payment_method,
    payment_reference character varying(255),
    paid_at timestamp with time zone,
    checked_in boolean DEFAULT false,
    checked_in_at timestamp with time zone,
    checked_in_by uuid,
    waitlist_position integer,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    payment_proof_url text,
    payment_proof_file_name character varying(255),
    transfer_date date
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type public.event_type DEFAULT 'special'::public.event_type NOT NULL,
    status public.event_status DEFAULT 'draft'::public.event_status NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    location character varying(255) DEFAULT 'Catarsis Studio'::character varying,
    capacity integer DEFAULT 20 NOT NULL,
    registered integer DEFAULT 0 NOT NULL,
    price numeric(10,2) DEFAULT 0.00 NOT NULL,
    currency character varying(3) DEFAULT 'MXN'::character varying,
    early_bird_price numeric(10,2),
    early_bird_deadline date,
    member_discount integer DEFAULT 0,
    image text,
    instructor_id uuid,
    instructor_name character varying(255),
    instructor_photo text,
    requirements text,
    includes jsonb DEFAULT '[]'::jsonb,
    tags jsonb DEFAULT '[]'::jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    waitlist_enabled boolean DEFAULT true NOT NULL,
    required_payment boolean DEFAULT true NOT NULL,
    wallet_pass boolean DEFAULT true NOT NULL,
    auto_reminders boolean DEFAULT false NOT NULL,
    allow_cancellations boolean DEFAULT false NOT NULL
);


--
-- Name: facilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facilities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    capacity integer DEFAULT 8 NOT NULL,
    equipment jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: guest_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest_bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    guest_name character varying(255) NOT NULL,
    guest_email character varying(255),
    guest_phone character varying(20) NOT NULL,
    confirmation_code character varying(20) NOT NULL,
    status public.booking_status DEFAULT 'confirmed'::public.booking_status NOT NULL,
    payment_method public.payment_method NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'MXN'::character varying,
    payment_reference character varying(255),
    notes text,
    checked_in_at timestamp with time zone,
    checked_in_by uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE guest_bookings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.guest_bookings IS 'Bookings for walk-in guests without memberships';


--
-- Name: COLUMN guest_bookings.confirmation_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.guest_bookings.confirmation_code IS 'Unique confirmation code for the booking';


--
-- Name: instructor_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructor_availability (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    instructor_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT instructor_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: instructors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    display_name character varying(255) NOT NULL,
    bio text,
    photo_url text,
    specialties jsonb DEFAULT '[]'::jsonb,
    certifications jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    pay_rate_per_class numeric(10,2),
    pay_rate_per_hour numeric(10,2),
    permissions jsonb DEFAULT '{"can_checkin": true, "can_edit_profile": true, "can_view_client_notes": true}'::jsonb,
    phone character varying(20),
    email character varying(255),
    visible_public boolean DEFAULT true,
    coach_number character varying(20),
    password_hash character varying(255),
    temp_password boolean DEFAULT false,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: COLUMN instructors.visible_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.instructors.visible_public IS 'Whether this instructor is visible on the public website';


--
-- Name: COLUMN instructors.coach_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.instructors.coach_number IS 'Unique identifier for coach login (e.g., COACH-0001)';


--
-- Name: COLUMN instructors.password_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.instructors.password_hash IS 'Bcrypt hashed password for coach portal access';


--
-- Name: COLUMN instructors.temp_password; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.instructors.temp_password IS 'Flag indicating if current password is temporary (must change on first login)';


--
-- Name: COLUMN instructors.last_login; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.instructors.last_login IS 'Timestamp of last successful login to coach portal';


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    user_id uuid NOT NULL,
    class_id uuid NOT NULL,
    instructor_id uuid NOT NULL,
    overall_rating smallint NOT NULL,
    instructor_rating smallint,
    difficulty_rating smallint,
    ambiance_rating smallint,
    comment text,
    comment_length integer GENERATED ALWAYS AS (COALESCE(length(comment), 0)) STORED,
    status public.review_status DEFAULT 'published'::public.review_status NOT NULL,
    is_anonymous boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    points_earned integer DEFAULT 0,
    points_awarded_at timestamp with time zone,
    flagged_at timestamp with time zone,
    flagged_reason text,
    moderated_by uuid,
    moderated_at timestamp with time zone,
    submitted_from character varying(50),
    notification_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    punctuality_rating integer,
    would_recommend boolean,
    would_repeat boolean,
    CONSTRAINT reviews_ambiance_rating_check CHECK (((ambiance_rating >= 1) AND (ambiance_rating <= 5))),
    CONSTRAINT reviews_difficulty_rating_check CHECK (((difficulty_rating >= 1) AND (difficulty_rating <= 5))),
    CONSTRAINT reviews_instructor_rating_check CHECK (((instructor_rating >= 1) AND (instructor_rating <= 5))),
    CONSTRAINT reviews_overall_rating_check CHECK (((overall_rating >= 1) AND (overall_rating <= 5)))
);


--
-- Name: TABLE reviews; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.reviews IS 'Reseñas de clases con ratings múltiples y sistema de puntos';


--
-- Name: instructor_ratings; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.instructor_ratings AS
 SELECT i.id AS instructor_id,
    i.display_name AS instructor_name,
    i.photo_url,
    count(r.id) AS total_reviews,
    round(avg(r.overall_rating), 2) AS avg_overall_rating,
    round(avg(r.instructor_rating), 2) AS avg_instructor_rating,
    round(avg(r.difficulty_rating), 2) AS avg_difficulty_rating,
    count(*) FILTER (WHERE (r.overall_rating = 5)) AS five_star_count,
    count(*) FILTER (WHERE (r.overall_rating = 4)) AS four_star_count,
    count(*) FILTER (WHERE (r.overall_rating = 3)) AS three_star_count,
    count(*) FILTER (WHERE (r.overall_rating <= 2)) AS low_rating_count,
    round((((count(*) FILTER (WHERE (r.overall_rating >= 4)))::numeric / (NULLIF(count(r.id), 0))::numeric) * (100)::numeric), 1) AS satisfaction_percentage,
    max(r.created_at) AS last_review_at
   FROM (public.instructors i
     LEFT JOIN public.reviews r ON (((i.id = r.instructor_id) AND (r.status = 'published'::public.review_status))))
  WHERE (i.is_active = true)
  GROUP BY i.id, i.display_name, i.photo_url
  ORDER BY (round(avg(r.overall_rating), 2)) DESC NULLS LAST;


--
-- Name: instructor_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.instructor_stats AS
 SELECT i.id AS instructor_id,
    i.display_name,
    count(DISTINCT c.id) AS total_classes_taught,
    count(DISTINCT b.id) AS total_bookings,
    count(DISTINCT
        CASE
            WHEN (b.status = 'checked_in'::public.booking_status) THEN b.id
            ELSE NULL::uuid
        END) AS total_checkins,
    round(
        CASE
            WHEN (count(DISTINCT b.id) > 0) THEN (((count(DISTINCT
            CASE
                WHEN (b.status = 'checked_in'::public.booking_status) THEN b.id
                ELSE NULL::uuid
            END))::numeric / (count(DISTINCT b.id))::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END, 1) AS attendance_rate,
    count(DISTINCT
        CASE
            WHEN (c.date = CURRENT_DATE) THEN c.id
            ELSE NULL::uuid
        END) AS classes_today,
    count(DISTINCT
        CASE
            WHEN ((c.date >= date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone)) AND (c.date < (date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone) + '7 days'::interval))) THEN c.id
            ELSE NULL::uuid
        END) AS classes_this_week
   FROM ((public.instructors i
     LEFT JOIN public.classes c ON (((c.instructor_id = i.id) AND (c.status <> 'cancelled'::public.class_status))))
     LEFT JOIN public.bookings b ON (((b.class_id = c.id) AND (b.status <> 'cancelled'::public.booking_status))))
  WHERE (i.is_active = true)
  GROUP BY i.id, i.display_name;


--
-- Name: loyalty_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_points (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    points integer NOT NULL,
    type public.loyalty_points_type NOT NULL,
    description text,
    related_booking_id uuid,
    related_reward_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: loyalty_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_redemptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    reward_id uuid,
    points_spent integer NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    redeemed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: loyalty_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_rewards (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    points_cost integer NOT NULL,
    reward_type character varying(50) DEFAULT 'discount'::character varying NOT NULL,
    reward_value text,
    is_active boolean DEFAULT true NOT NULL,
    stock integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: membership_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membership_credits (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    membership_id uuid NOT NULL,
    allowed_class_type_ids uuid[] NOT NULL,
    remaining integer,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notification_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    membership_id uuid,
    type character varying(50) NOT NULL,
    platform character varying(20),
    title character varying(255),
    body text,
    status character varying(50) DEFAULT 'sent'::character varying,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    membership_id uuid NOT NULL,
    title character varying(255),
    message text NOT NULL,
    channel public.notification_channel NOT NULL,
    status public.notification_status DEFAULT 'pending'::public.notification_status NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    type public.notification_type NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: order_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_number character varying(20),
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status public.order_status DEFAULT 'pending_payment'::public.order_status NOT NULL,
    payment_method public.payment_method DEFAULT 'transfer'::public.payment_method NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'MXN'::character varying,
    bank_info jsonb,
    notes text,
    admin_notes text,
    rejection_reason text,
    expires_at timestamp with time zone,
    paid_at timestamp with time zone,
    approved_at timestamp with time zone,
    rejected_at timestamp with time zone,
    approved_by uuid,
    rejected_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    tax_rate numeric(5,4) DEFAULT 0,
    customer_notes text,
    discount_code_id uuid,
    discount_amount numeric(10,2),
    membership_id uuid,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    cancelled_at timestamp with time zone
);


--
-- Name: orders_dashboard_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.orders_dashboard_stats AS
 SELECT count(*) FILTER (WHERE (status = 'pending_verification'::public.order_status)) AS pending_verification_count,
    count(*) FILTER (WHERE (status = 'pending_payment'::public.order_status)) AS pending_payment_count,
    count(*) FILTER (WHERE ((status = 'approved'::public.order_status) AND (date(approved_at) = CURRENT_DATE))) AS approved_today,
    count(*) FILTER (WHERE ((status = 'rejected'::public.order_status) AND (date(rejected_at) = CURRENT_DATE))) AS rejected_today,
    COALESCE(sum(total_amount) FILTER (WHERE ((status = 'approved'::public.order_status) AND (date(approved_at) = CURRENT_DATE))), (0)::numeric) AS revenue_today,
    COALESCE(sum(total_amount) FILTER (WHERE ((status = 'approved'::public.order_status) AND (approved_at >= date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone)))), (0)::numeric) AS revenue_week,
    COALESCE(sum(total_amount) FILTER (WHERE ((status = 'approved'::public.order_status) AND (approved_at >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)))), (0)::numeric) AS revenue_month,
    count(*) FILTER (WHERE (date(created_at) = CURRENT_DATE)) AS orders_today
   FROM public.orders;


--
-- Name: payment_proofs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_proofs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    file_url text NOT NULL,
    file_name character varying(255),
    file_size integer,
    mime_type character varying(100),
    last_four_digits character varying(4),
    bank_reference character varying(100),
    amount_shown numeric(10,2),
    status character varying(50) DEFAULT 'pending'::character varying,
    rejection_reason text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    file_type character varying(100),
    additional_notes text,
    validated_by uuid,
    validated_at timestamp with time zone,
    validation_notes text,
    CONSTRAINT payment_proofs_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: orders_with_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.orders_with_details AS
 SELECT o.id,
    o.order_number,
    o.status,
    o.payment_method,
    o.subtotal,
    o.tax_amount,
    o.total_amount,
    o.currency,
    o.created_at,
    o.paid_at,
    o.approved_at,
    o.rejected_at,
    o.rejection_reason,
    o.expires_at,
    u.id AS user_id,
    u.display_name AS user_name,
    u.email AS user_email,
    u.phone AS user_phone,
    p.id AS plan_id,
    p.name AS plan_name,
    p.class_limit AS plan_classes,
    p.duration_days AS plan_duration,
    pp.id AS proof_id,
    pp.file_url AS proof_url,
    pp.status AS proof_status,
    pp.uploaded_at AS proof_uploaded_at,
    pp.last_four_digits,
    pp.bank_reference,
    (EXTRACT(epoch FROM (CURRENT_TIMESTAMP - o.created_at)) / (3600)::numeric) AS hours_since_created,
    (EXTRACT(epoch FROM (CURRENT_TIMESTAMP - pp.uploaded_at)) / (3600)::numeric) AS hours_since_proof
   FROM (((public.orders o
     JOIN public.users u ON ((o.user_id = u.id)))
     JOIN public.plans p ON ((o.plan_id = p.id)))
     LEFT JOIN LATERAL ( SELECT payment_proofs.id,
            payment_proofs.order_id,
            payment_proofs.file_url,
            payment_proofs.file_name,
            payment_proofs.file_size,
            payment_proofs.mime_type,
            payment_proofs.last_four_digits,
            payment_proofs.bank_reference,
            payment_proofs.amount_shown,
            payment_proofs.status,
            payment_proofs.rejection_reason,
            payment_proofs.reviewed_by,
            payment_proofs.reviewed_at,
            payment_proofs.uploaded_at,
            payment_proofs.updated_at
           FROM public.payment_proofs
          WHERE (payment_proofs.order_id = o.id)
          ORDER BY payment_proofs.uploaded_at DESC
         LIMIT 1) pp ON (true));


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payment_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payment_id uuid NOT NULL,
    event_type character varying(60) NOT NULL,
    from_status character varying(50),
    to_status character varying(50),
    payload jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    membership_id uuid,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'MXN'::character varying,
    payment_method public.payment_method NOT NULL,
    reference character varying(255),
    notes text,
    status character varying(50) DEFAULT 'completed'::character varying,
    processed_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    provider character varying(40),
    order_id uuid,
    clip_payment_request_id character varying(120),
    clip_checkout_url text,
    clip_receipt_no character varying(120),
    clip_auth_code character varying(60),
    clip_card_brand character varying(20),
    clip_card_last4 character varying(4),
    reference_id character varying(120),
    expires_at timestamp with time zone,
    completed_at timestamp with time zone,
    raw_webhook jsonb
);


--
-- Name: review_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    user_id uuid NOT NULL,
    class_id uuid NOT NULL,
    class_ended_at timestamp with time zone NOT NULL,
    send_at timestamp with time zone NOT NULL,
    sent_at timestamp with time zone,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    channel character varying(20) DEFAULT 'push'::character varying NOT NULL,
    reminder_count integer DEFAULT 0,
    last_reminder_at timestamp with time zone,
    review_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE review_requests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.review_requests IS 'Cola de solicitudes de reseña pendientes de enviar';


--
-- Name: pending_review_classes; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.pending_review_classes AS
 SELECT b.id AS booking_id,
    b.user_id,
    u.display_name AS user_name,
    u.email,
    c.id AS class_id,
    c.date AS class_date,
    c.start_time,
    ct.name AS class_type,
    i.display_name AS instructor_name,
    rr.status AS request_status,
    rr.send_at,
    rr.reminder_count
   FROM ((((((public.bookings b
     JOIN public.users u ON ((b.user_id = u.id)))
     JOIN public.classes c ON ((b.class_id = c.id)))
     JOIN public.class_types ct ON ((c.class_type_id = ct.id)))
     JOIN public.instructors i ON ((c.instructor_id = i.id)))
     LEFT JOIN public.reviews r ON ((b.id = r.booking_id)))
     LEFT JOIN public.review_requests rr ON ((b.id = rr.booking_id)))
  WHERE ((b.status = 'checked_in'::public.booking_status) AND (r.id IS NULL) AND ((c.date + c.end_time) < CURRENT_TIMESTAMP))
  ORDER BY c.date DESC, c.start_time DESC;


--
-- Name: plan_credit_buckets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_credit_buckets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    plan_id uuid NOT NULL,
    allowed_class_type_ids uuid[] NOT NULL,
    credit_count integer,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    cost numeric(10,2) DEFAULT 0,
    stock integer DEFAULT 0 NOT NULL,
    min_stock_alert integer DEFAULT 5,
    sku character varying(50),
    image_url text,
    category_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redemptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    reward_id uuid NOT NULL,
    points_spent integer NOT NULL,
    status public.redemption_status DEFAULT 'pending'::public.redemption_status NOT NULL,
    fulfilled_at timestamp with time zone,
    fulfilled_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: referral_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_codes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    code character varying(32) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_id uuid NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: review_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_responses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    review_id uuid NOT NULL,
    responded_by uuid NOT NULL,
    response_type public.response_type DEFAULT 'thank_you'::public.response_type NOT NULL,
    response_text text NOT NULL,
    is_public boolean DEFAULT true,
    is_resolved boolean DEFAULT false,
    compensation_offered text,
    compensation_value numeric(10,2),
    compensation_redeemed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE review_responses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.review_responses IS 'Respuestas del estudio a las reseñas de los clientes';


--
-- Name: review_tag_selections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_tag_selections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    review_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE review_tag_selections; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.review_tag_selections IS 'Relación many-to-many entre reseñas y tags';


--
-- Name: review_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    name_en character varying(50),
    category character varying(50) NOT NULL,
    icon character varying(50),
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE review_tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.review_tags IS 'Tags predefinidos que los usuarios pueden seleccionar en sus reseñas';


--
-- Name: reviews_with_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.reviews_with_details AS
 SELECT r.id AS review_id,
    r.overall_rating,
    r.instructor_rating,
    r.difficulty_rating,
    r.ambiance_rating,
    r.comment,
    r.status,
    r.is_anonymous,
    r.is_featured,
    r.points_earned,
    r.created_at,
        CASE
            WHEN r.is_anonymous THEN NULL::uuid
            ELSE u.id
        END AS user_id,
        CASE
            WHEN r.is_anonymous THEN 'Anónimo'::character varying
            ELSE u.display_name
        END AS user_name,
        CASE
            WHEN r.is_anonymous THEN NULL::text
            ELSE u.photo_url
        END AS user_photo,
    c.id AS class_id,
    c.date AS class_date,
    c.start_time,
    ct.name AS class_type,
    ct.color AS class_color,
    i.id AS instructor_id,
    i.display_name AS instructor_name,
    i.photo_url AS instructor_photo,
    ( SELECT COALESCE(json_agg(json_build_object('id', rt.id, 'name', rt.name, 'icon', rt.icon, 'category', rt.category)), '[]'::json) AS "coalesce"
           FROM (public.review_tag_selections rts
             JOIN public.review_tags rt ON ((rts.tag_id = rt.id)))
          WHERE (rts.review_id = r.id)) AS tags,
    ( SELECT json_build_object('id', rr.id, 'text', rr.response_text, 'type', rr.response_type, 'created_at', rr.created_at) AS json_build_object
           FROM public.review_responses rr
          WHERE ((rr.review_id = r.id) AND (rr.is_public = true))
          ORDER BY rr.created_at DESC
         LIMIT 1) AS studio_response
   FROM ((((public.reviews r
     JOIN public.users u ON ((r.user_id = u.id)))
     JOIN public.classes c ON ((r.class_id = c.id)))
     JOIN public.class_types ct ON ((c.class_type_id = ct.id)))
     JOIN public.instructors i ON ((r.instructor_id = i.id)))
  WHERE (r.status = 'published'::public.review_status);


--
-- Name: rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rewards (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    points_cost integer NOT NULL,
    category public.reward_category NOT NULL,
    image_url text,
    stock integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sale_id uuid NOT NULL,
    product_id uuid,
    product_name character varying(200) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) DEFAULT 0 NOT NULL,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    seller_id uuid,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    discount numeric(10,2) DEFAULT 0,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    payment_method character varying(20) DEFAULT 'cash'::character varying NOT NULL,
    notes text,
    status character varying(20) DEFAULT 'completed'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_type_id uuid NOT NULL,
    instructor_id uuid NOT NULL,
    facility_id uuid,
    day_of_week integer,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    max_capacity integer DEFAULT 8 NOT NULL,
    is_recurring boolean DEFAULT true,
    specific_date date,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: studio_closed_days; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.studio_closed_days (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    date date NOT NULL,
    reason character varying(255) DEFAULT ''::character varying NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: suspicious_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suspicious_activity (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    booking_id uuid,
    checkin_log_id uuid,
    activity_type public.suspicious_activity_type NOT NULL,
    severity character varying(20) DEFAULT 'low'::character varying NOT NULL,
    description text NOT NULL,
    evidence jsonb DEFAULT '{}'::jsonb,
    device_ids text[],
    ip_addresses inet[],
    is_reviewed boolean DEFAULT false,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    resolution_notes text,
    is_false_positive boolean DEFAULT false,
    action_taken character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE suspicious_activity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.suspicious_activity IS 'Registro de actividad sospechosa detectada automáticamente';


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by uuid
);


--
-- Name: template_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.template_favorites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_id uuid NOT NULL,
    instructor_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE template_favorites; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.template_favorites IS 'Allows coaches to save favorite templates';


--
-- Name: unmatched_webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unmatched_webhooks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    provider character varying(40) NOT NULL,
    payload jsonb NOT NULL,
    received_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp with time zone,
    resolved_payment_id uuid
);


--
-- Name: upcoming_classes_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.upcoming_classes_view AS
 SELECT c.id AS class_id,
    c.date,
    c.start_time,
    c.end_time,
    c.max_capacity,
    c.current_bookings,
    c.status,
    ct.name AS class_type_name,
    ct.level,
    ct.duration_minutes,
    ct.color,
    i.display_name AS instructor_name,
    i.photo_url AS instructor_photo,
    (c.max_capacity - c.current_bookings) AS available_spots
   FROM ((public.classes c
     JOIN public.class_types ct ON ((c.class_type_id = ct.id)))
     JOIN public.instructors i ON ((c.instructor_id = i.id)))
  WHERE ((c.date >= CURRENT_DATE) AND (c.status = 'scheduled'::public.class_status))
  ORDER BY c.date, c.start_time;


--
-- Name: upcoming_events_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.upcoming_events_view AS
 SELECT id,
    title,
    description,
    type,
    status,
    date,
    start_time,
    end_time,
    location,
    capacity,
    registered,
    price,
    currency,
    early_bird_price,
    early_bird_deadline,
    member_discount,
    image,
    instructor_name,
    instructor_photo,
    requirements,
    includes,
    tags,
    (capacity - registered) AS available_spots,
        CASE
            WHEN ((early_bird_deadline IS NOT NULL) AND (CURRENT_DATE <= early_bird_deadline)) THEN early_bird_price
            ELSE price
        END AS current_price
   FROM public.events e
  WHERE ((date >= CURRENT_DATE) AND (status = 'published'::public.event_status))
  ORDER BY date, start_time;


--
-- Name: user_bookings_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_bookings_view AS
 SELECT b.id AS booking_id,
    b.user_id,
    b.status AS booking_status,
    b.waitlist_position,
    b.checked_in_at,
    c.id AS class_id,
    c.date,
    c.start_time,
    c.end_time,
    ct.name AS class_type_name,
    ct.level,
    ct.color AS class_type_color,
    i.display_name AS instructor_name
   FROM (((public.bookings b
     JOIN public.classes c ON ((b.class_id = c.id)))
     JOIN public.class_types ct ON ((c.class_type_id = ct.id)))
     JOIN public.instructors i ON ((c.instructor_id = i.id)))
  ORDER BY c.date DESC, c.start_time DESC;


--
-- Name: video_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(120) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: video_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    video_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    parent_id uuid,
    status character varying(20) DEFAULT 'approved'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: video_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_history (
    user_id uuid NOT NULL,
    video_id uuid NOT NULL,
    last_position integer DEFAULT 0,
    completed boolean DEFAULT false,
    watched_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: video_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_likes (
    user_id uuid NOT NULL,
    video_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: video_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_purchases (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    video_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status public.video_purchase_status DEFAULT 'pending_payment'::public.video_purchase_status NOT NULL,
    payment_method public.payment_method DEFAULT 'transfer'::public.payment_method,
    amount_mxn numeric(10,2),
    proof_url text,
    proof_uploaded_at timestamp with time zone,
    bank_reference character varying(100),
    rejection_reason text,
    has_access boolean DEFAULT false,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejected_by uuid,
    rejected_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    amount numeric(10,2),
    currency character varying(3) DEFAULT 'MXN'::character varying,
    customer_notes text,
    payment_reference character varying(100),
    transfer_date date,
    proof_file_url text,
    proof_file_name character varying(255),
    proof_file_type character varying(100),
    admin_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone
);


--
-- Name: videos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.videos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    subtitle character varying(255),
    tagline character varying(255),
    video_url text,
    drive_file_id character varying(255),
    thumbnail_url text,
    thumbnail_drive_id character varying(255),
    duration_seconds integer,
    days character varying(100),
    brand_color character varying(7),
    access_type character varying(50) DEFAULT 'free'::character varying,
    class_type_id uuid,
    instructor_id uuid,
    is_published boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    sales_enabled boolean DEFAULT false,
    sales_price_mxn numeric(10,2),
    sales_class_credits integer,
    sales_cta_text character varying(100),
    sales_unlocks_video boolean DEFAULT false,
    view_count integer DEFAULT 0,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    category_id uuid,
    level character varying(20),
    published_at timestamp with time zone,
    slug character varying(255),
    cloudinary_id character varying(255),
    likes_count integer DEFAULT 0 NOT NULL,
    comments_count integer DEFAULT 0 NOT NULL,
    CONSTRAINT videos_access_type_check CHECK (((access_type)::text = ANY ((ARRAY['free'::character varying, 'members'::character varying, 'gratuito'::character varying, 'miembros'::character varying])::text[])))
);


--
-- Name: wallet_pass_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_pass_updates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    wallet_pass_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    classes_before integer,
    classes_after integer,
    status_before public.membership_status,
    status_after public.membership_status,
    trigger_type character varying(50) NOT NULL,
    trigger_booking_id uuid,
    push_sent boolean DEFAULT false,
    push_sent_at timestamp with time zone,
    push_status character varying(50),
    push_error text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE wallet_pass_updates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.wallet_pass_updates IS 'Historial de actualizaciones enviadas a los pases de wallet';


--
-- Name: wallet_passes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_passes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    platform public.wallet_platform NOT NULL,
    serial_number character varying(255) NOT NULL,
    pass_type_identifier character varying(255),
    google_object_id character varying(255),
    auth_token character varying(255),
    last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: workout_exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workout_exercises (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    duration_seconds integer,
    reps integer,
    sets integer DEFAULT 1,
    rest_seconds integer DEFAULT 0,
    sort_order integer DEFAULT 0 NOT NULL,
    section character varying(50) DEFAULT 'main'::character varying,
    video_url text,
    image_url text,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE workout_exercises; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.workout_exercises IS 'Individual exercises within a workout template';


--
-- Name: workout_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workout_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    class_type_id uuid,
    created_by uuid NOT NULL,
    duration_minutes integer DEFAULT 50,
    difficulty character varying(20) DEFAULT 'intermediate'::character varying,
    equipment_needed jsonb DEFAULT '[]'::jsonb,
    music_playlist_url text,
    is_public boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    uses_count integer DEFAULT 0,
    tags jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT workout_templates_difficulty_check CHECK (((difficulty)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying])::text[])))
);


--
-- Name: TABLE workout_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.workout_templates IS 'Templates for class workouts that coaches can create and share';


--
-- Name: admin_actions admin_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_pkey PRIMARY KEY (id);


--
-- Name: admin_notes admin_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notes
    ADD CONSTRAINT admin_notes_pkey PRIMARY KEY (id);


--
-- Name: apple_wallet_devices apple_wallet_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apple_wallet_devices
    ADD CONSTRAINT apple_wallet_devices_pkey PRIMARY KEY (id);


--
-- Name: apple_wallet_updates apple_wallet_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apple_wallet_updates
    ADD CONSTRAINT apple_wallet_updates_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: checkin_logs checkin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkin_logs
    ADD CONSTRAINT checkin_logs_pkey PRIMARY KEY (id);


--
-- Name: class_substitutions class_substitutions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_substitutions
    ADD CONSTRAINT class_substitutions_pkey PRIMARY KEY (id);


--
-- Name: class_types class_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_types
    ADD CONSTRAINT class_types_pkey PRIMARY KEY (id);


--
-- Name: class_workouts class_workouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_workouts
    ADD CONSTRAINT class_workouts_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: coach_playlists coach_playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_playlists
    ADD CONSTRAINT coach_playlists_pkey PRIMARY KEY (id);


--
-- Name: coach_substitutions coach_substitutions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_substitutions
    ADD CONSTRAINT coach_substitutions_pkey PRIMARY KEY (id);


--
-- Name: cron_job_logs cron_job_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cron_job_logs
    ADD CONSTRAINT cron_job_logs_pkey PRIMARY KEY (id);


--
-- Name: discount_code_plans discount_code_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_plans
    ADD CONSTRAINT discount_code_plans_pkey PRIMARY KEY (discount_code_id, plan_id);


--
-- Name: discount_codes discount_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_code_key UNIQUE (code);


--
-- Name: discount_codes discount_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_pkey PRIMARY KEY (id);


--
-- Name: egresos egresos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egresos
    ADD CONSTRAINT egresos_pkey PRIMARY KEY (id);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: facilities facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_pkey PRIMARY KEY (id);


--
-- Name: guest_bookings guest_bookings_confirmation_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_bookings
    ADD CONSTRAINT guest_bookings_confirmation_code_key UNIQUE (confirmation_code);


--
-- Name: guest_bookings guest_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_bookings
    ADD CONSTRAINT guest_bookings_pkey PRIMARY KEY (id);


--
-- Name: instructor_availability instructor_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_availability
    ADD CONSTRAINT instructor_availability_pkey PRIMARY KEY (id);


--
-- Name: instructors instructors_coach_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructors
    ADD CONSTRAINT instructors_coach_number_key UNIQUE (coach_number);


--
-- Name: instructors instructors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructors
    ADD CONSTRAINT instructors_pkey PRIMARY KEY (id);


--
-- Name: loyalty_points loyalty_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_points
    ADD CONSTRAINT loyalty_points_pkey PRIMARY KEY (id);


--
-- Name: loyalty_redemptions loyalty_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_redemptions
    ADD CONSTRAINT loyalty_redemptions_pkey PRIMARY KEY (id);


--
-- Name: loyalty_rewards loyalty_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_rewards
    ADD CONSTRAINT loyalty_rewards_pkey PRIMARY KEY (id);


--
-- Name: membership_credits membership_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_credits
    ADD CONSTRAINT membership_credits_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: notification_history notification_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_history
    ADD CONSTRAINT notification_history_pkey PRIMARY KEY (id);


--
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: payment_events payment_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_events
    ADD CONSTRAINT payment_events_pkey PRIMARY KEY (id);


--
-- Name: payment_proofs payment_proofs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_proofs
    ADD CONSTRAINT payment_proofs_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: plan_credit_buckets plan_credit_buckets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_credit_buckets
    ADD CONSTRAINT plan_credit_buckets_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: redemptions redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemptions
    ADD CONSTRAINT redemptions_pkey PRIMARY KEY (id);


--
-- Name: referral_codes referral_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_code_key UNIQUE (code);


--
-- Name: referral_codes referral_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: review_requests review_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_requests
    ADD CONSTRAINT review_requests_pkey PRIMARY KEY (id);


--
-- Name: review_responses review_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_responses
    ADD CONSTRAINT review_responses_pkey PRIMARY KEY (id);


--
-- Name: review_tag_selections review_tag_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_tag_selections
    ADD CONSTRAINT review_tag_selections_pkey PRIMARY KEY (id);


--
-- Name: review_tags review_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_tags
    ADD CONSTRAINT review_tags_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: rewards rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (id);


--
-- Name: studio_closed_days studio_closed_days_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_closed_days
    ADD CONSTRAINT studio_closed_days_date_key UNIQUE (date);


--
-- Name: studio_closed_days studio_closed_days_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_closed_days
    ADD CONSTRAINT studio_closed_days_pkey PRIMARY KEY (id);


--
-- Name: suspicious_activity suspicious_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspicious_activity
    ADD CONSTRAINT suspicious_activity_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- Name: template_favorites template_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_favorites
    ADD CONSTRAINT template_favorites_pkey PRIMARY KEY (id);


--
-- Name: class_workouts unique_class_workout; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_workouts
    ADD CONSTRAINT unique_class_workout UNIQUE (class_id);


--
-- Name: apple_wallet_devices unique_device_registration; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apple_wallet_devices
    ADD CONSTRAINT unique_device_registration UNIQUE (device_id, pass_type_id, membership_id);


--
-- Name: event_registrations unique_event_registration; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT unique_event_registration UNIQUE (event_id, email);


--
-- Name: template_favorites unique_favorite; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_favorites
    ADD CONSTRAINT unique_favorite UNIQUE (template_id, instructor_id);


--
-- Name: instructor_availability unique_instructor_day_time; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_availability
    ADD CONSTRAINT unique_instructor_day_time UNIQUE (instructor_id, day_of_week, start_time, end_time);


--
-- Name: reviews unique_review_per_booking; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT unique_review_per_booking UNIQUE (booking_id);


--
-- Name: review_requests unique_review_request; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_requests
    ADD CONSTRAINT unique_review_request UNIQUE (booking_id);


--
-- Name: review_tag_selections unique_tag_per_review; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_tag_selections
    ADD CONSTRAINT unique_tag_per_review UNIQUE (review_id, tag_id);


--
-- Name: video_purchases unique_video_purchase; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_purchases
    ADD CONSTRAINT unique_video_purchase UNIQUE (video_id, user_id);


--
-- Name: unmatched_webhooks unmatched_webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unmatched_webhooks
    ADD CONSTRAINT unmatched_webhooks_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_firebase_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_firebase_uid_key UNIQUE (firebase_uid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: video_categories video_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_categories
    ADD CONSTRAINT video_categories_pkey PRIMARY KEY (id);


--
-- Name: video_comments video_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_comments
    ADD CONSTRAINT video_comments_pkey PRIMARY KEY (id);


--
-- Name: video_history video_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_history
    ADD CONSTRAINT video_history_pkey PRIMARY KEY (user_id, video_id);


--
-- Name: video_likes video_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_likes
    ADD CONSTRAINT video_likes_pkey PRIMARY KEY (user_id, video_id);


--
-- Name: video_purchases video_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_purchases
    ADD CONSTRAINT video_purchases_pkey PRIMARY KEY (id);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: wallet_pass_updates wallet_pass_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_pass_updates
    ADD CONSTRAINT wallet_pass_updates_pkey PRIMARY KEY (id);


--
-- Name: wallet_passes wallet_passes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_passes
    ADD CONSTRAINT wallet_passes_pkey PRIMARY KEY (id);


--
-- Name: wallet_passes wallet_passes_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_passes
    ADD CONSTRAINT wallet_passes_serial_number_key UNIQUE (serial_number);


--
-- Name: workout_exercises workout_exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_exercises
    ADD CONSTRAINT workout_exercises_pkey PRIMARY KEY (id);


--
-- Name: workout_templates workout_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_templates
    ADD CONSTRAINT workout_templates_pkey PRIMARY KEY (id);


--
-- Name: bookings_unique_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX bookings_unique_active ON public.bookings USING btree (class_id, user_id) WHERE (status <> 'cancelled'::public.booking_status);


--
-- Name: idx_admin_actions_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_admin ON public.admin_actions USING btree (admin_user_id);


--
-- Name: idx_admin_actions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_created ON public.admin_actions USING btree (created_at DESC);


--
-- Name: idx_admin_actions_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_entity ON public.admin_actions USING btree (entity_type, entity_id);


--
-- Name: idx_admin_notes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_notes_user ON public.admin_notes USING btree (user_id);


--
-- Name: idx_apple_wallet_devices_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_apple_wallet_devices_device ON public.apple_wallet_devices USING btree (device_id);


--
-- Name: idx_apple_wallet_devices_membership; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_apple_wallet_devices_membership ON public.apple_wallet_devices USING btree (membership_id);


--
-- Name: idx_apple_wallet_devices_push_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_apple_wallet_devices_push_token ON public.apple_wallet_devices USING btree (push_token);


--
-- Name: idx_apple_wallet_updates_membership; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_apple_wallet_updates_membership ON public.apple_wallet_updates USING btree (membership_id);


--
-- Name: idx_apple_wallet_updates_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_apple_wallet_updates_updated ON public.apple_wallet_updates USING btree (updated_at);


--
-- Name: idx_availability_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_availability_day ON public.instructor_availability USING btree (day_of_week);


--
-- Name: idx_availability_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_availability_instructor ON public.instructor_availability USING btree (instructor_id);


--
-- Name: idx_awd_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_awd_device ON public.apple_wallet_devices USING btree (device_id);


--
-- Name: idx_awd_membership; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_awd_membership ON public.apple_wallet_devices USING btree (membership_id);


--
-- Name: idx_awd_push_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_awd_push_token ON public.apple_wallet_devices USING btree (push_token);


--
-- Name: idx_awu_membership; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_awu_membership ON public.apple_wallet_updates USING btree (membership_id);


--
-- Name: idx_awu_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_awu_updated ON public.apple_wallet_updates USING btree (updated_at);


--
-- Name: idx_bookings_cancelled_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_cancelled_by ON public.bookings USING btree (cancelled_by) WHERE (cancelled_by IS NOT NULL);


--
-- Name: idx_bookings_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_class ON public.bookings USING btree (class_id);


--
-- Name: idx_bookings_membership; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_membership ON public.bookings USING btree (membership_id);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_bookings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user ON public.bookings USING btree (user_id);


--
-- Name: idx_checkin_logs_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checkin_logs_booking ON public.checkin_logs USING btree (booking_id);


--
-- Name: idx_checkin_logs_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checkin_logs_class ON public.checkin_logs USING btree (class_id);


--
-- Name: idx_checkin_logs_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checkin_logs_date ON public.checkin_logs USING btree (checked_in_at);


--
-- Name: idx_checkin_logs_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checkin_logs_device ON public.checkin_logs USING btree (device_id);


--
-- Name: idx_checkin_logs_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checkin_logs_ip ON public.checkin_logs USING btree (ip_address);


--
-- Name: idx_checkin_logs_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checkin_logs_method ON public.checkin_logs USING btree (checkin_method);


--
-- Name: idx_checkin_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checkin_logs_user ON public.checkin_logs USING btree (user_id);


--
-- Name: idx_class_sub_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_sub_class ON public.class_substitutions USING btree (class_id);


--
-- Name: idx_class_sub_original; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_sub_original ON public.class_substitutions USING btree (original_instructor_id);


--
-- Name: idx_class_sub_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_sub_status ON public.class_substitutions USING btree (status);


--
-- Name: idx_class_sub_substitute; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_sub_substitute ON public.class_substitutions USING btree (substitute_instructor_id);


--
-- Name: idx_class_types_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_types_active ON public.class_types USING btree (is_active);


--
-- Name: idx_class_workouts_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_workouts_class ON public.class_workouts USING btree (class_id);


--
-- Name: idx_class_workouts_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_workouts_template ON public.class_workouts USING btree (template_id);


--
-- Name: idx_classes_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_date ON public.classes USING btree (date);


--
-- Name: idx_classes_date_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_date_time ON public.classes USING btree (date, start_time);


--
-- Name: idx_classes_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_instructor ON public.classes USING btree (instructor_id);


--
-- Name: idx_classes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_status ON public.classes USING btree (status);


--
-- Name: idx_discount_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_codes_code ON public.discount_codes USING btree (code);


--
-- Name: idx_egresos_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_egresos_category ON public.egresos USING btree (category);


--
-- Name: idx_egresos_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_egresos_date ON public.egresos USING btree (date);


--
-- Name: idx_egresos_recurring; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_egresos_recurring ON public.egresos USING btree (is_recurring) WHERE (is_recurring = true);


--
-- Name: idx_egresos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_egresos_status ON public.egresos USING btree (status);


--
-- Name: idx_event_reg_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_reg_email ON public.event_registrations USING btree (email);


--
-- Name: idx_event_reg_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_reg_event ON public.event_registrations USING btree (event_id);


--
-- Name: idx_event_reg_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_reg_status ON public.event_registrations USING btree (status);


--
-- Name: idx_event_reg_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_reg_user ON public.event_registrations USING btree (user_id);


--
-- Name: idx_events_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_date ON public.events USING btree (date);


--
-- Name: idx_events_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_instructor ON public.events USING btree (instructor_id);


--
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- Name: idx_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_type ON public.events USING btree (type);


--
-- Name: idx_events_upcoming; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_upcoming ON public.events USING btree (date, start_time) WHERE (status = 'published'::public.event_status);


--
-- Name: idx_guest_bookings_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_bookings_class ON public.guest_bookings USING btree (class_id);


--
-- Name: idx_guest_bookings_confirmation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_bookings_confirmation ON public.guest_bookings USING btree (confirmation_code);


--
-- Name: idx_guest_bookings_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_bookings_created_at ON public.guest_bookings USING btree (created_at);


--
-- Name: idx_guest_bookings_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_bookings_email ON public.guest_bookings USING btree (guest_email);


--
-- Name: idx_guest_bookings_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_bookings_phone ON public.guest_bookings USING btree (guest_phone);


--
-- Name: idx_instructor_availability_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instructor_availability_day ON public.instructor_availability USING btree (day_of_week);


--
-- Name: idx_instructor_availability_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instructor_availability_instructor ON public.instructor_availability USING btree (instructor_id);


--
-- Name: idx_instructors_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instructors_active ON public.instructors USING btree (is_active);


--
-- Name: idx_instructors_coach_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instructors_coach_number ON public.instructors USING btree (coach_number);


--
-- Name: idx_instructors_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instructors_user ON public.instructors USING btree (user_id);


--
-- Name: idx_loyalty_points_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_points_created ON public.loyalty_points USING btree (created_at);


--
-- Name: idx_loyalty_points_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_points_type ON public.loyalty_points USING btree (type);


--
-- Name: idx_loyalty_points_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_points_user ON public.loyalty_points USING btree (user_id);


--
-- Name: idx_loyalty_redemptions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_redemptions_user ON public.loyalty_redemptions USING btree (user_id);


--
-- Name: idx_membership_credits_membership; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_membership_credits_membership ON public.membership_credits USING btree (membership_id);


--
-- Name: idx_memberships_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memberships_active ON public.memberships USING btree (user_id, status) WHERE (status = 'active'::public.membership_status);


--
-- Name: idx_memberships_end_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memberships_end_date ON public.memberships USING btree (end_date);


--
-- Name: idx_memberships_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memberships_status ON public.memberships USING btree (status);


--
-- Name: idx_memberships_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memberships_user ON public.memberships USING btree (user_id);


--
-- Name: idx_nl_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nl_channel ON public.notification_logs USING btree (channel);


--
-- Name: idx_nl_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nl_created ON public.notification_logs USING btree (created_at);


--
-- Name: idx_nl_membership; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nl_membership ON public.notification_logs USING btree (membership_id);


--
-- Name: idx_nl_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nl_status ON public.notification_logs USING btree (status);


--
-- Name: idx_notification_history_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_history_created ON public.notification_history USING btree (created_at);


--
-- Name: idx_notification_history_membership; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_history_membership ON public.notification_history USING btree (membership_id);


--
-- Name: idx_notification_history_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_history_type ON public.notification_history USING btree (type);


--
-- Name: idx_notification_history_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_history_user ON public.notification_history USING btree (user_id);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_orders_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_created ON public.orders USING btree (created_at DESC);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at DESC);


--
-- Name: idx_orders_discount_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_discount_code ON public.orders USING btree (discount_code_id);


--
-- Name: idx_orders_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_number ON public.orders USING btree (order_number);


--
-- Name: idx_orders_payment_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_payment_method ON public.orders USING btree (payment_method);


--
-- Name: idx_orders_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_pending ON public.orders USING btree (status) WHERE (status = ANY (ARRAY['pending_payment'::public.order_status, 'pending_verification'::public.order_status]));


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);


--
-- Name: idx_payment_events_payment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_events_payment ON public.payment_events USING btree (payment_id, created_at DESC);


--
-- Name: idx_payment_proofs_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_proofs_order ON public.payment_proofs USING btree (order_id);


--
-- Name: idx_payment_proofs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_proofs_status ON public.payment_proofs USING btree (status);


--
-- Name: idx_payments_clip_payment_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_clip_payment_request_id ON public.payments USING btree (clip_payment_request_id) WHERE (clip_payment_request_id IS NOT NULL);


--
-- Name: idx_payments_clip_receipt_no; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_clip_receipt_no ON public.payments USING btree (clip_receipt_no) WHERE (clip_receipt_no IS NOT NULL);


--
-- Name: idx_payments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_date ON public.payments USING btree (created_at);


--
-- Name: idx_payments_membership; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_membership ON public.payments USING btree (membership_id);


--
-- Name: idx_payments_reference_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_payments_reference_id ON public.payments USING btree (reference_id) WHERE (reference_id IS NOT NULL);


--
-- Name: idx_payments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_user ON public.payments USING btree (user_id);


--
-- Name: idx_plan_credit_buckets_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_credit_buckets_plan ON public.plan_credit_buckets USING btree (plan_id);


--
-- Name: idx_plans_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plans_active ON public.plans USING btree (is_active);


--
-- Name: idx_plans_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plans_sort ON public.plans USING btree (sort_order);


--
-- Name: idx_playlists_class_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_playlists_class_type ON public.coach_playlists USING btree (class_type_id);


--
-- Name: idx_playlists_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_playlists_instructor ON public.coach_playlists USING btree (instructor_id);


--
-- Name: idx_playlists_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_playlists_public ON public.coach_playlists USING btree (is_public) WHERE (is_public = true);


--
-- Name: idx_proofs_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proofs_order ON public.payment_proofs USING btree (order_id);


--
-- Name: idx_proofs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proofs_status ON public.payment_proofs USING btree (status);


--
-- Name: idx_proofs_uploaded; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proofs_uploaded ON public.payment_proofs USING btree (uploaded_at DESC);


--
-- Name: idx_redemptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemptions_status ON public.redemptions USING btree (status);


--
-- Name: idx_redemptions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemptions_user ON public.redemptions USING btree (user_id);


--
-- Name: idx_referral_codes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_codes_user ON public.referral_codes USING btree (user_id);


--
-- Name: idx_referrals_referrer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referrals_referrer ON public.referrals USING btree (referrer_id);


--
-- Name: idx_reset_tokens_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_tokens_expires ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_reset_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_reset_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_tokens_user ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_review_requests_send_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_requests_send_at ON public.review_requests USING btree (send_at) WHERE ((status)::text = 'pending'::text);


--
-- Name: idx_review_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_requests_status ON public.review_requests USING btree (status);


--
-- Name: idx_review_requests_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_requests_user ON public.review_requests USING btree (user_id);


--
-- Name: idx_review_responses_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_responses_review ON public.review_responses USING btree (review_id);


--
-- Name: idx_review_responses_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_responses_user ON public.review_responses USING btree (responded_by);


--
-- Name: idx_review_tags_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_tags_active ON public.review_tags USING btree (is_active);


--
-- Name: idx_review_tags_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_tags_category ON public.review_tags USING btree (category);


--
-- Name: idx_review_tags_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_tags_review ON public.review_tag_selections USING btree (review_id);


--
-- Name: idx_review_tags_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_tags_tag ON public.review_tag_selections USING btree (tag_id);


--
-- Name: idx_reviews_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_class ON public.reviews USING btree (class_id);


--
-- Name: idx_reviews_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_created ON public.reviews USING btree (created_at);


--
-- Name: idx_reviews_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_featured ON public.reviews USING btree (is_featured) WHERE (is_featured = true);


--
-- Name: idx_reviews_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_instructor ON public.reviews USING btree (instructor_id);


--
-- Name: idx_reviews_overall_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_overall_rating ON public.reviews USING btree (overall_rating);


--
-- Name: idx_reviews_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_status ON public.reviews USING btree (status);


--
-- Name: idx_reviews_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_user ON public.reviews USING btree (user_id);


--
-- Name: idx_rewards_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rewards_active ON public.rewards USING btree (is_active);


--
-- Name: idx_rewards_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rewards_category ON public.rewards USING btree (category);


--
-- Name: idx_schedules_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedules_active ON public.schedules USING btree (is_active);


--
-- Name: idx_schedules_class_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedules_class_type ON public.schedules USING btree (class_type_id);


--
-- Name: idx_schedules_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedules_day ON public.schedules USING btree (day_of_week) WHERE (is_recurring = true);


--
-- Name: idx_schedules_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedules_instructor ON public.schedules USING btree (instructor_id);


--
-- Name: idx_studio_closed_days_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studio_closed_days_date ON public.studio_closed_days USING btree (date);


--
-- Name: idx_substitutions_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_substitutions_class ON public.coach_substitutions USING btree (class_id);


--
-- Name: idx_substitutions_new; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_substitutions_new ON public.coach_substitutions USING btree (new_instructor_id);


--
-- Name: idx_substitutions_original; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_substitutions_original ON public.coach_substitutions USING btree (original_instructor_id);


--
-- Name: idx_substitutions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_substitutions_status ON public.class_substitutions USING btree (status);


--
-- Name: idx_substitutions_substitute; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_substitutions_substitute ON public.class_substitutions USING btree (substitute_instructor_id);


--
-- Name: idx_suspicious_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suspicious_created ON public.suspicious_activity USING btree (created_at);


--
-- Name: idx_suspicious_reviewed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suspicious_reviewed ON public.suspicious_activity USING btree (is_reviewed);


--
-- Name: idx_suspicious_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suspicious_severity ON public.suspicious_activity USING btree (severity);


--
-- Name: idx_suspicious_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suspicious_type ON public.suspicious_activity USING btree (activity_type);


--
-- Name: idx_suspicious_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suspicious_user ON public.suspicious_activity USING btree (user_id);


--
-- Name: idx_template_favorites_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_template_favorites_instructor ON public.template_favorites USING btree (instructor_id);


--
-- Name: idx_unmatched_webhooks_received; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unmatched_webhooks_received ON public.unmatched_webhooks USING btree (received_at DESC) WHERE (resolved_at IS NULL);


--
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_active ON public.users USING btree (is_active);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_firebase_uid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_firebase_uid ON public.users USING btree (firebase_uid);


--
-- Name: idx_users_is_prospect; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_is_prospect ON public.users USING btree (is_prospect);


--
-- Name: idx_users_password_hash_not_null; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_password_hash_not_null ON public.users USING btree (id) WHERE (password_hash IS NOT NULL);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_video_comments_video; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_comments_video ON public.video_comments USING btree (video_id);


--
-- Name: idx_video_purchases_access; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_purchases_access ON public.video_purchases USING btree (has_access) WHERE (has_access = true);


--
-- Name: idx_video_purchases_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_purchases_created_at ON public.video_purchases USING btree (created_at DESC);


--
-- Name: idx_video_purchases_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_purchases_status ON public.video_purchases USING btree (status);


--
-- Name: idx_video_purchases_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_purchases_user ON public.video_purchases USING btree (user_id);


--
-- Name: idx_video_purchases_user_video_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_video_purchases_user_video_active ON public.video_purchases USING btree (user_id, video_id) WHERE (status = ANY (ARRAY['pending_payment'::public.video_purchase_status, 'pending_verification'::public.video_purchase_status, 'approved'::public.video_purchase_status]));


--
-- Name: idx_video_purchases_video; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_purchases_video ON public.video_purchases USING btree (video_id);


--
-- Name: idx_videos_access_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_videos_access_type ON public.videos USING btree (access_type);


--
-- Name: idx_videos_class_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_videos_class_type ON public.videos USING btree (class_type_id);


--
-- Name: idx_videos_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_videos_featured ON public.videos USING btree (is_featured) WHERE (is_featured = true);


--
-- Name: idx_videos_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_videos_instructor ON public.videos USING btree (instructor_id);


--
-- Name: idx_videos_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_videos_published ON public.videos USING btree (is_published);


--
-- Name: idx_videos_sales; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_videos_sales ON public.videos USING btree (sales_enabled) WHERE (sales_enabled = true);


--
-- Name: idx_videos_sales_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_videos_sales_enabled ON public.videos USING btree (sales_enabled) WHERE (sales_enabled = true);


--
-- Name: idx_videos_sales_unlocks_video; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_videos_sales_unlocks_video ON public.videos USING btree (sales_unlocks_video) WHERE (sales_unlocks_video = true);


--
-- Name: idx_wallet_passes_membership; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_passes_membership ON public.wallet_passes USING btree (membership_id);


--
-- Name: idx_wallet_passes_serial; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_passes_serial ON public.wallet_passes USING btree (serial_number);


--
-- Name: idx_wallet_passes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_passes_user ON public.wallet_passes USING btree (user_id);


--
-- Name: idx_wallet_updates_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_updates_created ON public.wallet_pass_updates USING btree (created_at);


--
-- Name: idx_wallet_updates_membership; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_updates_membership ON public.wallet_pass_updates USING btree (membership_id);


--
-- Name: idx_wallet_updates_pass; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_updates_pass ON public.wallet_pass_updates USING btree (wallet_pass_id);


--
-- Name: idx_workout_exercises_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workout_exercises_order ON public.workout_exercises USING btree (template_id, sort_order);


--
-- Name: idx_workout_exercises_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workout_exercises_template ON public.workout_exercises USING btree (template_id);


--
-- Name: idx_workout_templates_class_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workout_templates_class_type ON public.workout_templates USING btree (class_type_id);


--
-- Name: idx_workout_templates_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workout_templates_created_by ON public.workout_templates USING btree (created_by);


--
-- Name: idx_workout_templates_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workout_templates_featured ON public.workout_templates USING btree (is_featured);


--
-- Name: idx_workout_templates_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workout_templates_public ON public.workout_templates USING btree (is_public);


--
-- Name: orders set_order_number_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_order_number_trigger BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_number();


--
-- Name: reviews trigger_award_review_points; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_award_review_points BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.award_review_points();


--
-- Name: bookings trigger_create_review_request; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_create_review_request AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.create_review_request();


--
-- Name: checkin_logs trigger_detect_suspicious_checkin; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_detect_suspicious_checkin AFTER INSERT ON public.checkin_logs FOR EACH ROW EXECUTE FUNCTION public.detect_suspicious_checkin();


--
-- Name: bookings trigger_update_booking_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_booking_count AFTER INSERT OR DELETE OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_class_booking_count();


--
-- Name: event_registrations trigger_update_event_registration_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_event_registration_count AFTER INSERT OR DELETE OR UPDATE ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION public.update_event_registration_count();


--
-- Name: class_workouts trigger_update_template_uses; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_template_uses AFTER INSERT OR DELETE ON public.class_workouts FOR EACH ROW EXECUTE FUNCTION public.update_template_uses_count();


--
-- Name: apple_wallet_devices update_apple_wallet_devices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_apple_wallet_devices_updated_at BEFORE UPDATE ON public.apple_wallet_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: apple_wallet_updates update_apple_wallet_updates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_apple_wallet_updates_updated_at BEFORE UPDATE ON public.apple_wallet_updates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: class_substitutions update_class_substitutions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_class_substitutions_updated_at BEFORE UPDATE ON public.class_substitutions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: class_types update_class_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_class_types_updated_at BEFORE UPDATE ON public.class_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: classes update_classes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: coach_playlists update_coach_playlists_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_coach_playlists_updated_at BEFORE UPDATE ON public.coach_playlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: egresos update_egresos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_egresos_updated_at BEFORE UPDATE ON public.egresos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: event_registrations update_event_registrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: guest_bookings update_guest_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_guest_bookings_updated_at BEFORE UPDATE ON public.guest_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: instructor_availability update_instructor_availability_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_instructor_availability_updated_at BEFORE UPDATE ON public.instructor_availability FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: instructors update_instructors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON public.instructors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: memberships update_memberships_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payment_proofs update_payment_proofs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payment_proofs_updated_at BEFORE UPDATE ON public.payment_proofs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: plans update_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: redemptions update_redemptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_redemptions_updated_at BEFORE UPDATE ON public.redemptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: review_requests update_review_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_review_requests_updated_at BEFORE UPDATE ON public.review_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: review_responses update_review_responses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_review_responses_updated_at BEFORE UPDATE ON public.review_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reviews update_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: rewards update_rewards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: schedules update_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: video_purchases update_video_purchases_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_video_purchases_updated_at BEFORE UPDATE ON public.video_purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: videos update_videos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workout_templates update_workout_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON public.workout_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_actions admin_actions_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: admin_notes admin_notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notes
    ADD CONSTRAINT admin_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: admin_notes admin_notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notes
    ADD CONSTRAINT admin_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: apple_wallet_devices apple_wallet_devices_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apple_wallet_devices
    ADD CONSTRAINT apple_wallet_devices_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE;


--
-- Name: apple_wallet_updates apple_wallet_updates_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apple_wallet_updates
    ADD CONSTRAINT apple_wallet_updates_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(id);


--
-- Name: bookings bookings_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_credit_bucket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_credit_bucket_id_fkey FOREIGN KEY (credit_bucket_id) REFERENCES public.membership_credits(id);


--
-- Name: bookings bookings_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: checkin_logs checkin_logs_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkin_logs
    ADD CONSTRAINT checkin_logs_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: checkin_logs checkin_logs_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkin_logs
    ADD CONSTRAINT checkin_logs_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(id);


--
-- Name: checkin_logs checkin_logs_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkin_logs
    ADD CONSTRAINT checkin_logs_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: checkin_logs checkin_logs_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkin_logs
    ADD CONSTRAINT checkin_logs_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE SET NULL;


--
-- Name: checkin_logs checkin_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkin_logs
    ADD CONSTRAINT checkin_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: class_substitutions class_substitutions_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_substitutions
    ADD CONSTRAINT class_substitutions_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: class_substitutions class_substitutions_original_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_substitutions
    ADD CONSTRAINT class_substitutions_original_instructor_id_fkey FOREIGN KEY (original_instructor_id) REFERENCES public.instructors(id) ON DELETE CASCADE;


--
-- Name: class_substitutions class_substitutions_substitute_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_substitutions
    ADD CONSTRAINT class_substitutions_substitute_instructor_id_fkey FOREIGN KEY (substitute_instructor_id) REFERENCES public.instructors(id) ON DELETE SET NULL;


--
-- Name: class_workouts class_workouts_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_workouts
    ADD CONSTRAINT class_workouts_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.instructors(id);


--
-- Name: class_workouts class_workouts_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_workouts
    ADD CONSTRAINT class_workouts_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: class_workouts class_workouts_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_workouts
    ADD CONSTRAINT class_workouts_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.workout_templates(id) ON DELETE CASCADE;


--
-- Name: classes classes_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(id);


--
-- Name: classes classes_class_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_class_type_id_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id) ON DELETE RESTRICT;


--
-- Name: classes classes_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: classes classes_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE RESTRICT;


--
-- Name: classes classes_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedules(id) ON DELETE SET NULL;


--
-- Name: coach_playlists coach_playlists_class_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_playlists
    ADD CONSTRAINT coach_playlists_class_type_id_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id) ON DELETE SET NULL;


--
-- Name: coach_playlists coach_playlists_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_playlists
    ADD CONSTRAINT coach_playlists_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE CASCADE;


--
-- Name: coach_substitutions coach_substitutions_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_substitutions
    ADD CONSTRAINT coach_substitutions_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: coach_substitutions coach_substitutions_new_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_substitutions
    ADD CONSTRAINT coach_substitutions_new_instructor_id_fkey FOREIGN KEY (new_instructor_id) REFERENCES public.instructors(id);


--
-- Name: coach_substitutions coach_substitutions_original_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_substitutions
    ADD CONSTRAINT coach_substitutions_original_instructor_id_fkey FOREIGN KEY (original_instructor_id) REFERENCES public.instructors(id);


--
-- Name: coach_substitutions coach_substitutions_substituted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_substitutions
    ADD CONSTRAINT coach_substitutions_substituted_by_fkey FOREIGN KEY (substituted_by) REFERENCES public.users(id);


--
-- Name: discount_code_plans discount_code_plans_discount_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_plans
    ADD CONSTRAINT discount_code_plans_discount_code_id_fkey FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id) ON DELETE CASCADE;


--
-- Name: discount_code_plans discount_code_plans_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_plans
    ADD CONSTRAINT discount_code_plans_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- Name: discount_codes discount_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: egresos egresos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egresos
    ADD CONSTRAINT egresos_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: event_registrations event_registrations_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(id);


--
-- Name: event_registrations event_registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: events events_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE SET NULL;


--
-- Name: guest_bookings guest_bookings_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_bookings
    ADD CONSTRAINT guest_bookings_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(id);


--
-- Name: guest_bookings guest_bookings_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_bookings
    ADD CONSTRAINT guest_bookings_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: guest_bookings guest_bookings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_bookings
    ADD CONSTRAINT guest_bookings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: instructor_availability instructor_availability_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_availability
    ADD CONSTRAINT instructor_availability_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE CASCADE;


--
-- Name: instructors instructors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructors
    ADD CONSTRAINT instructors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: loyalty_points loyalty_points_related_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_points
    ADD CONSTRAINT loyalty_points_related_booking_id_fkey FOREIGN KEY (related_booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: loyalty_points loyalty_points_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_points
    ADD CONSTRAINT loyalty_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: loyalty_redemptions loyalty_redemptions_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_redemptions
    ADD CONSTRAINT loyalty_redemptions_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL;


--
-- Name: loyalty_redemptions loyalty_redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_redemptions
    ADD CONSTRAINT loyalty_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: membership_credits membership_credits_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_credits
    ADD CONSTRAINT membership_credits_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE;


--
-- Name: memberships memberships_activated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_activated_by_fkey FOREIGN KEY (activated_by) REFERENCES public.users(id);


--
-- Name: memberships memberships_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE RESTRICT;


--
-- Name: memberships memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_history notification_history_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_history
    ADD CONSTRAINT notification_history_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE SET NULL;


--
-- Name: notification_history notification_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_history
    ADD CONSTRAINT notification_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notification_logs notification_logs_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: orders orders_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: orders orders_discount_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_discount_code_id_fkey FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id) ON DELETE SET NULL;


--
-- Name: orders orders_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE SET NULL;


--
-- Name: orders orders_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE RESTRICT;


--
-- Name: orders orders_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: orders orders_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_events payment_events_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_events
    ADD CONSTRAINT payment_events_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: payment_proofs payment_proofs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_proofs
    ADD CONSTRAINT payment_proofs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: payment_proofs payment_proofs_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_proofs
    ADD CONSTRAINT payment_proofs_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: payment_proofs payment_proofs_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_proofs
    ADD CONSTRAINT payment_proofs_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payments payments_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE SET NULL;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: payments payments_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: plan_credit_buckets plan_credit_buckets_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_credit_buckets
    ADD CONSTRAINT plan_credit_buckets_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;


--
-- Name: redemptions redemptions_fulfilled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemptions
    ADD CONSTRAINT redemptions_fulfilled_by_fkey FOREIGN KEY (fulfilled_by) REFERENCES public.users(id);


--
-- Name: redemptions redemptions_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemptions
    ADD CONSTRAINT redemptions_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE RESTRICT;


--
-- Name: redemptions redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemptions
    ADD CONSTRAINT redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: referral_codes referral_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referred_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: review_requests review_requests_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_requests
    ADD CONSTRAINT review_requests_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: review_requests review_requests_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_requests
    ADD CONSTRAINT review_requests_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: review_requests review_requests_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_requests
    ADD CONSTRAINT review_requests_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id);


--
-- Name: review_requests review_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_requests
    ADD CONSTRAINT review_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: review_responses review_responses_responded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_responses
    ADD CONSTRAINT review_responses_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.users(id);


--
-- Name: review_responses review_responses_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_responses
    ADD CONSTRAINT review_responses_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: review_tag_selections review_tag_selections_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_tag_selections
    ADD CONSTRAINT review_tag_selections_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: review_tag_selections review_tag_selections_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_tag_selections
    ADD CONSTRAINT review_tag_selections_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.review_tags(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_moderated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES public.users(id);


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sale_items sale_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: sales sales_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sales sales_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: schedules schedules_class_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_class_type_id_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id) ON DELETE CASCADE;


--
-- Name: schedules schedules_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: schedules schedules_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE CASCADE;


--
-- Name: studio_closed_days studio_closed_days_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_closed_days
    ADD CONSTRAINT studio_closed_days_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: suspicious_activity suspicious_activity_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspicious_activity
    ADD CONSTRAINT suspicious_activity_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: suspicious_activity suspicious_activity_checkin_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspicious_activity
    ADD CONSTRAINT suspicious_activity_checkin_log_id_fkey FOREIGN KEY (checkin_log_id) REFERENCES public.checkin_logs(id) ON DELETE SET NULL;


--
-- Name: suspicious_activity suspicious_activity_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspicious_activity
    ADD CONSTRAINT suspicious_activity_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: suspicious_activity suspicious_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspicious_activity
    ADD CONSTRAINT suspicious_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: system_settings system_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: template_favorites template_favorites_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_favorites
    ADD CONSTRAINT template_favorites_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE CASCADE;


--
-- Name: template_favorites template_favorites_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_favorites
    ADD CONSTRAINT template_favorites_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.workout_templates(id) ON DELETE CASCADE;


--
-- Name: unmatched_webhooks unmatched_webhooks_resolved_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unmatched_webhooks
    ADD CONSTRAINT unmatched_webhooks_resolved_payment_id_fkey FOREIGN KEY (resolved_payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;


--
-- Name: users users_prospect_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_prospect_created_by_fkey FOREIGN KEY (prospect_created_by) REFERENCES public.users(id);


--
-- Name: video_comments video_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_comments
    ADD CONSTRAINT video_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.video_comments(id) ON DELETE CASCADE;


--
-- Name: video_comments video_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_comments
    ADD CONSTRAINT video_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: video_comments video_comments_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_comments
    ADD CONSTRAINT video_comments_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;


--
-- Name: video_history video_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_history
    ADD CONSTRAINT video_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: video_history video_history_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_history
    ADD CONSTRAINT video_history_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;


--
-- Name: video_likes video_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_likes
    ADD CONSTRAINT video_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: video_likes video_likes_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_likes
    ADD CONSTRAINT video_likes_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;


--
-- Name: video_purchases video_purchases_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_purchases
    ADD CONSTRAINT video_purchases_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: video_purchases video_purchases_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_purchases
    ADD CONSTRAINT video_purchases_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: video_purchases video_purchases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_purchases
    ADD CONSTRAINT video_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: video_purchases video_purchases_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_purchases
    ADD CONSTRAINT video_purchases_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;


--
-- Name: videos videos_class_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_class_type_id_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id) ON DELETE SET NULL;


--
-- Name: videos videos_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE SET NULL;


--
-- Name: wallet_pass_updates wallet_pass_updates_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_pass_updates
    ADD CONSTRAINT wallet_pass_updates_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE;


--
-- Name: wallet_pass_updates wallet_pass_updates_trigger_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_pass_updates
    ADD CONSTRAINT wallet_pass_updates_trigger_booking_id_fkey FOREIGN KEY (trigger_booking_id) REFERENCES public.bookings(id);


--
-- Name: wallet_pass_updates wallet_pass_updates_wallet_pass_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_pass_updates
    ADD CONSTRAINT wallet_pass_updates_wallet_pass_id_fkey FOREIGN KEY (wallet_pass_id) REFERENCES public.wallet_passes(id) ON DELETE CASCADE;


--
-- Name: wallet_passes wallet_passes_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_passes
    ADD CONSTRAINT wallet_passes_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE;


--
-- Name: wallet_passes wallet_passes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_passes
    ADD CONSTRAINT wallet_passes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: workout_exercises workout_exercises_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_exercises
    ADD CONSTRAINT workout_exercises_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.workout_templates(id) ON DELETE CASCADE;


--
-- Name: workout_templates workout_templates_class_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_templates
    ADD CONSTRAINT workout_templates_class_type_id_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id) ON DELETE SET NULL;


--
-- Name: workout_templates workout_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_templates
    ADD CONSTRAINT workout_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.instructors(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 5r5g3FadbqBvUxayGDH1eKW5u8ZgYxqcdzF0wfnetv4B799xmOJUSPAnCupEImE

