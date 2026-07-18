-- =========================================================
-- Clerk third-party auth compatibility for Alrehla
-- Run after 00_setup.sql when using Clerk as Supabase third-party auth.
--
-- Why this exists:
-- Clerk session subjects are string IDs (for example user_xxx), while the
-- existing Alrehla schema keeps app profile IDs as UUID foreign keys. This
-- migration maps Clerk subjects to profiles.clerk_user_id and exposes a safe
-- current_app_profile_id() helper that all RLS policies can compare to UUID
-- owner columns.
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clerk users are verified by their external JWT and do not have rows in
-- auth.users. Keep the app profile UUID, but remove only that obsolete FK.
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
    EXECUTE format(
      'ALTER TABLE public.profiles DROP CONSTRAINT %I',
      v_constraint.conname
    );
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
    (SELECT p.id FROM public.profiles p WHERE p.clerk_user_id = public.current_auth_subject() LIMIT 1)
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
        name = COALESCE(NULLIF(p_name, ''), name),
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
  VALUES (gen_random_uuid(), p_clerk_user_id, v_email, COALESCE(NULLIF(trim(p_name), ''), split_part(v_email, '@', 1)), v_role, NOW(), NOW())
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

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_app_profile_id() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.role NOT IN ('user', 'parent', 'student') THEN
    RAISE EXCEPTION 'Not authorized to create privileged profile role';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Not authorized to change profile role';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.force_product_pending_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_role() = 'publisher' AND NOT public.has_role(ARRAY['super_admin', 'general_supervisor', 'enha_lak_supervisor']) THEN
    NEW.approval_status := 'pending';
    NEW.is_active := FALSE;
    NEW.publisher_id := public.current_app_profile_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop old and replacement policies by stable names.
DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self_safe_role ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_delete ON public.profiles;
CREATE POLICY profiles_select_own_or_admin ON public.profiles FOR SELECT USING (id = public.current_app_profile_id() OR public.is_admin());
CREATE POLICY profiles_insert_self_safe_role ON public.profiles FOR INSERT WITH CHECK (id = public.current_app_profile_id() AND role IN ('user', 'parent', 'student'));
CREATE POLICY profiles_update_self_or_admin ON public.profiles FOR UPDATE USING (id = public.current_app_profile_id() OR public.is_admin()) WITH CHECK (id = public.current_app_profile_id() OR public.is_admin());
CREATE POLICY profiles_admin_delete ON public.profiles FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS child_profiles_manage_owner_or_admin ON public.child_profiles;
CREATE POLICY child_profiles_manage_owner_or_admin ON public.child_profiles FOR ALL USING (
  user_id = public.current_app_profile_id() OR student_user_id = public.current_app_profile_id() OR public.is_admin()
) WITH CHECK (user_id = public.current_app_profile_id() OR public.is_admin());

DROP POLICY IF EXISTS instructors_public_read ON public.instructors;
DROP POLICY IF EXISTS instructors_owner_or_admin_manage ON public.instructors;
CREATE POLICY instructors_public_read ON public.instructors FOR SELECT USING (deleted_at IS NULL OR public.is_admin() OR user_id = public.current_app_profile_id());
CREATE POLICY instructors_owner_or_admin_manage ON public.instructors FOR ALL USING (user_id = public.current_app_profile_id() OR public.is_admin()) WITH CHECK (user_id = public.current_app_profile_id() OR public.is_admin());

DROP POLICY IF EXISTS publisher_profiles_public_read ON public.publisher_profiles;
DROP POLICY IF EXISTS publisher_profiles_owner_or_admin_manage ON public.publisher_profiles;
CREATE POLICY publisher_profiles_public_read ON public.publisher_profiles FOR SELECT USING (TRUE);
CREATE POLICY publisher_profiles_owner_or_admin_manage ON public.publisher_profiles FOR ALL USING (user_id = public.current_app_profile_id() OR public.is_admin()) WITH CHECK (user_id = public.current_app_profile_id() OR public.is_admin());

