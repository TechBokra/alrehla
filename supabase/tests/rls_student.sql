-- Independent-student relationship checks.
-- Data-dependent cross-student row assertions require fixture profiles and a
-- Clerk JWT; this file verifies the schema/policy boundary without inventing data.

BEGIN;

DO $$
DECLARE
  v_source TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'parent_student_links'
      AND policyname = 'parent_student_links_select_related'
  ) THEN
    RAISE EXCEPTION 'student relationship SELECT policy is missing';
  END IF;

  SELECT pg_get_functiondef('public.link_parent_student(uuid,text)'::regprocedure)
    INTO v_source;
  IF v_source NOT LIKE '%account_type%' OR v_source NOT LIKE '%clerk_user_id%' THEN
    RAISE EXCEPTION 'link_parent_student does not validate an independent Clerk student';
  END IF;

  IF has_table_privilege('authenticated', 'public.parent_student_links', 'UPDATE') THEN
    RAISE EXCEPTION 'students must not update relationship rows directly';
  END IF;
END;
$$;

ROLLBACK;
