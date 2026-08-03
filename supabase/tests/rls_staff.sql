-- Staff/admin checks for role and organization-aware helpers.

BEGIN;

DO $$
DECLARE
  v_role_source TEXT;
  v_admin_source TEXT;
BEGIN
  SELECT pg_get_functiondef('public.change_user_role(uuid,text)'::regprocedure)
    INTO v_role_source;
  IF v_role_source NOT LIKE '%is_admin()%' OR v_role_source NOT LIKE '%Cannot change your own role%' THEN
    RAISE EXCEPTION 'change_user_role is missing database-side admin/self-change checks';
  END IF;

  SELECT pg_get_functiondef('public.is_admin()'::regprocedure)
    INTO v_admin_source;
  IF v_admin_source NOT LIKE '%current_global_role%' OR v_admin_source NOT LIKE '%current_clerk_org_role%' THEN
    RAISE EXCEPTION 'is_admin does not combine global and Clerk organization roles';
  END IF;

  IF has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') THEN
    RAISE EXCEPTION 'staff role changes must use change_user_role, not direct profile writes';
  END IF;
  IF has_function_privilege('anon', 'public.record_audit_event(text,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can execute record_audit_event';
  END IF;
END;
$$;

ROLLBACK;
