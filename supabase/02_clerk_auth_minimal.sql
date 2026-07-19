-- =========================================================
-- Minimal Clerk auth sync for Alrehla
--
-- Run this if Google/Clerk login reaches the app but fails with:
-- "قاعدة البيانات لا تحتوي بعد على دالة مزامنة ملفات Clerk"
--
-- This file intentionally avoids broad RLS policy rewrites so it can be
-- applied safely before the full supabase/02_clerk_auth.sql migration.
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_constraint RECORD;
BEGIN
  FOR v_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'f'
      AND confrelid = 'auth.users'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', v_constraint.conname);
  END LOOP;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id
  ON public.profiles(clerk_user_id);

CREATE OR REPLACE FUNCTION public.current_auth_subject()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt()->>'sub', '');
$$;

CREATE OR REPLACE FUNCTION public.current_auth_uuid()
RETURNS UUID
LANGUAGE sql
STABLE
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
SET search_path = public
AS $$
  SELECT COALESCE(
    public.current_auth_uuid(),
    (
      SELECT p.id
      FROM public.profiles p
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
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = public.current_app_profile_id();
$$;

CREATE OR REPLACE FUNCTION public.has_role(allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = ANY(allowed_roles), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(ARRAY['super_admin', 'general_supervisor']);
$$;

CREATE OR REPLACE FUNCTION public.ensure_clerk_profile(
  p_clerk_user_id TEXT,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'user'
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subject TEXT := public.current_auth_subject();
  v_profile public.profiles;
  v_role TEXT := COALESCE(NULLIF(p_role, ''), 'user');
  v_email TEXT := lower(trim(p_email));
  v_jwt_email TEXT := lower(NULLIF(COALESCE(
    auth.jwt()->>'email',
    auth.jwt()->'user_metadata'->>'email'
  ), ''));
BEGIN
  IF v_subject IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_clerk_user_id IS DISTINCT FROM v_subject THEN
    RAISE EXCEPTION 'Clerk subject mismatch';
  END IF;

  IF v_email IS NULL OR v_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Invalid profile email';
  END IF;

  IF v_jwt_email IS NOT NULL AND v_jwt_email IS DISTINCT FROM v_email THEN
    RAISE EXCEPTION 'Clerk email mismatch';
  END IF;

  IF v_role NOT IN ('user', 'parent', 'student') THEN
    v_role := 'user';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE clerk_user_id = p_clerk_user_id
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.profiles
    SET clerk_user_id = p_clerk_user_id,
        email = CASE WHEN v_jwt_email = v_email THEN v_email ELSE email END,
        name = COALESCE(NULLIF(trim(p_name), ''), name),
        updated_at = NOW()
    WHERE id = v_profile.id
    RETURNING * INTO v_profile;

    RETURN v_profile;
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE lower(email) = v_email
  LIMIT 1;

  IF FOUND THEN
    IF v_jwt_email IS NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '23505',
        MESSAGE = 'Profile email already exists and requires trusted account linking';
    END IF;

    UPDATE public.profiles
    SET clerk_user_id = p_clerk_user_id,
        name = COALESCE(NULLIF(trim(p_name), ''), name),
        updated_at = NOW()
    WHERE id = v_profile.id
    RETURNING * INTO v_profile;

    RETURN v_profile;
  END IF;

  INSERT INTO public.profiles (id, clerk_user_id, email, name, role, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    p_clerk_user_id,
    v_email,
    COALESCE(NULLIF(trim(p_name), ''), split_part(v_email, '@', 1)),
    v_role,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_clerk_profile(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_auth_subject() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_auth_uuid() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_clerk_profile(TEXT, TEXT, TEXT, TEXT) TO authenticated;


-- Parent-managed student accounts: Clerk is the auth source, profiles.id stays UUID.
CREATE OR REPLACE FUNCTION public.create_parent_managed_student_profile(
  p_child_profile_id BIGINT,
  p_clerk_user_id TEXT,
  p_email TEXT,
  p_name TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  WHERE id = p_child_profile_id
    AND user_id = v_parent_id
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

  INSERT INTO public.profiles (id, clerk_user_id, email, name, role, created_at, updated_at)
  VALUES (gen_random_uuid(), trim(p_clerk_user_id), v_email, v_name, 'student', NOW(), NOW())
  RETURNING * INTO v_profile;

  UPDATE public.child_profiles
  SET student_user_id = v_profile.id,
      updated_at = NOW()
  WHERE id = p_child_profile_id;

  RETURN v_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_parent_managed_student_clerk_user_id(
  p_student_profile_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID := public.current_app_profile_id();
  v_clerk_user_id TEXT;
BEGIN
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.clerk_user_id INTO v_clerk_user_id
  FROM public.child_profiles c
  JOIN public.profiles p ON p.id = c.student_user_id
  WHERE c.user_id = v_parent_id
    AND c.student_user_id = p_student_profile_id
    AND p.role = 'student'
  LIMIT 1;

  IF v_clerk_user_id IS NULL THEN
    RAISE EXCEPTION 'Student account not found or not owned by current parent';
  END IF;

  RETURN v_clerk_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_parent_managed_student_profile(BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_parent_managed_student_clerk_user_id(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_parent_managed_student_profile(BIGINT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_managed_student_clerk_user_id(UUID) TO authenticated;


NOTIFY pgrst, 'reload schema';
 THEN
    RAISE EXCEPTION 'Invalid student email';
  END IF;

  SELECT * INTO v_child
  FROM public.child_profiles
  WHERE id = p_child_profile_id
    AND user_id = v_parent_id
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

  INSERT INTO public.profiles (id, clerk_user_id, email, name, role, created_at, updated_at)
  VALUES (gen_random_uuid(), trim(p_clerk_user_id), v_email, v_name, 'student', NOW(), NOW())
  RETURNING * INTO v_profile;

  UPDATE public.child_profiles
  SET student_user_id = v_profile.id,
      updated_at = NOW()
  WHERE id = p_child_profile_id;

  RETURN v_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_parent_managed_student_clerk_user_id(
  p_student_profile_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID := public.current_app_profile_id();
  v_clerk_user_id TEXT;
BEGIN
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.clerk_user_id INTO v_clerk_user_id
  FROM public.child_profiles c
  JOIN public.profiles p ON p.id = c.student_user_id
  WHERE c.user_id = v_parent_id
    AND c.student_user_id = p_student_profile_id
    AND p.role = 'student'
  LIMIT 1;

  IF v_clerk_user_id IS NULL THEN
    RAISE EXCEPTION 'Student account not found or not owned by current parent';
  END IF;

  RETURN v_clerk_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_parent_managed_student_profile(BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_parent_managed_student_clerk_user_id(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_parent_managed_student_profile(BIGINT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_managed_student_clerk_user_id(UUID) TO authenticated;


NOTIFY pgrst, 'reload schema';
