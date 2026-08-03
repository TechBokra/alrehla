-- Parent/managed-child relationship checks.
-- A live role fixture is required to test row results; these assertions verify
-- the database cannot be bypassed with direct relationship-table writes.

BEGIN;

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_policy_exists BOOLEAN;
  v_link_function_exists BOOLEAN;
BEGIN
  SELECT c.relrowsecurity INTO v_rls_enabled
  FROM pg_class AS c
  JOIN pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'parent_student_links';

  IF COALESCE(v_rls_enabled, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'parent_student_links must have RLS enabled';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'parent_student_links'
      AND policyname = 'parent_student_links_select_related'
  ) INTO v_policy_exists;
  IF NOT v_policy_exists THEN
    RAISE EXCEPTION 'related parent/student SELECT policy is missing';
  END IF;

  SELECT to_regprocedure('public.link_parent_student(uuid,text)') IS NOT NULL
    INTO v_link_function_exists;
  IF NOT v_link_function_exists THEN
    RAISE EXCEPTION 'controlled parent/student link RPC is missing';
  END IF;

  IF has_table_privilege('authenticated', 'public.parent_student_links', 'INSERT') THEN
    RAISE EXCEPTION 'parents must link students through the RPC, not direct INSERT';
  END IF;
END;
$$;

ROLLBACK;
