-- Behavioral fixture for the paid 8-session package flow. This test exercises
-- the real RPCs and RLS policies and rolls every fixture back.

BEGIN;

INSERT INTO public.profiles (
  id, clerk_user_id, email, name, role, account_type, global_role
) VALUES
  ('10000000-0000-4000-8000-000000000001', 'test_parent_mohamed', 'test-parent-mohamed@example.invalid', 'Mohamed', 'parent', 'parent', NULL),
  ('10000000-0000-4000-8000-000000000002', 'test_student_ahmed', 'test-student-ahmed@example.invalid', 'Ahmed', 'student', 'student', NULL),
  ('10000000-0000-4000-8000-000000000003', 'test_coach_sara', 'test-coach-sara@example.invalid', 'Sara', 'instructor', 'parent', NULL),
  ('10000000-0000-4000-8000-000000000004', 'test_admin', 'test-admin@example.invalid', 'Admin', 'super_admin', 'parent', 'super_admin'),
  ('10000000-0000-4000-8000-000000000005', 'test_parent_other', 'test-parent-other@example.invalid', 'Other Parent', 'parent', 'parent', NULL),
  ('10000000-0000-4000-8000-000000000006', 'test_student_other', 'test-student-other@example.invalid', 'Other Student', 'student', 'student', NULL);