DROP POLICY IF EXISTS products_strict_visibility ON public.personalized_products;
DROP POLICY IF EXISTS products_admin_manage ON public.personalized_products;
DROP POLICY IF EXISTS products_publishers_manage_own ON public.personalized_products;
CREATE POLICY products_strict_visibility ON public.personalized_products FOR SELECT USING (
  public.has_role(ARRAY['super_admin', 'general_supervisor', 'enha_lak_supervisor'])
  OR publisher_id = public.current_app_profile_id()
  OR (is_active = TRUE AND approval_status = 'approved' AND deleted_at IS NULL)
);
CREATE POLICY products_admin_manage ON public.personalized_products FOR ALL USING (public.has_role(ARRAY['super_admin', 'general_supervisor', 'enha_lak_supervisor'])) WITH CHECK (public.has_role(ARRAY['super_admin', 'general_supervisor', 'enha_lak_supervisor']));
CREATE POLICY products_publishers_manage_own ON public.personalized_products FOR ALL USING (publisher_id = public.current_app_profile_id() AND public.current_user_role() = 'publisher') WITH CHECK (publisher_id = public.current_app_profile_id() AND public.current_user_role() = 'publisher');

DROP POLICY IF EXISTS packages_public_read ON public.creative_writing_packages;
DROP POLICY IF EXISTS packages_admin_manage ON public.creative_writing_packages;
CREATE POLICY packages_public_read ON public.creative_writing_packages FOR SELECT USING (deleted_at IS NULL AND is_active = TRUE OR public.is_admin());
CREATE POLICY packages_admin_manage ON public.creative_writing_packages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS standalone_services_public_read ON public.standalone_services;
DROP POLICY IF EXISTS standalone_services_admin_manage ON public.standalone_services;
CREATE POLICY standalone_services_public_read ON public.standalone_services FOR SELECT USING (deleted_at IS NULL AND is_active = TRUE OR public.is_admin());
CREATE POLICY standalone_services_admin_manage ON public.standalone_services FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS subscription_plans_public_read ON public.subscription_plans;
DROP POLICY IF EXISTS subscription_plans_admin_manage ON public.subscription_plans;
CREATE POLICY subscription_plans_public_read ON public.subscription_plans FOR SELECT USING (deleted_at IS NULL AND is_active = TRUE OR public.is_admin());
CREATE POLICY subscription_plans_admin_manage ON public.subscription_plans FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS orders_related_read ON public.orders;
DROP POLICY IF EXISTS orders_user_insert ON public.orders;
DROP POLICY IF EXISTS orders_owner_update_receipt_or_admin ON public.orders;
DROP POLICY IF EXISTS orders_admin_delete ON public.orders;
CREATE POLICY orders_related_read ON public.orders FOR SELECT USING (user_id = public.current_app_profile_id() OR public.has_role(ARRAY['super_admin', 'general_supervisor', 'enha_lak_supervisor', 'creative_writing_supervisor']));
CREATE POLICY orders_user_insert ON public.orders FOR INSERT WITH CHECK (user_id = public.current_app_profile_id() OR public.is_admin());
CREATE POLICY orders_owner_update_receipt_or_admin ON public.orders FOR UPDATE USING (user_id = public.current_app_profile_id() OR public.is_admin()) WITH CHECK (user_id = public.current_app_profile_id() OR public.is_admin());
CREATE POLICY orders_admin_delete ON public.orders FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS subscriptions_related_manage ON public.subscriptions;
CREATE POLICY subscriptions_related_manage ON public.subscriptions FOR ALL USING (user_id = public.current_app_profile_id() OR public.is_admin()) WITH CHECK (user_id = public.current_app_profile_id() OR public.is_admin());

