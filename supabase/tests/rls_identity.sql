-- Run after the legacy chain and
-- 202608010001_identity_and_security_hardening.sql.
-- This test is intentionally data-independent and can run in CI or the SQL editor.

BEGIN;

DO $$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['profiles', 'parent_student_links', 'audit_logs']
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = v_table
        AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS is not enabled on public.%', v_table;
    END IF;
  END LOOP;

  IF to_regprocedure('public.ensure_clerk_profile(text,text)') IS NULL THEN
    RAISE EXCEPTION 'Identity-derived ensure_clerk_profile(text,text) is missing';
  END IF;
  IF to_regprocedure('public.ensure_clerk_profile(text,text,text,text)') IS NOT NULL THEN
    RAISE EXCEPTION 'Unsafe role/identity-taking ensure_clerk_profile overload remains';
  END IF;
  IF to_regprocedure('public.change_user_role(uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'Protected role-change RPC is missing';
  END IF;
END;
$$;

DO $$
BEGIN
  IF has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') THEN
    RAISE EXCEPTION 'authenticated can update protected profiles.role';
  END IF;
  IF has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE') THEN
    RAISE EXCEPTION 'authenticated can update protected profiles.email';
  END IF;
  IF has_table_privilege('authenticated', 'public.audit_logs', 'INSERT') THEN
    RAISE EXCEPTION 'authenticated retains direct INSERT privilege on audit_logs';
  END IF;
END;
$$;

ROLLBACK;