INSERT INTO public.child_profiles (
  id, user_id, student_user_id, name, birth_date, gender
) OVERRIDING SYSTEM VALUE VALUES
  (910001, '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'Ahmed', '2014-01-01', 'ذكر'),
  (910002, '10000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000006', 'Other Student', '2014-01-01', 'ذكر');

INSERT INTO public.instructors (
  id, user_id, name, slug, weekly_schedule, package_rates, schedule_status
) OVERRIDING SYSTEM VALUE VALUES (
  920001,
  '10000000-0000-4000-8000-000000000003',
  'Sara',
  '__test_coach_sara__',
  '{"saturday":["10:00"],"sunday":["10:00"],"monday":["10:00"],"tuesday":["10:00"],"wednesday":["10:00"],"thursday":["10:00"],"friday":["10:00"]}'::jsonb,
  '{}'::jsonb,
  'approved'
);

INSERT INTO public.creative_writing_packages (
  id, name, sessions, price, description, is_active
) OVERRIDING SYSTEM VALUE VALUES (
  930001, '__test_8_sessions__', '8', 2200, 'Eight-session test package', TRUE
);

INSERT INTO public.site_settings (key, value, updated_at)
VALUES (
  'pricing_config',
  '{"company_percentage":1.2,"fixed_fee":50}'::jsonb,
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO public.site_settings (key, value, updated_at)
VALUES (
  'jitsi_settings',
  '{"domain":"meet.jit.si","room_prefix":"test-room-","join_minutes_before":10,"expire_minutes_after":30}'::jsonb,
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();

-- Mohamed creates the package request. Without a receipt it must remain unpaid.
SELECT set_config('request.jwt.claims', '{"sub":"test_parent_mohamed"}', TRUE);
SET LOCAL ROLE authenticated;
SELECT public.create_booking_secure(
  '10000000-0000-4000-8000-000000000001',
  910001,
  920001,
  '__test_8_sessions__',
  '2099-01-04',
  '10:00',
  NULL,
  2690
);
RESET ROLE;

DO $$
DECLARE
  v_booking public.bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE user_id = '10000000-0000-4000-8000-000000000001'
    AND package_name = '__test_8_sessions__';
  IF v_booking.status <> 'بانتظار الدفع' THEN
    RAISE EXCEPTION 'booking became active before receipt/admin confirmation';
  END IF;
  IF v_booking.total <> 2690 THEN
    RAISE EXCEPTION 'stored total % does not match authoritative quote 2690', v_booking.total;
  END IF;
  IF EXISTS (SELECT 1 FROM public.scheduled_sessions WHERE booking_id = v_booking.id) THEN
    RAISE EXCEPTION 'sessions were created before admin confirmation';
  END IF;
END;
$$;

-- The owner submits the receipt and the request becomes reviewable, not active.
SELECT set_config('request.jwt.claims', '{"sub":"test_parent_mohamed"}', TRUE);
SET LOCAL ROLE authenticated;
SELECT public.submit_booking_receipt_secure(
  (SELECT id FROM public.bookings WHERE package_name = '__test_8_sessions__'),
  'https://storage.example.invalid/receipt.png'
);
RESET ROLE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE package_name = '__test_8_sessions__'
      AND status = 'بانتظار المراجعة'
      AND receipt_url = 'https://storage.example.invalid/receipt.png'
  ) THEN
    RAISE EXCEPTION 'receipt submission did not create the review state';
  END IF;
END;
$$;

-- Admin confirmation creates all 8 weekly sessions atomically.
SELECT set_config('request.jwt.claims', '{"sub":"test_admin"}', TRUE);
SET LOCAL ROLE authenticated;
SELECT public.confirm_booking_secure(
  (SELECT id FROM public.bookings WHERE package_name = '__test_8_sessions__')
);
-- A second click must be idempotent.
SELECT public.confirm_booking_secure(
  (SELECT id FROM public.bookings WHERE package_name = '__test_8_sessions__')
);
RESET ROLE;

DO $$
DECLARE
  v_booking_id TEXT;
BEGIN
  SELECT id INTO v_booking_id
  FROM public.bookings
  WHERE package_name = '__test_8_sessions__';

  IF (SELECT status FROM public.bookings WHERE id = v_booking_id) <> 'مؤكد' THEN
    RAISE EXCEPTION 'confirmation did not activate the booking';
  END IF;
  IF (SELECT count(*) FROM public.scheduled_sessions WHERE booking_id = v_booking_id) <> 8 THEN
    RAISE EXCEPTION 'confirmation did not create exactly eight sessions';
  END IF;
  IF (SELECT count(DISTINCT session_date) FROM public.scheduled_sessions WHERE booking_id = v_booking_id) <> 8 THEN
    RAISE EXCEPTION 'confirmation created duplicate sessions';
  END IF;
  IF (SELECT min(session_date AT TIME ZONE 'Africa/Cairo')::date FROM public.scheduled_sessions WHERE booking_id = v_booking_id) <> DATE '2099-01-04'
     OR (SELECT max(session_date AT TIME ZONE 'Africa/Cairo')::date FROM public.scheduled_sessions WHERE booking_id = v_booking_id) <> DATE '2099-02-22' THEN
    RAISE EXCEPTION 'the generated weekly package schedule is incorrect';
  END IF;
END;
$$;

-- Parent, linked student, and assigned coach see the same booking/session rows.
SELECT set_config('request.jwt.claims', '{"sub":"test_parent_mohamed"}', TRUE);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.scheduled_sessions WHERE child_id = 910001) <> 8 THEN
    RAISE EXCEPTION 'parent cannot see all package sessions';
  END IF;
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"test_student_ahmed"}', TRUE);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.bookings WHERE child_id = 910001) <> 1
     OR (SELECT count(*) FROM public.scheduled_sessions WHERE child_id = 910001) <> 8 THEN
    RAISE EXCEPTION 'linked student cannot see the authoritative booking/session set';
  END IF;
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"test_coach_sara"}', TRUE);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.scheduled_sessions WHERE instructor_id = 920001) <> 8
     OR (SELECT count(*) FROM public.child_profiles WHERE id = 910001) <> 1 THEN
    RAISE EXCEPTION 'assigned coach cannot see the session/student relationship';
  END IF;
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"test_parent_other"}', TRUE);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.bookings WHERE child_id = 910001)
     OR EXISTS (SELECT 1 FROM public.scheduled_sessions WHERE child_id = 910001) THEN
    RAISE EXCEPTION 'unrelated family can see Ahmed booking/session data';
  END IF;
END $$;
RESET ROLE;

