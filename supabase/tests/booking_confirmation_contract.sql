-- Data-independent contract checks for the package booking confirmation flow.
-- Run after 202608100001_package_booking_confirmation_flow.sql.

BEGIN;

DO $$
DECLARE
  v_confirmation_source TEXT;
  v_creation_source TEXT;
  v_availability_source TEXT;
  v_join_source TEXT;
BEGIN
  IF to_regprocedure('public.confirm_booking_secure(text)') IS NULL THEN
    RAISE EXCEPTION 'confirm_booking_secure(text) is missing';
  END IF;
  IF to_regprocedure('public.submit_booking_receipt_secure(text,text)') IS NULL THEN
    RAISE EXCEPTION 'submit_booking_receipt_secure(text,text) is missing';
  END IF;
  IF to_regprocedure('public.authorize_session_join_secure(uuid)') IS NULL THEN
    RAISE EXCEPTION 'authorize_session_join_secure(uuid) is missing';
  END IF;
  IF to_regprocedure('public.is_booking_slot_available_secure(bigint,date,text)') IS NULL THEN
    RAISE EXCEPTION 'privacy-safe availability RPC is missing';
  END IF;
  IF to_regprocedure('public.can_read_assigned_booking_child_profile(bigint)') IS NULL THEN
    RAISE EXCEPTION 'non-recursive assigned-coach child authorization helper is missing';
  END IF;

  IF to_regclass('public.scheduled_sessions_upcoming_instructor_slot_unique') IS NULL THEN
    RAISE EXCEPTION 'database-level instructor slot uniqueness is missing';
  END IF;
  IF to_regclass('public.scheduled_sessions_booking_slot_unique') IS NULL THEN
    RAISE EXCEPTION 'booking session idempotency index is missing';
  END IF;

  SELECT pg_get_functiondef('public.confirm_booking_secure(text)'::regprocedure)
  INTO v_confirmation_source;
  IF v_confirmation_source NOT LIKE '%FOR UPDATE%'
     OR v_confirmation_source NOT LIKE '%pg_advisory_xact_lock%'
     OR v_confirmation_source NOT LIKE '%creative_writing_packages%'
     OR v_confirmation_source NOT LIKE '%scheduled_sessions%' THEN
    RAISE EXCEPTION 'confirmation is missing row locking, slot locking, package validation, or session generation';
  END IF;

  IF to_regprocedure('public.create_booking_secure(uuid,bigint,bigint,text,date,text,text)') IS NOT NULL THEN
    RAISE EXCEPTION 'legacy create_booking_secure overload bypasses the expected checkout total';
  END IF;

  SELECT pg_get_functiondef('public.create_booking_secure(uuid,bigint,bigint,text,date,text,text,numeric)'::regprocedure)
  INTO v_creation_source;
  IF v_creation_source NOT LIKE '%calculate_booking_price%'
     OR v_creation_source NOT LIKE '%pg_advisory_xact_lock%'
     OR v_creation_source NOT LIKE '%is_booking_slot_available_secure%' THEN
    RAISE EXCEPTION 'booking creation is missing authoritative pricing or cross-table slot protection';
  END IF;

  SELECT pg_get_functiondef('public.is_booking_slot_available_secure(bigint,date,text)'::regprocedure)
  INTO v_availability_source;
  IF v_availability_source NOT LIKE '%bookings%'
     OR v_availability_source NOT LIKE '%scheduled_sessions%' THEN
    RAISE EXCEPTION 'booking availability does not check both booking requests and generated sessions';
  END IF;

  SELECT pg_get_functiondef('public.authorize_session_join_secure(uuid)'::regprocedure)
  INTO v_join_source;
  IF v_join_source NOT LIKE '%join_allowed_at%'
     OR v_join_source NOT LIKE '%join_expires_at%'
     OR v_join_source NOT LIKE '%student_user_id%'
     OR v_join_source NOT LIKE '%room_name%' THEN
    RAISE EXCEPTION 'join authorization is missing timing, participant, or room release checks';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'child_profiles'
      AND policyname = 'child_profiles_parent_student_read'
      AND qual LIKE '%student_user_id%current_app_profile_id%'
  ) THEN
    RAISE EXCEPTION 'Clerk-linked student child-profile visibility policy is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'child_profiles'
      AND policyname = 'child_profiles_assigned_booking_read'
      AND qual LIKE '%can_read_assigned_booking_child_profile%'
      AND qual NOT LIKE '%bookings%'
  ) THEN
    RAISE EXCEPTION 'assigned-coach child policy is missing or can recurse through bookings RLS';
  END IF;

  IF has_table_privilege('authenticated', 'public.bookings', 'INSERT') THEN
    RAISE EXCEPTION 'authenticated can bypass create_booking_secure with direct INSERT';
  END IF;
  IF has_column_privilege('authenticated', 'public.bookings', 'status', 'UPDATE') THEN
    RAISE EXCEPTION 'authenticated can bypass confirmation with direct status UPDATE';
  END IF;
  IF has_column_privilege('authenticated', 'public.bookings', 'total', 'UPDATE') THEN
    RAISE EXCEPTION 'authenticated can directly alter authoritative booking totals';
  END IF;
  IF has_column_privilege('authenticated', 'public.bookings', 'receipt_url', 'UPDATE') THEN
    RAISE EXCEPTION 'authenticated can bypass the receipt submission RPC';
  END IF;
  IF NOT has_column_privilege('authenticated', 'public.bookings', 'progress_notes', 'UPDATE') THEN
    RAISE EXCEPTION 'safe collaboration fields were unintentionally disabled';
  END IF;
  IF has_table_privilege('authenticated', 'public.scheduled_sessions', 'INSERT')
     OR has_table_privilege('authenticated', 'public.scheduled_sessions', 'DELETE') THEN
    RAISE EXCEPTION 'authenticated can bypass confirmation by creating or deleting session rows';
  END IF;
  IF NOT has_column_privilege('authenticated', 'public.scheduled_sessions', 'notes', 'UPDATE') THEN
    RAISE EXCEPTION 'coach session reporting was unintentionally disabled';
  END IF;

  IF has_function_privilege('anon', 'public.confirm_booking_secure(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can confirm a booking';
  END IF;
  IF has_function_privilege('anon', 'public.submit_booking_receipt_secure(text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can submit a booking receipt';
  END IF;
  IF has_function_privilege('anon', 'public.authorize_session_join_secure(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can request protected room access';
  END IF;
  IF has_function_privilege('anon', 'public.can_read_assigned_booking_child_profile(bigint)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can invoke assigned-coach child authorization';
  END IF;
  IF NOT has_function_privilege('anon', 'public.get_booking_availability_secure()', 'EXECUTE') THEN
    RAISE EXCEPTION 'public calendar cannot read privacy-safe availability';
  END IF;
END;
$$;

ROLLBACK;