DROP POLICY IF EXISTS service_orders_related_read ON public.service_orders;
DROP POLICY IF EXISTS service_orders_owner_insert ON public.service_orders;
DROP POLICY IF EXISTS service_orders_owner_or_admin_update ON public.service_orders;
CREATE POLICY service_orders_related_read ON public.service_orders FOR SELECT USING (
  user_id = public.current_app_profile_id()
  OR public.has_role(ARRAY['super_admin', 'general_supervisor', 'creative_writing_supervisor'])
  OR EXISTS (SELECT 1 FROM public.instructors i WHERE i.id = service_orders.assigned_instructor_id AND i.user_id = public.current_app_profile_id())
);
CREATE POLICY service_orders_owner_insert ON public.service_orders FOR INSERT WITH CHECK (user_id = public.current_app_profile_id() OR public.is_admin());
CREATE POLICY service_orders_owner_or_admin_update ON public.service_orders FOR UPDATE USING (user_id = public.current_app_profile_id() OR public.is_admin()) WITH CHECK (user_id = public.current_app_profile_id() OR public.is_admin());

DROP POLICY IF EXISTS bookings_related_read ON public.bookings;
DROP POLICY IF EXISTS bookings_owner_insert ON public.bookings;
DROP POLICY IF EXISTS bookings_related_update ON public.bookings;
CREATE POLICY bookings_related_read ON public.bookings FOR SELECT USING (
  user_id = public.current_app_profile_id()
  OR public.is_admin()
  OR EXISTS (SELECT 1 FROM public.instructors i WHERE i.id = bookings.instructor_id AND i.user_id = public.current_app_profile_id())
);
CREATE POLICY bookings_owner_insert ON public.bookings FOR INSERT WITH CHECK (user_id = public.current_app_profile_id() OR public.is_admin());
CREATE POLICY bookings_related_update ON public.bookings FOR UPDATE USING (
  user_id = public.current_app_profile_id()
  OR public.is_admin()
  OR EXISTS (SELECT 1 FROM public.instructors i WHERE i.id = bookings.instructor_id AND i.user_id = public.current_app_profile_id())
) WITH CHECK (
  user_id = public.current_app_profile_id()
  OR public.is_admin()
  OR EXISTS (SELECT 1 FROM public.instructors i WHERE i.id = bookings.instructor_id AND i.user_id = public.current_app_profile_id())
);

DROP POLICY IF EXISTS scheduled_sessions_related_read ON public.scheduled_sessions;
DROP POLICY IF EXISTS scheduled_sessions_admin_or_instructor_manage ON public.scheduled_sessions;
CREATE POLICY scheduled_sessions_related_read ON public.scheduled_sessions FOR SELECT USING (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = scheduled_sessions.booking_id AND b.user_id = public.current_app_profile_id())
  OR EXISTS (SELECT 1 FROM public.instructors i WHERE i.id = scheduled_sessions.instructor_id AND i.user_id = public.current_app_profile_id())
  OR EXISTS (SELECT 1 FROM public.child_profiles c WHERE c.id = scheduled_sessions.child_id AND c.student_user_id = public.current_app_profile_id())
);
CREATE POLICY scheduled_sessions_admin_or_instructor_manage ON public.scheduled_sessions FOR ALL USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.instructors i WHERE i.id = scheduled_sessions.instructor_id AND i.user_id = public.current_app_profile_id())
) WITH CHECK (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.instructors i WHERE i.id = scheduled_sessions.instructor_id AND i.user_id = public.current_app_profile_id())
);

DROP POLICY IF EXISTS session_messages_related_read ON public.session_messages;
DROP POLICY IF EXISTS session_messages_sender_insert ON public.session_messages;
CREATE POLICY session_messages_related_read ON public.session_messages FOR SELECT USING (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = session_messages.booking_id AND b.user_id = public.current_app_profile_id())
  OR EXISTS (SELECT 1 FROM public.bookings b JOIN public.instructors i ON i.id = b.instructor_id WHERE b.id = session_messages.booking_id AND i.user_id = public.current_app_profile_id())
);
CREATE POLICY session_messages_sender_insert ON public.session_messages FOR INSERT WITH CHECK (sender_id = public.current_app_profile_id());

