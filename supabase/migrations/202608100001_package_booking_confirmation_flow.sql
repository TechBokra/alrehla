-- Critical hardening for the existing creative-writing package booking flow.
-- This migration deliberately reuses bookings and scheduled_sessions as the
-- authoritative package request and schedule records.

BEGIN;

-- The seed historically stored 30 as a multiplier even though every UI and
-- settings form defines this value as a multiplier such as 1.2.
UPDATE public.site_settings
SET value = jsonb_set(
      jsonb_set(value, '{company_percentage}', '1.2'::jsonb, TRUE),
      '{fixed_fee}',
      '50'::jsonb,
      TRUE
    ),
    updated_at = NOW()
WHERE key = 'pricing_config'
  AND COALESCE((value ->> 'company_percentage')::numeric, 0) = 30
  AND COALESCE((value ->> 'fixed_fee')::numeric, 0) = 0;

CREATE OR REPLACE FUNCTION public.can_manage_creative_writing_bookings()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    public.is_admin()
    OR public.current_user_role() = 'creative_writing_supervisor',
    FALSE
  );
$$;

-- This helper deliberately evaluates the coach assignment as the function
-- owner so child_profiles RLS does not recurse back through bookings RLS.
-- It returns only a boolean and still derives the actor from the verified JWT.
CREATE OR REPLACE FUNCTION public.can_read_assigned_booking_child_profile(
  p_child_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    public.can_manage_creative_writing_bookings()
    OR EXISTS (
      SELECT 1
      FROM public.bookings AS b
      JOIN public.instructors AS i ON i.id = b.instructor_id
      WHERE b.child_id = p_child_id
        AND b.status IN ('مؤكد', 'مكتمل')
        AND i.user_id = public.current_app_profile_id()
    ),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.calculate_booking_price(
  p_package_name TEXT,
  p_instructor_id BIGINT
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_base_price NUMERIC;
  v_multiplier NUMERIC := 1.2;
  v_fixed_fee NUMERIC := 50;
BEGIN
  SELECT COALESCE(
           NULLIF(i.package_rates ->> p.id::text, '')::numeric,
           p.price
         )
  INTO v_base_price
  FROM public.creative_writing_packages AS p
  JOIN public.instructors AS i
    ON i.id = p_instructor_id
   AND i.deleted_at IS NULL
  WHERE p.name = trim(p_package_name)
    AND p.is_active = TRUE
    AND p.deleted_at IS NULL;

  IF v_base_price IS NULL THEN
    RAISE EXCEPTION 'Creative writing package or instructor not found';
  END IF;

  IF v_base_price = 0 THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(NULLIF(value ->> 'company_percentage', '')::numeric, 1.2),
         COALESCE(NULLIF(value ->> 'fixed_fee', '')::numeric, 50)
  INTO v_multiplier, v_fixed_fee
  FROM public.site_settings
  WHERE key = 'pricing_config';

  v_multiplier := COALESCE(v_multiplier, 1.2);
  v_fixed_fee := COALESCE(v_fixed_fee, 50);

  IF v_multiplier <= 0 OR v_multiplier > 10 OR v_fixed_fee < 0 THEN
    RAISE EXCEPTION 'Invalid creative writing pricing configuration';
  END IF;

  RETURN ceil((v_base_price * v_multiplier) + v_fixed_fee);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_booking_slot_available_secure(
  p_instructor_id BIGINT,
  p_booking_date DATE,
  p_booking_time TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_time TEXT := left(trim(p_booking_time), 5);
  v_slot TIMESTAMPTZ;
BEGIN
  IF p_instructor_id IS NULL
     OR p_booking_date IS NULL
     OR p_booking_time IS NULL
     OR p_booking_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' THEN
    RETURN FALSE;
  END IF;

  v_slot := make_timestamptz(
    extract(year FROM p_booking_date)::integer,
    extract(month FROM p_booking_date)::integer,
    extract(day FROM p_booking_date)::integer,
    split_part(v_time, ':', 1)::integer,
    split_part(v_time, ':', 2)::integer,
    0,
    'Africa/Cairo'
  );

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.instructor_id = p_instructor_id
      AND b.booking_date = p_booking_date
      AND left(b.booking_time, 5) = v_time
      AND b.status IS DISTINCT FROM 'ملغي'
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.scheduled_sessions AS s
    WHERE s.instructor_id = p_instructor_id
      AND s.session_date = v_slot
      AND s.status = 'upcoming'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_booking_availability_secure()
RETURNS TABLE (
  instructor_id BIGINT,
  booking_date DATE,
  booking_time TEXT,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT busy.instructor_id, busy.booking_date, busy.booking_time, 'reserved'::text
  FROM (
    SELECT b.instructor_id,
           b.booking_date,
           left(b.booking_time, 5) AS booking_time
    FROM public.bookings AS b
    WHERE b.instructor_id IS NOT NULL
      AND b.booking_date IS NOT NULL
      AND b.booking_time IS NOT NULL
      AND b.status IS DISTINCT FROM 'ملغي'
    UNION ALL
    SELECT s.instructor_id,
           (s.session_date AT TIME ZONE 'Africa/Cairo')::date,
           to_char(s.session_date AT TIME ZONE 'Africa/Cairo', 'HH24:MI')
    FROM public.scheduled_sessions AS s
    WHERE s.instructor_id IS NOT NULL
      AND s.status = 'upcoming'
  ) AS busy;
$$;

-- Serialize every discrete instructor slot at the transaction boundary. The
-- trigger also protects reschedules and any legacy direct session mutation.
CREATE OR REPLACE FUNCTION public.protect_scheduled_session_slot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_date DATE;
  v_time TEXT;
BEGIN
  IF NEW.status <> 'upcoming' OR NEW.instructor_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_date := (NEW.session_date AT TIME ZONE 'Africa/Cairo')::date;
  v_time := to_char(NEW.session_date AT TIME ZONE 'Africa/Cairo', 'HH24:MI');

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      NEW.instructor_id::text || '|' || extract(epoch FROM NEW.session_date)::bigint::text,
      0
    )
  );

  IF EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.instructor_id = NEW.instructor_id
      AND b.booking_date = v_date
      AND left(b.booking_time, 5) = v_time
      AND b.status IS DISTINCT FROM 'ملغي'
      AND b.id IS DISTINCT FROM NEW.booking_id
  ) THEN
    RAISE EXCEPTION 'هذا الموعد محجوز بالفعل مع هذا المدرب.' USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.scheduled_sessions AS s
    WHERE s.instructor_id = NEW.instructor_id
      AND s.session_date = NEW.session_date
      AND s.status = 'upcoming'
      AND s.id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'هذا الموعد محجوز بالفعل مع هذا المدرب.' USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_scheduled_session_slot_trigger ON public.scheduled_sessions;
CREATE TRIGGER protect_scheduled_session_slot_trigger
BEFORE INSERT OR UPDATE OF instructor_id, session_date, status
ON public.scheduled_sessions
FOR EACH ROW EXECUTE FUNCTION public.protect_scheduled_session_slot();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.scheduled_sessions
    WHERE instructor_id IS NOT NULL AND status = 'upcoming'
    GROUP BY instructor_id, session_date
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate upcoming instructor session slots must be reconciled before applying this migration';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.scheduled_sessions
    WHERE booking_id IS NOT NULL
    GROUP BY booking_id, session_date
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate booking session records must be reconciled before applying this migration';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.bookings AS b
    JOIN public.scheduled_sessions AS s
      ON s.instructor_id = b.instructor_id
     AND (s.session_date AT TIME ZONE 'Africa/Cairo')::date = b.booking_date
     AND to_char(s.session_date AT TIME ZONE 'Africa/Cairo', 'HH24:MI') = left(b.booking_time, 5)
     AND s.booking_id IS DISTINCT FROM b.id
    WHERE b.status IS DISTINCT FROM 'ملغي'
      AND s.status = 'upcoming'
  ) THEN
    RAISE EXCEPTION 'Cross-booking instructor slot conflicts must be reconciled before applying this migration';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS scheduled_sessions_upcoming_instructor_slot_unique
