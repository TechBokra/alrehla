-- Phase 2A.1: reconcile the deployed Subscription contract with the
-- repository contract. This migration deliberately stops at receipt review;
-- it does not introduce Subscription approval or activation.

BEGIN;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id BIGINT,
  ADD COLUMN IF NOT EXISTS total NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS receipt_url TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint AS constraint_row
    WHERE constraint_row.conrelid = 'public.subscriptions'::regclass
      AND constraint_row.contype = 'f'
      AND constraint_row.confrelid = 'public.subscription_plans'::regclass
      AND pg_catalog.pg_get_constraintdef(constraint_row.oid) ILIKE '%plan_id%'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_plan_id_fkey
      FOREIGN KEY (plan_id)
      REFERENCES public.subscription_plans(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

-- Older deployments used a narrower status check. Drop only checks that
-- govern Subscription status, then install the canonical five-value contract.
DO $$
DECLARE
  status_constraint RECORD;
  status_definition TEXT;
BEGIN
  FOR status_constraint IN
    SELECT constraint_row.oid, constraint_row.conname
    FROM pg_catalog.pg_constraint AS constraint_row
    WHERE constraint_row.conrelid = 'public.subscriptions'::regclass
      AND constraint_row.contype = 'c'
  LOOP
    status_definition := pg_catalog.pg_get_constraintdef(status_constraint.oid);
    IF status_definition ILIKE '%status%'
       AND (
         status_definition ILIKE '%pending_payment%'
         OR status_definition ILIKE '%pending_review%'
         OR status_definition ILIKE '%cancelled%'
       ) THEN
      EXECUTE pg_catalog.format(
        'ALTER TABLE public.subscriptions DROP CONSTRAINT %I',
        status_constraint.conname
      );
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('pending_payment', 'pending_review', 'active', 'paused', 'cancelled'));

-- Keep both existing creation entrypoints compatible for now. Their future
-- consolidation is a Phase 2C decision; this repair does not add another path.
-- The live database previously exposed the same typed signature with a
-- p_new_status parameter. PostgreSQL cannot rename an input parameter through
-- CREATE OR REPLACE, so replace the function object in the same transaction.
DROP FUNCTION IF EXISTS public.update_subscription_status_secure(UUID, TEXT);

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
SET search_path = ''
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
  v_addon_key TEXT;
  v_service_id BIGINT;
  v_assigned_instructor_id BIGINT;
  v_plan_id BIGINT;
  v_plan_price NUMERIC(10, 2);
  v_plan_duration INTEGER;
  v_subscription_id UUID;
  v_order JSONB;