DROP POLICY IF EXISTS session_attachments_related_read ON public.session_attachments;
DROP POLICY IF EXISTS session_attachments_uploader_insert ON public.session_attachments;
CREATE POLICY session_attachments_related_read ON public.session_attachments FOR SELECT USING (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = session_attachments.booking_id AND b.user_id = public.current_app_profile_id())
  OR EXISTS (SELECT 1 FROM public.bookings b JOIN public.instructors i ON i.id = b.instructor_id WHERE b.id = session_attachments.booking_id AND i.user_id = public.current_app_profile_id())
);
CREATE POLICY session_attachments_uploader_insert ON public.session_attachments FOR INSERT WITH CHECK (uploader_id = public.current_app_profile_id());

DROP POLICY IF EXISTS badges_public_read ON public.badges;
DROP POLICY IF EXISTS badges_admin_manage ON public.badges;
CREATE POLICY badges_public_read ON public.badges FOR SELECT USING (TRUE);
CREATE POLICY badges_admin_manage ON public.badges FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS child_badges_related_read ON public.child_badges;
DROP POLICY IF EXISTS child_badges_admin_or_instructor_insert ON public.child_badges;
CREATE POLICY child_badges_related_read ON public.child_badges FOR SELECT USING (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.child_profiles c WHERE c.id = child_badges.child_id AND (c.user_id = public.current_app_profile_id() OR c.student_user_id = public.current_app_profile_id()))
);
CREATE POLICY child_badges_admin_or_instructor_insert ON public.child_badges FOR INSERT WITH CHECK (public.is_admin() OR public.current_user_role() = 'instructor');

DROP POLICY IF EXISTS blog_posts_public_read_published ON public.blog_posts;
DROP POLICY IF EXISTS blog_posts_editor_manage ON public.blog_posts;
CREATE POLICY blog_posts_public_read_published ON public.blog_posts FOR SELECT USING ((status = 'published' AND deleted_at IS NULL) OR public.has_role(ARRAY['super_admin', 'general_supervisor', 'content_editor']));
CREATE POLICY blog_posts_editor_manage ON public.blog_posts FOR ALL USING (public.has_role(ARRAY['super_admin', 'general_supervisor', 'content_editor'])) WITH CHECK (public.has_role(ARRAY['super_admin', 'general_supervisor', 'content_editor']));

DROP POLICY IF EXISTS support_tickets_public_insert ON public.support_tickets;
DROP POLICY IF EXISTS support_tickets_staff_manage ON public.support_tickets;
CREATE POLICY support_tickets_public_insert ON public.support_tickets FOR INSERT WITH CHECK (TRUE);
CREATE POLICY support_tickets_staff_manage ON public.support_tickets FOR ALL USING (public.has_role(ARRAY['super_admin', 'general_supervisor', 'support_agent'])) WITH CHECK (public.has_role(ARRAY['super_admin', 'general_supervisor', 'support_agent']));

DROP POLICY IF EXISTS join_requests_public_insert ON public.join_requests;
DROP POLICY IF EXISTS join_requests_staff_manage ON public.join_requests;
CREATE POLICY join_requests_public_insert ON public.join_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY join_requests_staff_manage ON public.join_requests FOR ALL USING (public.has_role(ARRAY['super_admin', 'general_supervisor', 'support_agent'])) WITH CHECK (public.has_role(ARRAY['super_admin', 'general_supervisor', 'support_agent']));

DROP POLICY IF EXISTS support_session_requests_related_manage ON public.support_session_requests;
CREATE POLICY support_session_requests_related_manage ON public.support_session_requests FOR ALL USING (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.instructors i WHERE i.id = support_session_requests.instructor_id AND i.user_id = public.current_app_profile_id())
) WITH CHECK (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.instructors i WHERE i.id = support_session_requests.instructor_id AND i.user_id = public.current_app_profile_id())
);

DROP POLICY IF EXISTS notifications_owner_read_update_delete ON public.notifications;
DROP POLICY IF EXISTS notifications_authenticated_insert ON public.notifications;
CREATE POLICY notifications_owner_read_update_delete ON public.notifications FOR SELECT USING (user_id = public.current_app_profile_id());
CREATE POLICY notifications_authenticated_insert ON public.notifications FOR INSERT WITH CHECK (public.current_app_profile_id() IS NOT NULL);
DROP POLICY IF EXISTS notifications_owner_update ON public.notifications;
CREATE POLICY notifications_owner_update ON public.notifications FOR UPDATE USING (user_id = public.current_app_profile_id()) WITH CHECK (user_id = public.current_app_profile_id());
DROP POLICY IF EXISTS notifications_owner_delete ON public.notifications;
CREATE POLICY notifications_owner_delete ON public.notifications FOR DELETE USING (user_id = public.current_app_profile_id());