ON public.scheduled_sessions (instructor_id, session_date)
WHERE instructor_id IS NOT NULL AND status = 'upcoming';

CREATE UNIQUE INDEX IF NOT EXISTS scheduled_sessions_booking_slot_unique
ON public.scheduled_sessions (booking_id, session_date)
WHERE booking_id IS NOT NULL;

DO $$
DECLARE
  v_function RECORD;
BEGIN
  FOR v_function IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n
      ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'create_booking_secure'
      AND p.pronargs = 7
  LOOP
    EXECUTE format(
      'DROP FUNCTION IF EXISTS %I.%I(%s)',
      v_function.nspname,
      v_function.proname,
      v_function.args
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_booking_secure(
  p_user_id UUID,
  p_child_id BIGINT,
  p_instructor_id BIGINT,
  p_package_name TEXT,
  p_booking_date DATE,
  p_booking_time TEXT,
  p_receipt_url TEXT,
  p_expected_total NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking_id TEXT;
  v_price NUMERIC(10, 2);
  v_booking_time TEXT;
  v_status TEXT;
  v_booking JSONB;
  v_day_key TEXT;
  v_slot TIMESTAMPTZ;
  v_schedule JSONB;
BEGIN
  IF public.current_app_profile_id() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id <> public.current_app_profile_id()
     AND NOT public.can_manage_creative_writing_bookings()
     AND NOT EXISTS (
       SELECT 1
       FROM public.child_profiles AS c
       WHERE c.id = p_child_id
         AND c.user_id = p_user_id
         AND c.student_user_id = public.current_app_profile_id()
     ) THEN
    RAISE EXCEPTION 'Not authorized to create booking for another user';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.child_profiles AS c
    WHERE c.id = p_child_id
      AND (c.user_id = p_user_id OR public.can_manage_creative_writing_bookings())
  ) THEN
    RAISE EXCEPTION 'Child profile does not belong to user';
  END IF;

  IF p_booking_date IS NULL OR p_booking_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Invalid booking date';
  END IF;

  IF p_booking_time IS NULL
     OR p_booking_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' THEN
    RAISE EXCEPTION 'Invalid booking time';
  END IF;
  v_booking_time := left(p_booking_time, 5);

  SELECT i.weekly_schedule
  INTO v_schedule
  FROM public.instructors AS i
  WHERE i.id = p_instructor_id
    AND i.deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Instructor not found';
  END IF;

  v_day_key := CASE extract(dow FROM p_booking_date)::integer
    WHEN 0 THEN 'sunday'
    WHEN 1 THEN 'monday'
    WHEN 2 THEN 'tuesday'
    WHEN 3 THEN 'wednesday'
    WHEN 4 THEN 'thursday'
    WHEN 5 THEN 'friday'
    ELSE 'saturday'
  END;

  IF NOT (COALESCE(v_schedule -> v_day_key, '[]'::jsonb) ? v_booking_time) THEN
    RAISE EXCEPTION 'Selected time is not in the instructor approved schedule';
  END IF;

  v_price := public.calculate_booking_price(p_package_name, p_instructor_id);
  IF p_expected_total IS NULL OR round(p_expected_total, 2) <> round(v_price, 2) THEN
    RAISE EXCEPTION 'Booking price changed; refresh checkout and try again';
  END IF;
  v_slot := make_timestamptz(
    extract(year FROM p_booking_date)::integer,
    extract(month FROM p_booking_date)::integer,
    extract(day FROM p_booking_date)::integer,
    split_part(v_booking_time, ':', 1)::integer,
    split_part(v_booking_time, ':', 2)::integer,
    0,
    'Africa/Cairo'
  );

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_instructor_id::text || '|' || extract(epoch FROM v_slot)::bigint::text, 0)
  );

  IF NOT public.is_booking_slot_available_secure(p_instructor_id, p_booking_date, v_booking_time) THEN
    RAISE EXCEPTION 'هذا الموعد محجوز بالفعل مع هذا المدرب.' USING ERRCODE = '23505';
  END IF;

  -- Free bookings still require the same explicit confirmation operation so a
  -- row can never be confirmed without its complete session set.
  v_status := CASE
    WHEN v_price = 0 OR COALESCE(trim(p_receipt_url), '') <> '' THEN 'بانتظار المراجعة'
    ELSE 'بانتظار الدفع'
  END;
  v_booking_id := 'BKG-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

  INSERT INTO public.bookings (
    id, user_id, child_id, instructor_id, package_name, booking_date,
    booking_time, total, status, receipt_url
  )
  VALUES (
    v_booking_id, p_user_id, p_child_id, p_instructor_id, trim(p_package_name),
    p_booking_date, v_booking_time, v_price, v_status, NULLIF(trim(p_receipt_url), '')
  )
  RETURNING jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'child_id', child_id,
    'instructor_id', instructor_id,
    'package_name', package_name,
    'booking_date', booking_date,
    'booking_time', booking_time,
    'total', total,
    'status', status,
    'receipt_url', receipt_url,
    'created_at', created_at
  ) INTO v_booking;

  RETURN v_booking;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_booking_secure(p_booking_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_package public.creative_writing_packages%ROWTYPE;
  v_session_count INTEGER;
  v_existing_count INTEGER;
  v_index INTEGER;
  v_slot TIMESTAMPTZ;
  v_slots TIMESTAMPTZ[] := ARRAY[]::timestamptz[];
BEGIN
  IF NOT public.can_manage_creative_writing_bookings() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = trim(p_booking_id)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status NOT IN ('بانتظار المراجعة', 'مؤكد') THEN
    RAISE EXCEPTION 'Only a booking under review can be confirmed';
  END IF;

  IF v_booking.child_id IS NULL
     OR v_booking.instructor_id IS NULL
     OR v_booking.package_name IS NULL
     OR v_booking.booking_date IS NULL
     OR v_booking.booking_time IS NULL THEN
    RAISE EXCEPTION 'Booking is missing required child, instructor, package, or schedule data';
  END IF;

  IF COALESCE(v_booking.total, 0) > 0 AND COALESCE(trim(v_booking.receipt_url), '') = '' THEN
    RAISE EXCEPTION 'A paid booking cannot be confirmed without a payment receipt';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.child_profiles AS c
    WHERE c.id = v_booking.child_id AND c.user_id = v_booking.user_id
  ) THEN
    RAISE EXCEPTION 'Booking child does not belong to the booking parent';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.instructors AS i
    WHERE i.id = v_booking.instructor_id AND i.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Booking instructor is not available';
  END IF;

  SELECT * INTO v_package
  FROM public.creative_writing_packages AS p
  WHERE p.name = v_booking.package_name
    AND p.is_active = TRUE
    AND p.deleted_at IS NULL;

  IF NOT FOUND OR trim(COALESCE(v_package.sessions, '')) !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'Package has an invalid session count';
  END IF;

  v_session_count := trim(v_package.sessions)::integer;
  IF v_session_count < 1 OR v_session_count > 100 THEN
    RAISE EXCEPTION 'Package session count is outside the supported range';
  END IF;

  FOR v_index IN 0..(v_session_count - 1) LOOP
    v_slot := make_timestamptz(
      extract(year FROM (v_booking.booking_date + (v_index * 7)))::integer,
      extract(month FROM (v_booking.booking_date + (v_index * 7)))::integer,
      extract(day FROM (v_booking.booking_date + (v_index * 7)))::integer,
      split_part(left(v_booking.booking_time, 5), ':', 1)::integer,
      split_part(left(v_booking.booking_time, 5), ':', 2)::integer,
      0,
      'Africa/Cairo'
    );
    v_slots := array_append(v_slots, v_slot);
  END LOOP;

  SELECT count(*) INTO v_existing_count
  FROM public.scheduled_sessions
  WHERE booking_id = v_booking.id;

  IF v_existing_count = v_session_count
     AND v_booking.status = 'مؤكد'
     AND NOT EXISTS (
       SELECT 1
       FROM public.scheduled_sessions AS s
       WHERE s.booking_id = v_booking.id
         AND (
           s.child_id IS DISTINCT FROM v_booking.child_id
           OR s.instructor_id IS DISTINCT FROM v_booking.instructor_id
           OR NOT (s.session_date = ANY(v_slots))
         )
     ) THEN
    RETURN jsonb_build_object(
      'id', v_booking.id,
      'status', v_booking.status,
      'session_count', v_existing_count,
      'idempotent', TRUE
    );
  END IF;

  IF v_existing_count <> 0 THEN
    RAISE EXCEPTION 'Booking has an inconsistent partial session set';
  END IF;

  -- Acquire all locks in chronological order to prevent deadlocks between two
  -- package confirmations that overlap on more than one occurrence.
  FOREACH v_slot IN ARRAY v_slots LOOP
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(v_booking.instructor_id::text || '|' || extract(epoch FROM v_slot)::bigint::text, 0)
    );
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM unnest(v_slots) AS requested(slot)
    JOIN public.bookings AS other
      ON other.instructor_id = v_booking.instructor_id
     AND other.booking_date = (requested.slot AT TIME ZONE 'Africa/Cairo')::date
     AND left(other.booking_time, 5) = to_char(requested.slot AT TIME ZONE 'Africa/Cairo', 'HH24:MI')
     AND other.status IS DISTINCT FROM 'ملغي'
     AND other.id <> v_booking.id
  ) OR EXISTS (
    SELECT 1
    FROM unnest(v_slots) AS requested(slot)
    JOIN public.scheduled_sessions AS existing
      ON existing.instructor_id = v_booking.instructor_id
     AND existing.session_date = requested.slot
     AND existing.status = 'upcoming'
  ) THEN
    RAISE EXCEPTION 'One or more package session slots are already reserved' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.scheduled_sessions (
    booking_id, child_id, instructor_id, session_date, status
  )
  SELECT v_booking.id, v_booking.child_id, v_booking.instructor_id, slot, 'upcoming'
  FROM unnest(v_slots) AS generated(slot)
  ORDER BY slot;

  UPDATE public.bookings
  SET status = 'مؤكد', updated_at = NOW()
  WHERE id = v_booking.id;

  RETURN jsonb_build_object(
    'id', v_booking.id,
    'status', 'مؤكد',
    'session_count', v_session_count,
    'idempotent', FALSE
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_booking_status_secure(
  p_booking_id TEXT,
  p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_deleted_sessions INTEGER := 0;
BEGIN
  IF NOT public.can_manage_creative_writing_bookings() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_new_status NOT IN ('بانتظار الدفع', 'بانتظار المراجعة', 'مكتمل', 'ملغي') THEN
    RAISE EXCEPTION 'Invalid booking status; use confirm_booking_secure for confirmation';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = trim(p_booking_id)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status = 'ملغي' AND p_new_status <> 'ملغي' THEN
    RAISE EXCEPTION 'A cancelled booking cannot be reactivated';
  END IF;

  IF p_new_status = 'مكتمل' AND v_booking.status NOT IN ('مؤكد', 'مكتمل') THEN
    RAISE EXCEPTION 'Only a confirmed booking can be completed';
  END IF;

  IF p_new_status IN ('بانتظار الدفع', 'بانتظار المراجعة')
     AND v_booking.status NOT IN ('بانتظار الدفع', 'بانتظار المراجعة') THEN
    RAISE EXCEPTION 'Cannot move an active or closed booking back to a pending state';
  END IF;

  IF p_new_status = 'ملغي' THEN
    DELETE FROM public.scheduled_sessions
    WHERE booking_id = v_booking.id
      AND status = 'upcoming'
      AND session_date > NOW();
    GET DIAGNOSTICS v_deleted_sessions = ROW_COUNT;
  END IF;

  UPDATE public.bookings
  SET status = p_new_status, updated_at = NOW()
  WHERE id = v_booking.id;

  RETURN jsonb_build_object(
    'id', v_booking.id,
    'status', p_new_status,
    'released_future_sessions', v_deleted_sessions
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_booking_receipt_secure(
  p_booking_id TEXT,
  p_receipt_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_actor UUID := public.current_app_profile_id();
BEGIN
  IF v_actor IS NULL OR COALESCE(trim(p_receipt_url), '') = '' OR length(p_receipt_url) > 5000 THEN
    RAISE EXCEPTION 'Invalid receipt submission';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = trim(p_booking_id)
  FOR UPDATE;

  IF NOT FOUND OR (v_booking.user_id <> v_actor AND NOT public.can_manage_creative_writing_bookings()) THEN
    RAISE EXCEPTION 'Booking not found or not owned by current user';
  END IF;

  IF v_booking.status NOT IN ('بانتظار الدفع', 'بانتظار المراجعة') THEN
    RAISE EXCEPTION 'Receipt cannot be changed after booking activation or closure';
  END IF;

  UPDATE public.bookings
  SET receipt_url = trim(p_receipt_url),
      status = 'بانتظار المراجعة',
      updated_at = NOW()
  WHERE id = v_booking.id;

  RETURN jsonb_build_object(
    'id', v_booking.id,
    'status', 'بانتظار المراجعة',
    'receipt_url', trim(p_receipt_url)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.authorize_session_join_secure(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor UUID := public.current_app_profile_id();
  v_session public.scheduled_sessions%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
  v_is_privileged BOOLEAN := FALSE;
  v_is_participant BOOLEAN := FALSE;
  v_settings JSONB := '{}'::jsonb;
  v_join_before INTEGER := 10;
  v_expire_after INTEGER := 30;
  v_join_at TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
  v_allowed BOOLEAN;
  v_domain TEXT := 'meet.jit.si';
  v_prefix TEXT := 'alrehla';
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_session
  FROM public.scheduled_sessions
  WHERE id = p_session_id;

  IF NOT FOUND OR v_session.booking_id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_session.booking_id;

  v_is_privileged := public.can_manage_creative_writing_bookings()
    OR EXISTS (
      SELECT 1 FROM public.instructors AS i
      WHERE i.id = v_session.instructor_id AND i.user_id = v_actor
    );

  v_is_participant := v_is_privileged
    OR v_booking.user_id = v_actor
    OR EXISTS (
      SELECT 1 FROM public.child_profiles AS c
      WHERE c.id = v_session.child_id AND c.student_user_id = v_actor
    );

  IF NOT v_is_participant THEN
    RAISE EXCEPTION 'Not authorized for this session';
  END IF;

  SELECT value INTO v_settings
  FROM public.site_settings
  WHERE key = 'jitsi_settings';

  v_join_before := CASE
    WHEN v_is_privileged THEN 30
    ELSE greatest(0, least(1440, COALESCE((v_settings ->> 'join_minutes_before')::integer, 10)))
  END;
  v_expire_after := greatest(1, least(10080, COALESCE((v_settings ->> 'expire_minutes_after')::integer, 30)));
  v_domain := COALESCE(NULLIF(trim(v_settings ->> 'domain'), ''), 'meet.jit.si');
  v_prefix := COALESCE(NULLIF(trim(v_settings ->> 'room_prefix'), ''), 'alrehla');
  v_join_at := v_session.session_date - make_interval(mins => v_join_before);
  v_expires_at := v_session.session_date + make_interval(mins => v_expire_after);
  v_allowed := v_booking.status = 'مؤكد'
    AND v_session.status = 'upcoming'
    AND NOW() >= v_join_at
    AND NOW() <= v_expires_at;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'reason', CASE
      WHEN v_booking.status <> 'مؤكد' THEN 'booking_inactive'
      WHEN v_session.status <> 'upcoming' THEN 'session_closed'
      WHEN NOW() < v_join_at THEN 'too_early'
      WHEN NOW() > v_expires_at THEN 'expired'
      ELSE 'allowed'
    END,
    'session_id', v_session.id,
    'session_date', v_session.session_date,
    'join_allowed_at', v_join_at,
    'join_expires_at', v_expires_at,
    'domain', CASE WHEN v_allowed THEN v_domain ELSE NULL END,
    'room_name', CASE
      WHEN v_allowed THEN v_prefix || replace(v_session.id::text, '-', '')
      ELSE NULL
    END
  );
END;
$$;

-- Correct participant visibility while keeping the same underlying booking and
-- session rows for parent, linked student, and assigned instructor.
DROP POLICY IF EXISTS bookings_related_read ON public.bookings;
CREATE POLICY bookings_related_read ON public.bookings
FOR SELECT USING (
  user_id = public.current_app_profile_id()
  OR public.can_manage_creative_writing_bookings()
  OR EXISTS (
    SELECT 1 FROM public.instructors AS i
    WHERE i.id = bookings.instructor_id AND i.user_id = public.current_app_profile_id()
  )
  OR EXISTS (
    SELECT 1 FROM public.child_profiles AS c
    WHERE c.id = bookings.child_id AND c.student_user_id = public.current_app_profile_id()
  )
);

DROP POLICY IF EXISTS bookings_owner_insert ON public.bookings;
DROP POLICY IF EXISTS bookings_related_update ON public.bookings;
DROP POLICY IF EXISTS bookings_safe_collaboration_update ON public.bookings;
CREATE POLICY bookings_safe_collaboration_update ON public.bookings
FOR UPDATE USING (
  user_id = public.current_app_profile_id()
  OR public.can_manage_creative_writing_bookings()
  OR EXISTS (
    SELECT 1 FROM public.instructors AS i
    WHERE i.id = bookings.instructor_id AND i.user_id = public.current_app_profile_id()
  )
  OR EXISTS (
    SELECT 1 FROM public.child_profiles AS c
    WHERE c.id = bookings.child_id AND c.student_user_id = public.current_app_profile_id()
  )
) WITH CHECK (
  user_id = public.current_app_profile_id()
  OR public.can_manage_creative_writing_bookings()
  OR EXISTS (
    SELECT 1 FROM public.instructors AS i
    WHERE i.id = bookings.instructor_id AND i.user_id = public.current_app_profile_id()
  )
  OR EXISTS (
    SELECT 1 FROM public.child_profiles AS c
    WHERE c.id = bookings.child_id AND c.student_user_id = public.current_app_profile_id()
  )
);

-- Clerk subjects resolve to profiles.id through current_app_profile_id(). Keep
-- the parent/student relationship readable without depending on a legacy
-- child_profiles policy that may not exist on every deployed database.
DROP POLICY IF EXISTS child_profiles_parent_student_read ON public.child_profiles;
CREATE POLICY child_profiles_parent_student_read ON public.child_profiles
FOR SELECT TO authenticated USING (
  user_id = public.current_app_profile_id()
  OR student_user_id = public.current_app_profile_id()
  OR public.can_manage_creative_writing_bookings()
);

DROP POLICY IF EXISTS child_profiles_assigned_booking_read ON public.child_profiles;
CREATE POLICY child_profiles_assigned_booking_read ON public.child_profiles
FOR SELECT TO authenticated USING (
  public.can_read_assigned_booking_child_profile(id)
);

DROP POLICY IF EXISTS profiles_creative_booking_related_read ON public.profiles;
CREATE POLICY profiles_creative_booking_related_read ON public.profiles
FOR SELECT USING (
  public.can_manage_creative_writing_bookings()
  AND (
    EXISTS (SELECT 1 FROM public.bookings AS b WHERE b.user_id = profiles.id)
    OR EXISTS (SELECT 1 FROM public.child_profiles AS c WHERE c.student_user_id = profiles.id)
    OR EXISTS (SELECT 1 FROM public.instructors AS i WHERE i.user_id = profiles.id)
  )
);

DROP POLICY IF EXISTS scheduled_sessions_related_read ON public.scheduled_sessions;
CREATE POLICY scheduled_sessions_related_read ON public.scheduled_sessions
FOR SELECT USING (
  public.can_manage_creative_writing_bookings()
  OR EXISTS (
    SELECT 1 FROM public.bookings AS b
    WHERE b.id = scheduled_sessions.booking_id
      AND b.user_id = public.current_app_profile_id()
  )
  OR EXISTS (
    SELECT 1 FROM public.instructors AS i
    WHERE i.id = scheduled_sessions.instructor_id
      AND i.user_id = public.current_app_profile_id()
  )
  OR EXISTS (
    SELECT 1 FROM public.child_profiles AS c
    WHERE c.id = scheduled_sessions.child_id
      AND c.student_user_id = public.current_app_profile_id()
  )
);

DROP POLICY IF EXISTS scheduled_sessions_admin_or_instructor_manage ON public.scheduled_sessions;
CREATE POLICY scheduled_sessions_admin_or_instructor_manage ON public.scheduled_sessions
FOR ALL USING (
  public.can_manage_creative_writing_bookings()
  OR EXISTS (
    SELECT 1 FROM public.instructors AS i
    WHERE i.id = scheduled_sessions.instructor_id
      AND i.user_id = public.current_app_profile_id()
  )
) WITH CHECK (
  public.can_manage_creative_writing_bookings()
  OR EXISTS (
    SELECT 1 FROM public.instructors AS i
    WHERE i.id = scheduled_sessions.instructor_id
      AND i.user_id = public.current_app_profile_id()
  )
);

DROP POLICY IF EXISTS session_messages_related_read ON public.session_messages;
CREATE POLICY session_messages_related_read ON public.session_messages
FOR SELECT USING (
  public.can_manage_creative_writing_bookings()
  OR EXISTS (
    SELECT 1
    FROM public.bookings AS b
    LEFT JOIN public.instructors AS i ON i.id = b.instructor_id
    LEFT JOIN public.child_profiles AS c ON c.id = b.child_id
    WHERE b.id = session_messages.booking_id
      AND b.status IN ('مؤكد', 'مكتمل')
      AND (
        b.user_id = public.current_app_profile_id()
        OR i.user_id = public.current_app_profile_id()
        OR c.student_user_id = public.current_app_profile_id()
      )
  )
);

DROP POLICY IF EXISTS session_messages_sender_insert ON public.session_messages;
CREATE POLICY session_messages_sender_insert ON public.session_messages
FOR INSERT WITH CHECK (
  sender_id = public.current_app_profile_id()
  AND (
    public.can_manage_creative_writing_bookings()
    OR EXISTS (
      SELECT 1
      FROM public.bookings AS b
      LEFT JOIN public.instructors AS i ON i.id = b.instructor_id
      LEFT JOIN public.child_profiles AS c ON c.id = b.child_id
      WHERE b.id = session_messages.booking_id
        AND b.status IN ('مؤكد', 'مكتمل')
        AND (
          b.user_id = public.current_app_profile_id()
          OR i.user_id = public.current_app_profile_id()
          OR c.student_user_id = public.current_app_profile_id()
        )
    )
  )
);

DROP POLICY IF EXISTS session_attachments_related_read ON public.session_attachments;
CREATE POLICY session_attachments_related_read ON public.session_attachments
FOR SELECT USING (
  public.can_manage_creative_writing_bookings()
  OR EXISTS (
    SELECT 1
    FROM public.bookings AS b
    LEFT JOIN public.instructors AS i ON i.id = b.instructor_id
    LEFT JOIN public.child_profiles AS c ON c.id = b.child_id
    WHERE b.id = session_attachments.booking_id
      AND b.status IN ('مؤكد', 'مكتمل')
      AND (
        b.user_id = public.current_app_profile_id()
        OR i.user_id = public.current_app_profile_id()
        OR c.student_user_id = public.current_app_profile_id()
      )
  )
);

DROP POLICY IF EXISTS session_attachments_uploader_insert ON public.session_attachments;
CREATE POLICY session_attachments_uploader_insert ON public.session_attachments
FOR INSERT WITH CHECK (
  uploader_id = public.current_app_profile_id()
  AND (
    public.can_manage_creative_writing_bookings()
    OR EXISTS (
      SELECT 1
      FROM public.bookings AS b
      LEFT JOIN public.instructors AS i ON i.id = b.instructor_id
      LEFT JOIN public.child_profiles AS c ON c.id = b.child_id
      WHERE b.id = session_attachments.booking_id
        AND b.status IN ('مؤكد', 'مكتمل')
        AND (
          b.user_id = public.current_app_profile_id()
          OR i.user_id = public.current_app_profile_id()
          OR c.student_user_id = public.current_app_profile_id()
        )
    )
  )
);

-- RLS decides which collaboration row may be changed; column grants ensure the
-- caller can never directly change status, totals, ownership, receipt, or slots.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS progress_notes TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS draft_content TEXT,
  ADD COLUMN IF NOT EXISTS session_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.scheduled_sessions
  ADD COLUMN IF NOT EXISTS notes TEXT;

REVOKE INSERT, UPDATE, DELETE ON public.bookings FROM anon, authenticated;
GRANT SELECT ON public.bookings TO authenticated;
GRANT UPDATE (progress_notes, draft_content, details) ON public.bookings TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.scheduled_sessions FROM anon, authenticated;
GRANT SELECT ON public.scheduled_sessions TO authenticated;
GRANT UPDATE (session_date, status, notes) ON public.scheduled_sessions TO authenticated;

REVOKE ALL ON FUNCTION public.can_manage_creative_writing_bookings() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_read_assigned_booking_child_profile(BIGINT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.calculate_booking_price(TEXT, BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_booking_slot_available_secure(BIGINT, DATE, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_booking_availability_secure() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_booking_secure(UUID, BIGINT, BIGINT, TEXT, DATE, TEXT, TEXT, NUMERIC) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_booking_secure(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_booking_status_secure(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_booking_receipt_secure(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.authorize_session_join_secure(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.can_manage_creative_writing_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_assigned_booking_child_profile(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_booking_price(TEXT, BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_booking_slot_available_secure(BIGINT, DATE, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_availability_secure() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_secure(UUID, BIGINT, BIGINT, TEXT, DATE, TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_booking_secure(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_booking_status_secure(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_booking_receipt_secure(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.authorize_session_join_secure(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