-- An already-generated future package occurrence must reject another student.
SELECT set_config('request.jwt.claims', '{"sub":"test_parent_other"}', TRUE);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM public.create_booking_secure(
    '10000000-0000-4000-8000-000000000005',
    910002,
    920001,
    '__test_8_sessions__',
    '2099-01-11',
    '10:00',
    NULL,
    2690
  );
  RAISE EXCEPTION 'double booking unexpectedly succeeded';
EXCEPTION
  WHEN unique_violation THEN NULL;
  WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%محجوز%' THEN RAISE; END IF;
END;
$$;
RESET ROLE;

-- Join-room data is server-released only to a participant in the time window.
UPDATE public.scheduled_sessions
SET session_date = NOW()
WHERE id = (
  SELECT id FROM public.scheduled_sessions
  WHERE child_id = 910001 ORDER BY session_date LIMIT 1
);
SELECT set_config(
  'test.booking_session_id',
  (SELECT id::text FROM public.scheduled_sessions WHERE child_id = 910001 ORDER BY session_date LIMIT 1),
  TRUE
);

SELECT set_config('request.jwt.claims', '{"sub":"test_parent_mohamed"}', TRUE);
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  v_access JSONB;
BEGIN
  SELECT public.authorize_session_join_secure(
    current_setting('test.booking_session_id')::uuid
  ) INTO v_access;
  IF COALESCE((v_access ->> 'allowed')::boolean, FALSE) IS NOT TRUE
     OR COALESCE(v_access ->> 'room_name', '') = '' THEN
    RAISE EXCEPTION 'authorized parent did not receive in-window room access';
  END IF;
END;
$$;
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"test_student_ahmed"}', TRUE);
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_access JSONB;
BEGIN
  SELECT public.authorize_session_join_secure(current_setting('test.booking_session_id')::uuid)
  INTO v_access;
  IF COALESCE((v_access ->> 'allowed')::boolean, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'linked student did not receive in-window room access';
  END IF;
END;
$$;
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"test_coach_sara"}', TRUE);
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_access JSONB;
BEGIN
  SELECT public.authorize_session_join_secure(current_setting('test.booking_session_id')::uuid)
  INTO v_access;
  IF COALESCE((v_access ->> 'allowed')::boolean, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'assigned coach did not receive in-window room access';
  END IF;
END;
$$;
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"test_admin"}', TRUE);
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_access JSONB;
BEGIN
  SELECT public.authorize_session_join_secure(current_setting('test.booking_session_id')::uuid)
  INTO v_access;
  IF COALESCE((v_access ->> 'allowed')::boolean, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'authorized admin did not receive in-window room access';
  END IF;
END;
$$;
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"test_parent_other"}', TRUE);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM public.authorize_session_join_secure(
    current_setting('test.booking_session_id')::uuid
  );
  RAISE EXCEPTION 'unrelated parent received room authorization';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM = 'unrelated parent received room authorization' THEN RAISE; END IF;
END;
$$;
RESET ROLE;

-- Cancellation releases future occurrences but preserves the elapsed session.
SELECT set_config('request.jwt.claims', '{"sub":"test_admin"}', TRUE);
SET LOCAL ROLE authenticated;
SELECT public.update_booking_status_secure(
  (SELECT id FROM public.bookings WHERE package_name = '__test_8_sessions__'),
  'ملغي'
);
RESET ROLE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.scheduled_sessions
    WHERE child_id = 910001 AND status = 'upcoming' AND session_date > NOW()
  ) THEN
    RAISE EXCEPTION 'cancellation did not release all future package slots';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.scheduled_sessions WHERE child_id = 910001) THEN
    RAISE EXCEPTION 'cancellation erased session history';
  END IF;
END;
$$;

-- Once cancelled, another family can reserve one of the released future slots.
SELECT set_config('request.jwt.claims', '{"sub":"test_parent_other"}', TRUE);
SET LOCAL ROLE authenticated;
SELECT public.create_booking_secure(
  '10000000-0000-4000-8000-000000000005',
  910002,
  920001,
  '__test_8_sessions__',
  '2099-01-11',
  '10:00',
  NULL,
  2690
);
RESET ROLE;

ROLLBACK;