DROP POLICY IF EXISTS site_settings_admin_select ON public.site_settings;
DROP POLICY IF EXISTS site_settings_admin_manage ON public.site_settings;
CREATE POLICY site_settings_admin_select ON public.site_settings FOR SELECT USING (public.is_admin());
CREATE POLICY site_settings_admin_manage ON public.site_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
-- Grant table-level access (RLS policies above enforce admin-only restriction)
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

DROP POLICY IF EXISTS site_content_public_read ON public.site_content;
DROP POLICY IF EXISTS site_content_admin_manage ON public.site_content;
CREATE POLICY site_content_public_read ON public.site_content FOR SELECT USING (TRUE);
CREATE POLICY site_content_admin_manage ON public.site_content FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS audit_logs_admin_read ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_authenticated_insert_own ON public.audit_logs;
CREATE POLICY audit_logs_admin_read ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY audit_logs_authenticated_insert_own ON public.audit_logs FOR INSERT WITH CHECK (public.current_app_profile_id() IS NOT NULL AND (user_id IS NULL OR user_id = public.current_app_profile_id()));

DROP POLICY IF EXISTS instructor_payouts_admin_manage ON public.instructor_payouts;
DROP POLICY IF EXISTS instructor_payouts_instructor_read_own ON public.instructor_payouts;
CREATE POLICY instructor_payouts_admin_manage ON public.instructor_payouts FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY instructor_payouts_instructor_read_own ON public.instructor_payouts FOR SELECT USING (EXISTS (SELECT 1 FROM public.instructors i WHERE i.id = instructor_payouts.instructor_id AND i.user_id = public.current_app_profile_id()));

DROP POLICY IF EXISTS publisher_payouts_admin_manage ON public.publisher_payouts;
DROP POLICY IF EXISTS publisher_payouts_publisher_read_own ON public.publisher_payouts;
CREATE POLICY publisher_payouts_admin_manage ON public.publisher_payouts FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY publisher_payouts_publisher_read_own ON public.publisher_payouts FOR SELECT USING (publisher_id = public.current_app_profile_id());

DROP POLICY IF EXISTS comparison_items_public_read ON public.comparison_items;
DROP POLICY IF EXISTS comparison_items_admin_manage ON public.comparison_items;
CREATE POLICY comparison_items_public_read ON public.comparison_items FOR SELECT USING (TRUE);
CREATE POLICY comparison_items_admin_manage ON public.comparison_items FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());




-- ---------------------------------------------------------
-- Storage and RPC overrides for Clerk app-profile UUIDs
-- ---------------------------------------------------------
DROP POLICY IF EXISTS receipts_authenticated_upload_limited ON storage.objects;
DROP POLICY IF EXISTS receipts_related_read ON storage.objects;
DROP POLICY IF EXISTS receipts_owner_delete ON storage.objects;
CREATE POLICY receipts_authenticated_upload_limited ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = public.current_app_profile_id()::text
);
CREATE POLICY receipts_related_read ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts'
  AND (
    (storage.foldername(name))[1] = public.current_app_profile_id()::text
    OR public.has_role(ARRAY[
      'super_admin',
      'general_supervisor',
      'enha_lak_supervisor',
      'creative_writing_supervisor',
      'support_agent'
    ])
  )
);
CREATE POLICY receipts_owner_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'receipts'
  AND (
    (storage.foldername(name))[1] = public.current_app_profile_id()::text
    OR public.is_admin()
  )
);

