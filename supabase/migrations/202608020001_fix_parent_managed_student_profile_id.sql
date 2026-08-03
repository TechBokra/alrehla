-- Ensure parent-managed student profiles always receive their UUID primary key.
-- This is additive and safe for databases that already have the function.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Some legacy deployments have public.profiles.id as NOT NULL UUID without the
-- default present in the canonical baseline. Repair that invariant for all
-- future profile inserts, including callers outside this RPC.
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

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
    id, clerk_user_id, email, name, role, account_type, global_role
  )
  VALUES (gen_random_uuid(), trim(p_clerk_user_id), v_email, v_name, 'student', 'student', NULL)
  RETURNING * INTO v_profile;

  UPDATE public.child_profiles
  SET student_user_id = v_profile.id, updated_at = NOW()
  WHERE id = p_child_profile_id;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.create_parent_managed_student_profile(BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_parent_managed_student_profile(BIGINT, TEXT, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
