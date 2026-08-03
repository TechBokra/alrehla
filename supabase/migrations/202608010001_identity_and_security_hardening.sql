-- Corrective migration for environments bootstrapped by the legacy flat SQL chain.
--
-- Do not use this file as a clean baseline. The repository does not yet prove that
-- its remote database is fresh or resettable. Apply only after the existing
-- 00_setup.sql -> 01_seed.sql -> 02_clerk_auth.sql -> 03/04/05 chain is reconciled.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'public.profiles is missing; reconcile the legacy base schema first';
  END IF;
END;
$$;

-- Separate account type and global role from the legacy mixed role column. The
-- legacy role is intentionally retained for compatibility until Clerk
-- Organization roles are configured and all consumers are migrated.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT,
  ADD COLUMN IF NOT EXISTS global_role TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN;

UPDATE public.profiles
SET account_type = CASE WHEN role = 'student' THEN 'student' ELSE 'parent' END
WHERE account_type IS NULL;

UPDATE public.profiles
SET global_role = CASE
  WHEN role = 'super_admin' THEN 'super_admin'
  WHEN role = 'support_agent' THEN 'support_admin'
  ELSE NULL
END
WHERE global_role IS NULL;

COMMENT ON COLUMN public.profiles.role IS
  'Legacy compatibility role. student maps to account_type=student; user/parent and all legacy staff/domain roles map to account_type=parent. super_admin and support_agent also map to global_role; organization-scoped staff roles come from Clerk org_role.';
COMMENT ON COLUMN public.profiles.account_type IS
  'Application account type only: parent or student. Never use this column as a global privilege.';
COMMENT ON COLUMN public.profiles.global_role IS
  'Application-wide privilege only: super_admin or support_admin. Organization roles are resolved from the verified Clerk JWT claim.';