CREATE OR REPLACE FUNCTION public.create_order_secure(
  p_user_id UUID,
  p_child_id BIGINT,
  p_cart_items JSONB,
  p_receipt_url TEXT,
  p_shipping_address JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id TEXT;
  v_service_order_id TEXT;
  v_total NUMERIC(10, 2) := 0;
  v_shipping_cost NUMERIC(10, 2) := 0;
  v_item JSONB;
  v_price NUMERIC(10, 2) := 0;
  v_summary TEXT := '';
  v_details JSONB := '{}'::jsonb;
  v_shipping_config JSONB;
  v_gov TEXT;
  v_product_key TEXT;
  v_service_id BIGINT;
  v_assigned_instructor_id BIGINT;
  v_plan_price NUMERIC(10, 2);
  v_plan_duration INTEGER;
  v_subscription_id UUID;
  v_order JSONB;
BEGIN
  IF public.current_app_profile_id() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id <> public.current_app_profile_id() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to create order for another user';
  END IF;

  IF p_child_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.child_profiles c WHERE c.id = p_child_id AND (c.user_id = p_user_id OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'Child profile does not belong to user';
  END IF;

  v_gov := COALESCE(p_shipping_address->>'governorate', p_shipping_address->>'city');
  SELECT value INTO v_shipping_config FROM public.site_settings WHERE key = 'shipping_costs';

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_cart_items, '[]'::jsonb)) LOOP
    v_product_key := COALESCE(v_item->>'productKey', v_item->'details'->>'productKey');
    IF v_summary <> '' THEN
      v_summary := v_summary || ', ';
    END IF;
    v_summary := v_summary || COALESCE(v_item->>'summary', v_product_key, v_item->>'planName', 'طلب');

    IF v_item->>'type' = 'subscription' THEN
      SELECT price, duration_months INTO v_plan_price, v_plan_duration
      FROM public.subscription_plans
      WHERE name = COALESCE(v_item->>'planName', v_item->'details'->>'planName')
        AND deleted_at IS NULL;

      IF v_plan_price IS NULL THEN
        RAISE EXCEPTION 'Subscription plan not found';
      END IF;

      v_total := v_total + v_plan_price;
      v_subscription_id := COALESCE(NULLIF(v_item->'details'->>'subscriptionId', '')::uuid, gen_random_uuid());

      INSERT INTO public.subscriptions (id, user_id, child_id, plan_name, status, start_date, end_date, next_renewal_date)
      VALUES (
        v_subscription_id,
        p_user_id,
        p_child_id,
        COALESCE(v_item->>'planName', v_item->'details'->>'planName'),
        'pending_payment',
        NOW(),
        NOW() + make_interval(months => COALESCE(v_plan_duration, 1)),
        NOW() + INTERVAL '1 month'
      )
      ON CONFLICT (id) DO UPDATE SET status = 'pending_payment', updated_at = NOW();

      v_details := v_details || jsonb_build_object('subscriptionId', v_subscription_id);
    ELSE
      v_service_id := NULLIF(v_item->'details'->>'serviceId', '')::bigint;
      IF v_service_id IS NOT NULL OR v_product_key LIKE 'service_%' THEN
        SELECT price INTO v_price FROM public.standalone_services WHERE id = v_service_id AND deleted_at IS NULL;
        IF v_price IS NULL THEN
          RAISE EXCEPTION 'Standalone service not found';
        END IF;

        v_total := v_total + v_price;
        v_assigned_instructor_id := NULLIF(v_item->'details'->>'assigned_instructor_id', '')::bigint;
        v_service_order_id := 'SVC-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
        INSERT INTO public.service_orders (id, user_id, child_id, service_id, assigned_instructor_id, total, status, details)
        VALUES (
          v_service_order_id,
          p_user_id,
          p_child_id,
          v_service_id,
          v_assigned_instructor_id,
          v_price,
          CASE WHEN COALESCE(p_receipt_url, '') <> '' THEN 'بانتظار المراجعة' ELSE 'بانتظار الدفع' END,
          COALESCE(v_item->'details', '{}'::jsonb)
        );
      ELSE
        SELECT CASE WHEN COALESCE(v_item->'details'->>'format', '') = 'printed' THEN price_printed ELSE price_electronic END
        INTO v_price
        FROM public.personalized_products
        WHERE key = v_product_key
          AND deleted_at IS NULL
          AND is_active = TRUE
          AND approval_status = 'approved';

        IF v_price IS NULL THEN
          RAISE EXCEPTION 'Personalized product not found or inactive';
        END IF;

        v_total := v_total + v_price;

        IF COALESCE(v_item->'details'->>'format', '') = 'printed' AND v_gov IS NOT NULL THEN
          v_shipping_cost := v_shipping_cost + COALESCE(
            NULLIF(v_shipping_config->>'default', '')::numeric,
            NULLIF(v_shipping_config->>'باقي المحافظات', '')::numeric,
            0
          );
        END IF;
      END IF;
    END IF;
  END LOOP;

  IF v_summary = '' THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  v_order_id := 'ORD-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

  INSERT INTO public.orders (id, user_id, child_id, item_summary, total, shipping_cost, status, details, receipt_url, order_date)
  VALUES (
    v_order_id,
    p_user_id,
    p_child_id,
    v_summary,
    v_total + v_shipping_cost,
    v_shipping_cost,
    CASE WHEN COALESCE(p_receipt_url, '') <> '' THEN 'بانتظار المراجعة' ELSE 'بانتظار الدفع' END,
    jsonb_build_object('cartItems', p_cart_items, 'shippingAddress', COALESCE(p_shipping_address, '{}'::jsonb)) || v_details,
    NULLIF(p_receipt_url, ''),
    NOW()
  )
  RETURNING jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'child_id', child_id,
    'item_summary', item_summary,
    'total', total,
    'shipping_cost', shipping_cost,
    'status', status,
    'details', details,
    'receipt_url', receipt_url,
    'order_date', order_date
  ) INTO v_order;

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_booking_secure(
  p_user_id UUID,
  p_child_id BIGINT,
  p_instructor_id BIGINT,
  p_package_name TEXT,
  p_booking_date DATE,
  p_booking_time TEXT,
  p_receipt_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id TEXT;
  v_price NUMERIC(10, 2) := 0;
  v_status TEXT;
  v_booking JSONB;
BEGIN
  IF public.current_app_profile_id() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id <> public.current_app_profile_id() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to create booking for another user';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.child_profiles c WHERE c.id = p_child_id AND (c.user_id = p_user_id OR public.is_admin())) THEN
    RAISE EXCEPTION 'Child profile does not belong to user';
  END IF;

  IF p_package_name = 'الجلسة التعريفية' THEN
    v_price := 0;
  ELSE
    SELECT price INTO v_price
    FROM public.creative_writing_packages
    WHERE name = p_package_name AND deleted_at IS NULL AND is_active = TRUE;

    IF v_price IS NULL THEN
      RAISE EXCEPTION 'Creative writing package not found';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE instructor_id = p_instructor_id
      AND booking_date = p_booking_date
      AND booking_time = p_booking_time
      AND status <> 'ملغي'
  ) THEN
    RAISE EXCEPTION 'هذا الموعد محجوز بالفعل مع هذا المدرب.';
  END IF;

  v_status := CASE WHEN v_price = 0 THEN 'مؤكد' WHEN COALESCE(p_receipt_url, '') <> '' THEN 'بانتظار المراجعة' ELSE 'بانتظار الدفع' END;
  v_booking_id := 'BKG-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

  INSERT INTO public.bookings (id, user_id, child_id, instructor_id, package_name, booking_date, booking_time, total, status, receipt_url)
  VALUES (v_booking_id, p_user_id, p_child_id, p_instructor_id, p_package_name, p_booking_date, p_booking_time, v_price, v_status, NULLIF(p_receipt_url, ''))
  RETURNING jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'child_id', child_id,
    'instructor_id', instructor_id,
    'package_name', package_name,
    'booking_date', booking_date,
    'booking_time', booking_time,
    'total', total,
    'status', status,
    'receipt_url', receipt_url,
    'created_at', created_at
  ) INTO v_booking;

  RETURN v_booking;
END;
$$;

-- Compatibility stub: password resets must use Supabase Admin API in a server/Edge function.

NOTIFY pgrst, 'reload schema';
