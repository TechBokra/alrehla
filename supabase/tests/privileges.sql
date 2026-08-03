-- Run after the legacy schema chain and the identity corrective migration.
-- These assertions are data-independent and intentionally run in a transaction.

BEGIN;

DO $$
BEGIN
  IF has_column_privilege('authenticated', 'public.profiles', 'clerk_user_id', 'UPDATE') THEN
    RAISE EXCEPTION 'authenticated can update profiles.clerk_user_id';
  END IF;
  IF has_column_privilege('authenticated', 'public.profiles', 'account_type', 'UPDATE') THEN
    RAISE EXCEPTION 'authenticated can update profiles.account_type';
  END IF;
  IF has_column_privilege('authenticated', 'public.profiles', 'global_role', 'UPDATE') THEN
    RAISE EXCEPTION 'authenticated can update profiles.global_role';
  END IF;
  IF has_table_privilege('authenticated', 'public.audit_logs', 'INSERT') THEN
    RAISE EXCEPTION 'authenticated retains direct INSERT privilege on audit_logs';
  END IF;
  IF has_table_privilege('anon', 'public.parent_student_links', 'INSERT') THEN
    RAISE EXCEPTION 'anon retains INSERT privilege on parent_student_links';
  END IF;
  IF has_function_privilege('anon', 'public.ensure_clerk_profile(text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can execute ensure_clerk_profile';
  END IF;
  IF has_function_privilege('anon', 'public.change_user_role(uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can execute change_user_role';
  END IF;
END;
$$;

ROLLBACK;