ALTER TABLE public.profiles
  ALTER COLUMN account_type SET DEFAULT 'parent',
  ALTER COLUMN account_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_account_type_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_account_type_check
      CHECK (account_type IN ('parent', 'student'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_global_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_global_role_check
      CHECK (global_role IS NULL OR global_role IN ('super_admin', 'support_admin'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_account_type
  ON public.profiles (account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_global_role
  ON public.profiles (global_role)
  WHERE global_role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id_security
  ON public.profiles (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

-- A managed child has no Clerk identity. This table is only for students who
-- have an independent Clerk account and is writable through RPCs below.
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'guardian',
  can_view_progress BOOLEAN NOT NULL DEFAULT TRUE,
  can_manage_enrollment BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT parent_student_links_distinct_profiles
    CHECK (parent_profile_id <> student_profile_id),
  CONSTRAINT parent_student_links_unique_pair
    UNIQUE (parent_profile_id, student_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent
  ON public.parent_student_links (parent_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student
  ON public.parent_student_links (student_profile_id, status);

DROP TRIGGER IF EXISTS parent_student_links_updated_at ON public.parent_student_links;
CREATE TRIGGER parent_student_links_updated_at
BEFORE UPDATE ON public.parent_student_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- All identity helpers resolve the subject from the verified Clerk token. None
-- accepts a browser-supplied Clerk ID, role, or account type.
CREATE OR REPLACE FUNCTION public.current_auth_subject()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT NULLIF(auth.jwt() ->> 'sub', '');
$$;

CREATE OR REPLACE FUNCTION public.current_auth_uuid()
RETURNS UUID
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN public.current_auth_subject() ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.current_auth_subject()::uuid
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.current_app_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    public.current_auth_uuid(),
    (
      SELECT p.id
      FROM public.profiles AS p
      WHERE p.clerk_user_id = public.current_auth_subject()
      LIMIT 1
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role
  FROM public.profiles AS p
  WHERE p.id = public.current_app_profile_id();
$$;

CREATE OR REPLACE FUNCTION public.current_account_type()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.account_type
  FROM public.profiles AS p
  WHERE p.id = public.current_app_profile_id();
$$;

CREATE OR REPLACE FUNCTION public.current_global_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.global_role
  FROM public.profiles AS p
  WHERE p.id = public.current_app_profile_id();
$$;

CREATE OR REPLACE FUNCTION public.current_clerk_org_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT NULLIF(auth.jwt() ->> 'org_role', '');
$$;

CREATE OR REPLACE FUNCTION public.has_role(allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    public.current_user_role() = ANY(allowed_roles)
    OR public.current_global_role() = ANY(allowed_roles)
    OR public.current_clerk_org_role() = ANY(allowed_roles),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    public.current_global_role() IN ('super_admin', 'support_admin')
    OR public.current_user_role() = 'super_admin'
    OR public.current_clerk_org_role() IN ('org:general_supervisor', 'general_supervisor'),
    FALSE
  );
$$;

DROP FUNCTION IF EXISTS public.ensure_clerk_profile(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.ensure_clerk_profile(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.ensure_clerk_profile(
  p_email TEXT,
  p_name TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_subject TEXT := public.current_auth_subject();
  v_profile public.profiles;
  v_email TEXT := lower(trim(p_email));
  v_jwt_email TEXT := lower(NULLIF(auth.jwt() ->> 'email', ''));
  v_verified BOOLEAN := CASE
    WHEN auth.jwt() ->> 'email_verified' = 'true' THEN TRUE
    WHEN auth.jwt() ->> 'email_verified' = 'false' THEN FALSE
    ELSE NULL
  END;
BEGIN
  IF v_subject IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_email IS NULL OR v_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Invalid profile email';
  END IF;

  IF v_jwt_email IS NOT NULL AND v_jwt_email IS DISTINCT FROM v_email THEN
    RAISE EXCEPTION 'Clerk email mismatch';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE clerk_user_id = v_subject
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.profiles
    SET email = v_email,
        email_verified = COALESCE(v_verified, email_verified),
        name = COALESCE(NULLIF(trim(p_name), ''), name),
        updated_at = NOW()
    WHERE id = v_profile.id
    RETURNING * INTO v_profile;
    RETURN v_profile;
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE lower(email) = v_email
    AND clerk_user_id IS NULL
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.profiles
    SET clerk_user_id = v_subject,
        email_verified = COALESCE(v_verified, email_verified),
        name = COALESCE(NULLIF(trim(p_name), ''), name),
        updated_at = NOW()
    WHERE id = v_profile.id
    RETURNING * INTO v_profile;
    RETURN v_profile;
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(email) = v_email) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'Profile email already belongs to another Clerk identity';
  END IF;

  INSERT INTO public.profiles (
    id, clerk_user_id, email, email_verified, name, role, account_type, global_role
  )
  VALUES (
    gen_random_uuid(),
    v_subject,
    v_email,
    v_verified,
    COALESCE(NULLIF(trim(p_name), ''), split_part(v_email, '@', 1)),
    'user',
    'parent',
    NULL
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

-- Trusted admin action for creating a profile after Clerk has created the user.
-- The caller must already be an authenticated database admin.
CREATE OR REPLACE FUNCTION public.create_profile_for_clerk_user(
  p_clerk_user_id TEXT,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile public.profiles;
  v_role TEXT := lower(trim(p_role));
  v_account_type TEXT := CASE WHEN v_role = 'student' THEN 'student' ELSE 'parent' END;
  v_global_role TEXT := CASE
    WHEN v_role = 'super_admin' THEN 'super_admin'
    WHEN v_role = 'support_agent' THEN 'support_admin'
    ELSE NULL
  END;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
    RAISE EXCEPTION 'Missing Clerk user id';
  END IF;

  IF p_email IS NULL OR lower(trim(p_email)) !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Invalid profile email';
  END IF;

  IF v_role NOT IN (
    'user', 'parent', 'student', 'instructor', 'super_admin',
    'general_supervisor', 'enha_lak_supervisor', 'creative_writing_supervisor',
    'content_editor', 'support_agent', 'publisher'
  ) THEN
    RAISE EXCEPTION 'Invalid application role';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE clerk_user_id = trim(p_clerk_user_id)
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.profiles
    SET email = lower(trim(p_email)),
        name = COALESCE(NULLIF(trim(p_name), ''), name),
        role = v_role,
        account_type = v_account_type,
        global_role = v_global_role,
        updated_at = NOW()
    WHERE id = v_profile.id
    RETURNING * INTO v_profile;
    RETURN v_profile;
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE lower(email) = lower(trim(p_email))
    AND clerk_user_id IS NULL
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.profiles
    SET clerk_user_id = trim(p_clerk_user_id),
        name = COALESCE(NULLIF(trim(p_name), ''), name),
        role = v_role,
        account_type = v_account_type,
        global_role = v_global_role,
        updated_at = NOW()
    WHERE id = v_profile.id
    RETURNING * INTO v_profile;
    RETURN v_profile;
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(email) = lower(trim(p_email))) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'Profile email already belongs to another identity';
  END IF;

  INSERT INTO public.profiles (
    clerk_user_id, email, name, role, account_type, global_role
  )
  VALUES (
    trim(p_clerk_user_id),
    lower(trim(p_email)),
    COALESCE(NULLIF(trim(p_name), ''), 'مستخدم الرحلة'),
    v_role,
    v_account_type,
    v_global_role
  )
  RETURNING * INTO v_profile;

  INSERT INTO public.audit_logs (user_id, action, target_description, details)
  VALUES (
    public.current_app_profile_id(),
    'profile.created',
    v_profile.id::text,
    'Created by a trusted Clerk administrator workflow'
  );

  RETURN v_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_user_role(
  p_target_profile_id UUID,
  p_role TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile public.profiles;
  v_actor UUID := public.current_app_profile_id();
  v_role TEXT := lower(trim(p_role));
  v_account_type TEXT := CASE WHEN v_role = 'student' THEN 'student' ELSE 'parent' END;
  v_global_role TEXT := CASE
    WHEN v_role = 'super_admin' THEN 'super_admin'
    WHEN v_role = 'support_agent' THEN 'support_admin'
    ELSE NULL
  END;
BEGIN
  IF v_actor IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_target_profile_id = v_actor THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;
  IF v_role NOT IN (
    'user', 'parent', 'student', 'instructor', 'super_admin',
    'general_supervisor', 'enha_lak_supervisor', 'creative_writing_supervisor',
    'content_editor', 'support_agent', 'publisher'
  ) THEN
    RAISE EXCEPTION 'Invalid application role';
  END IF;
  IF v_role = 'super_admin'
     AND public.current_global_role() <> 'super_admin'
     AND public.current_user_role() <> 'super_admin' THEN
    RAISE EXCEPTION 'Only a super admin may assign super_admin';
  END IF;

  UPDATE public.profiles
  SET role = v_role,
      account_type = v_account_type,
      global_role = v_global_role,
      updated_at = NOW()
  WHERE id = p_target_profile_id
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  INSERT INTO public.audit_logs (user_id, action, target_description, details)
  VALUES (v_actor, 'profile.role_changed', p_target_profile_id::text, v_role);

  RETURN v_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_audit_event(
  p_action TEXT,
  p_target_description TEXT,
  p_details TEXT
)
RETURNS public.audit_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_log public.audit_logs;
BEGIN
  IF public.current_app_profile_id() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.audit_logs (user_id, action, target_description, details)
  VALUES (
    public.current_app_profile_id(),
    left(trim(p_action), 200),
    left(trim(p_target_description), 1000),
    left(COALESCE(p_details, ''), 10000)
  )
  RETURNING * INTO v_log;

  RETURN v_log;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_parent_student(
  p_student_profile_id UUID,
  p_relationship TEXT DEFAULT 'guardian'
)
RETURNS public.parent_student_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_parent_id UUID := public.current_app_profile_id();
  v_student public.profiles;
  v_link public.parent_student_links;
BEGIN
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF public.current_account_type() <> 'parent'
     AND public.current_user_role() NOT IN ('parent', 'user') THEN
    RAISE EXCEPTION 'Only a parent may create a parent-student link';
  END IF;

  SELECT * INTO v_student
  FROM public.profiles
  WHERE id = p_student_profile_id
    AND account_type = 'student'
    AND clerk_user_id IS NOT NULL
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Authenticated student profile not found';
  END IF;

  INSERT INTO public.parent_student_links (
    parent_profile_id, student_profile_id, relationship, status
  )
  VALUES (v_parent_id, p_student_profile_id, COALESCE(NULLIF(trim(p_relationship), ''), 'guardian'), 'active')
  ON CONFLICT (parent_profile_id, student_profile_id)
  DO UPDATE SET
    relationship = EXCLUDED.relationship,
    status = 'active',
    updated_at = NOW()
  RETURNING * INTO v_link;

  RETURN v_link;
END;
$$;

CREATE OR REPLACE FUNCTION public.disable_parent_student_link(p_link_id UUID)
RETURNS public.parent_student_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_link public.parent_student_links;
BEGIN
  UPDATE public.parent_student_links
  SET status = 'disabled', updated_at = NOW()
  WHERE id = p_link_id
    AND parent_profile_id = public.current_app_profile_id()
  RETURNING * INTO v_link;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Link not found or not owned by current parent';
  END IF;
  RETURN v_link;
END;
$$;

-- Keep the managed-child flow, but make its new profile mapping explicit.
CREATE OR REPLACE FUNCTION public.create_parent_managed_student_profile(
  p_child_profile_id BIGINT,
  p_clerk_user_id TEXT,
  p_email TEXT,
  p_name TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_parent_id UUID := public.current_app_profile_id();
  v_child public.child_profiles;
  v_profile public.profiles;
  v_email TEXT := lower(trim(p_email));
  v_name TEXT := COALESCE(NULLIF(trim(p_name), ''), split_part(lower(trim(p_email)), '@', 1));
BEGIN
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
    RAISE EXCEPTION 'Missing Clerk user id';
  END IF;
  IF v_email IS NULL OR v_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Invalid student email';
  END IF;

  SELECT * INTO v_child
  FROM public.child_profiles
  WHERE id = p_child_profile_id AND user_id = v_parent_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Child profile not found or not owned by current parent';
  END IF;
  IF v_child.student_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Child profile already has a linked student account';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE clerk_user_id = trim(p_clerk_user_id)) THEN
    RAISE EXCEPTION 'Clerk user is already linked to a profile';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(email) = v_email) THEN
    RAISE EXCEPTION 'Student email already exists';
  END IF;

  INSERT INTO public.profiles (
    clerk_user_id, email, name, role, account_type, global_role
  )
  VALUES (trim(p_clerk_user_id), v_email, v_name, 'student', 'student', NULL)
  RETURNING * INTO v_profile;

  UPDATE public.child_profiles
  SET student_user_id = v_profile.id, updated_at = NOW()
  WHERE id = p_child_profile_id;

  RETURN v_profile;
END;
$$;

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parent_student_links_select_related ON public.parent_student_links;
CREATE POLICY parent_student_links_select_related
ON public.parent_student_links
FOR SELECT
USING (
  parent_profile_id = public.current_app_profile_id()
  OR student_profile_id = public.current_app_profile_id()
  OR public.is_admin()
);

DROP POLICY IF EXISTS profiles_insert_self_safe_role ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_delete ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own_profile_fields ON public.profiles;
CREATE POLICY profiles_update_own_profile_fields
ON public.profiles
FOR UPDATE
USING (id = public.current_app_profile_id())
WITH CHECK (id = public.current_app_profile_id());

-- Column grants are the second boundary: RLS cannot prevent a permitted UPDATE
-- from changing protected columns, while column grants can.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (
  name, phone, address, city, country, governorate, timezone, currency
)
ON public.profiles TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.parent_student_links FROM anon, authenticated;
GRANT SELECT ON public.parent_student_links TO authenticated;

DROP POLICY IF EXISTS audit_logs_authenticated_insert_own ON public.audit_logs;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.ensure_clerk_profile(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_profile_for_clerk_user(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.change_user_role(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_audit_event(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.link_parent_student(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.disable_parent_student_link(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_parent_managed_student_profile(BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_auth_subject() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_auth_uuid() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_account_type() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_global_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_clerk_org_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_clerk_profile(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_for_clerk_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_audit_event(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_parent_student(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_parent_student_link(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_parent_managed_student_profile(BIGINT, TEXT, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