BEGIN
  IF public.current_app_profile_id() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id <> public.current_app_profile_id()
     AND NOT public.is_admin()
     AND NOT EXISTS (
       SELECT 1
       FROM public.child_profiles AS c
       WHERE c.id = p_child_id
         AND c.user_id = p_user_id
         AND c.student_user_id = public.current_app_profile_id()
     ) THEN
    RAISE EXCEPTION 'Not authorized to create order for another user';
  END IF;

  IF p_child_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.child_profiles AS c
    WHERE c.id = p_child_id
      AND (c.user_id = p_user_id OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'Child profile does not belong to user';
  END IF;

  v_gov := COALESCE(p_shipping_address->>'governorate', p_shipping_address->>'city');
  SELECT value INTO v_shipping_config
  FROM public.site_settings
  WHERE key = 'shipping_costs';

  FOR v_item IN
    SELECT * FROM jsonb_array_elements(COALESCE(p_cart_items, '[]'::jsonb))
  LOOP
    v_product_key := COALESCE(v_item->>'productKey', v_item->'details'->>'productKey');
    IF v_summary <> '' THEN
      v_summary := v_summary || ', ';
    END IF;
    v_summary := v_summary || COALESCE(v_item->>'summary', v_product_key, v_item->>'planName', 'طلب');

    IF v_item->>'type' = 'subscription' THEN
      SELECT id, price, duration_months
      INTO v_plan_id, v_plan_price, v_plan_duration
      FROM public.subscription_plans
      WHERE name = COALESCE(v_item->>'planName', v_item->'details'->>'planName')
        AND is_active = TRUE
        AND deleted_at IS NULL;

      IF v_plan_price IS NULL THEN
        RAISE EXCEPTION 'Subscription plan not found';
      END IF;

      v_total := v_total + v_plan_price;

      FOR v_addon_key IN
        SELECT jsonb_array_elements_text(
          CASE
            WHEN jsonb_typeof(v_item->'details'->'addons') = 'array'
              THEN v_item->'details'->'addons'
            ELSE '[]'::jsonb
          END
        )
      LOOP
        SELECT CASE
                 WHEN COALESCE(v_item->'details'->>'format',
                               CASE WHEN v_item->'details'->>'deliveryType' = 'electronic'
                                    THEN 'electronic' ELSE 'printed' END) = 'electronic'
                   THEN price_electronic
                 ELSE price_printed
               END
        INTO v_price
        FROM public.personalized_products
        WHERE key = v_addon_key
          AND is_addon = TRUE
          AND deleted_at IS NULL
          AND is_active = TRUE
          AND approval_status = 'approved';

        IF v_price IS NULL THEN
          RAISE EXCEPTION 'Personalized add-on not found or inactive';
        END IF;
        v_total := v_total + v_price;
      END LOOP;

      v_subscription_id := COALESCE(
        NULLIF(v_item->'details'->>'subscriptionId', '')::uuid,
        public.gen_random_uuid()
      );

      INSERT INTO public.subscriptions (
        id, user_id, child_id, plan_id, plan_name, status, total,
        start_date, end_date, next_renewal_date
      )
      VALUES (
        v_subscription_id,
        p_user_id,
        p_child_id,
        v_plan_id,
        COALESCE(v_item->>'planName', v_item->'details'->>'planName'),
        'pending_payment',
        v_plan_price,
        NOW(),
        NOW() + make_interval(months => COALESCE(v_plan_duration, 1)),
        NOW() + INTERVAL '1 month'
      )
      ON CONFLICT (id) DO UPDATE
      SET plan_id = EXCLUDED.plan_id,
          plan_name = EXCLUDED.plan_name,
          status = 'pending_payment',
          total = EXCLUDED.total,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          next_renewal_date = EXCLUDED.next_renewal_date,
          updated_at = NOW();

      v_details := v_details || jsonb_build_object('subscriptionId', v_subscription_id);
    ELSE
      v_service_id := NULLIF(v_item->'details'->>'serviceId', '')::bigint;
      IF v_service_id IS NOT NULL OR v_product_key LIKE 'service_%' THEN
        v_assigned_instructor_id := NULLIF(v_item->'details'->>'assigned_instructor_id', '')::bigint;
        SELECT COALESCE((i.service_rates ->> v_service_id::text)::numeric, s.price)
        INTO v_price
        FROM public.standalone_services AS s
        LEFT JOIN public.instructors AS i
          ON i.id = v_assigned_instructor_id
         AND i.deleted_at IS NULL
        WHERE s.id = v_service_id
          AND s.deleted_at IS NULL
          AND s.is_active = TRUE;
        IF v_price IS NULL THEN
          RAISE EXCEPTION 'Standalone service not found';
        END IF;

        v_total := v_total + v_price;
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
        SELECT CASE
                 WHEN COALESCE(v_item->'details'->>'format',
                               CASE WHEN v_item->'details'->>'deliveryType' = 'printed'
                                          OR v_item->'details'->>'isPrinted' = 'true'
                                    THEN 'printed' ELSE 'electronic' END) = 'printed'
                   THEN price_printed
                 ELSE price_electronic
               END
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

        IF COALESCE(v_item->'details'->>'format',
                    CASE WHEN v_item->'details'->>'deliveryType' = 'printed'
                               OR v_item->'details'->>'isPrinted' = 'true'
                         THEN 'printed' ELSE 'electronic' END) = 'printed' AND v_gov IS NOT NULL THEN
          v_shipping_cost := v_shipping_cost + COALESCE(
            NULLIF(v_shipping_config->'مصر'->>v_gov, '')::numeric,
            NULLIF(v_shipping_config->'مصر'->>'باقي المحافظات', '')::numeric,
            NULLIF(v_shipping_config->>v_gov, '')::numeric,
            NULLIF(v_shipping_config->>'default', '')::numeric,
            NULLIF(v_shipping_config->>'باقي المحافظات', '')::numeric,
            0
          );
        END IF;

        FOR v_addon_key IN
          SELECT jsonb_array_elements_text(
            CASE
              WHEN jsonb_typeof(v_item->'details'->'addons') = 'array'
                THEN v_item->'details'->'addons'
              ELSE '[]'::jsonb
            END
          )
        LOOP
          SELECT CASE
                   WHEN COALESCE(v_item->'details'->>'format',
                                 CASE WHEN v_item->'details'->>'deliveryType' = 'printed'
                                            OR v_item->'details'->>'isPrinted' = 'true'
                                      THEN 'printed' ELSE 'electronic' END) = 'printed'
                     THEN price_printed
                   ELSE price_electronic
                 END
          INTO v_price
          FROM public.personalized_products
          WHERE key = v_addon_key
            AND is_addon = TRUE
            AND deleted_at IS NULL
            AND is_active = TRUE
            AND approval_status = 'approved';

          IF v_price IS NULL THEN
            RAISE EXCEPTION 'Personalized add-on not found or inactive';
          END IF;
          v_total := v_total + v_price;
        END LOOP;
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

CREATE OR REPLACE FUNCTION public.create_subscription_secure(
  p_user_id UUID,
  p_child_id BIGINT,
  p_plan_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_plan public.subscription_plans;
  v_subscription public.subscriptions;
BEGIN
  IF public.current_app_profile_id() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id <> public.current_app_profile_id()
     AND NOT public.is_admin()
     AND NOT EXISTS (
       SELECT 1
       FROM public.child_profiles AS c
       WHERE c.id = p_child_id
         AND c.user_id = p_user_id
         AND c.student_user_id = public.current_app_profile_id()
     ) THEN
    RAISE EXCEPTION 'Not authorized to create subscription for another user';
  END IF;

  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE name = trim(p_plan_name)
    AND is_active = TRUE
    AND deleted_at IS NULL
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription plan not found or inactive';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.child_profiles AS c
    WHERE c.id = p_child_id
      AND (c.user_id = p_user_id OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'Child profile does not belong to user';
  END IF;

  INSERT INTO public.subscriptions (
    user_id, child_id, plan_id, plan_name, status, total,
    start_date, end_date, next_renewal_date
  )
  VALUES (
    p_user_id,
    p_child_id,
    v_plan.id,
    v_plan.name,
    'pending_payment',
    v_plan.price,
    NOW(),
    NOW() + make_interval(months => v_plan.duration_months),
    NOW() + INTERVAL '1 month'
  )
  RETURNING * INTO v_subscription;

  RETURN jsonb_build_object(
    'id', v_subscription.id,
    'user_id', v_subscription.user_id,
    'child_id', v_subscription.child_id,
    'plan_id', v_subscription.plan_id,
    'plan_name', v_subscription.plan_name,
    'status', v_subscription.status,
    'total', v_subscription.total,
    'start_date', v_subscription.start_date,
    'end_date', v_subscription.end_date,
    'next_renewal_date', v_subscription.next_renewal_date,
    'receipt_url', v_subscription.receipt_url
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_subscription_status_secure(
  p_subscription_id UUID,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_subscription public.subscriptions;
  v_next_status TEXT;
BEGIN
  IF public.current_app_profile_id() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND OR (
    NOT public.is_admin()
    AND v_subscription.user_id <> public.current_app_profile_id()
  ) THEN
    RAISE EXCEPTION 'Subscription not found or not owned by current user';
  END IF;

  v_next_status := CASE p_action
    WHEN 'pause' THEN 'paused'
    WHEN 'reactivate' THEN 'active'
    WHEN 'cancel' THEN 'cancelled'
    ELSE NULL
  END;

  IF v_next_status IS NULL THEN
    RAISE EXCEPTION 'Invalid subscription action';
  END IF;

  IF NOT public.is_admin() AND NOT (
    (p_action = 'pause' AND v_subscription.status = 'active')
    OR (p_action = 'reactivate' AND v_subscription.status = 'paused')
    OR (p_action = 'cancel' AND v_subscription.status IN ('active', 'paused', 'pending_payment', 'pending_review'))
  ) THEN
    RAISE EXCEPTION 'Invalid subscription state transition';
  END IF;

  UPDATE public.subscriptions
  SET status = v_next_status,
      updated_at = NOW()
  WHERE id = p_subscription_id
  RETURNING * INTO v_subscription;

  RETURN jsonb_build_object(
    'id', v_subscription.id,
    'user_id', v_subscription.user_id,
    'plan_id', v_subscription.plan_id,
    'plan_name', v_subscription.plan_name,
    'status', v_subscription.status,
    'total', v_subscription.total,
    'receipt_url', v_subscription.receipt_url
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_subscription_receipt(
  p_subscription_id UUID,
  p_receipt_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_subscription public.subscriptions;
  v_receipt TEXT := NULLIF(trim(p_receipt_url), '');
BEGIN
  IF public.current_app_profile_id() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_receipt IS NULL OR length(v_receipt) > 5000 THEN
    RAISE EXCEPTION 'Invalid receipt URL';
  END IF;

  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND OR (
    NOT public.is_admin()
    AND v_subscription.user_id <> public.current_app_profile_id()
  ) THEN
    RAISE EXCEPTION 'Subscription not found or not owned by current user';
  END IF;

  UPDATE public.subscriptions
  SET receipt_url = v_receipt,
      status = CASE WHEN status = 'cancelled' THEN status ELSE 'pending_review' END,
      updated_at = NOW()
  WHERE id = p_subscription_id
  RETURNING * INTO v_subscription;

  RETURN jsonb_build_object(
    'id', v_subscription.id,
    'user_id', v_subscription.user_id,
    'plan_id', v_subscription.plan_id,
    'plan_name', v_subscription.plan_name,
    'status', v_subscription.status,
    'total', v_subscription.total,
    'receipt_url', v_subscription.receipt_url
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order_secure(UUID, BIGINT, JSONB, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_order_secure(UUID, BIGINT, JSONB, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_order_secure(UUID, BIGINT, JSONB, TEXT, JSONB) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_subscription_secure(UUID, BIGINT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_subscription_secure(UUID, BIGINT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_subscription_secure(UUID, BIGINT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_subscription_status_secure(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_subscription_status_secure(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_subscription_status_secure(UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_subscription_receipt(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_subscription_receipt(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_subscription_receipt(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
