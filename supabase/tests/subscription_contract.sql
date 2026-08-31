-- Phase 2A.1 Subscription contract checks.
-- Run after 202608310001_subscription_contract_repair.sql.
-- This test deliberately stops at receipt review. It does not approve or
-- activate a Subscription and never verifies pending_review -> active.

BEGIN;

DO $$
DECLARE
  v_status_definition TEXT;
  v_function_definition TEXT;
  v_function_oid OID;
BEGIN
  IF to_regclass('public.subscriptions') IS NULL THEN
    RAISE EXCEPTION 'subscriptions table is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'plan_id'
      AND data_type = 'bigint'
  ) THEN
    RAISE EXCEPTION 'subscriptions.plan_id contract is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'total'
      AND data_type = 'numeric'
  ) THEN
    RAISE EXCEPTION 'subscriptions.total contract is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'receipt_url'
      AND data_type = 'text'
  ) THEN
    RAISE EXCEPTION 'subscriptions.receipt_url contract is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'assigned_instructor_id'
  ) THEN
    RAISE EXCEPTION 'assigned_instructor_id must remain on service_orders, not subscriptions';
  END IF;

  SELECT pg_catalog.pg_get_constraintdef(constraint_row.oid)
  INTO v_status_definition
  FROM pg_catalog.pg_constraint AS constraint_row
  WHERE constraint_row.conrelid = 'public.subscriptions'::regclass
    AND constraint_row.conname = 'subscriptions_status_check';

  IF v_status_definition IS NULL
     OR v_status_definition NOT LIKE '%pending_payment%'
     OR v_status_definition NOT LIKE '%pending_review%'
     OR v_status_definition NOT LIKE '%active%'
     OR v_status_definition NOT LIKE '%paused%'
     OR v_status_definition NOT LIKE '%cancelled%' THEN
    RAISE EXCEPTION 'Subscription status constraint does not expose the five approved database values';
  END IF;

  IF to_regprocedure('public.create_subscription_secure(uuid,bigint,text)') IS NULL THEN
    RAISE EXCEPTION 'create_subscription_secure signature is missing';
  END IF;
  IF to_regprocedure('public.update_subscription_status_secure(uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'update_subscription_status_secure signature is missing';
  END IF;
  IF to_regprocedure('public.submit_subscription_receipt(uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'submit_subscription_receipt signature is missing';
  END IF;
  IF to_regprocedure('public.create_order_secure(uuid,bigint,jsonb,text,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'canonical create_order_secure signature is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS procedure_row
    JOIN pg_catalog.pg_namespace AS namespace_row
      ON namespace_row.oid = procedure_row.pronamespace
    WHERE namespace_row.nspname = 'public'
      AND procedure_row.proname = 'approve_subscription_secure'
  ) THEN
    RAISE EXCEPTION 'Phase 2A.1 must not introduce a Subscription approval RPC';
  END IF;

  FOREACH v_function_oid IN ARRAY ARRAY[
    'public.create_subscription_secure(uuid,bigint,text)'::regprocedure,
    'public.update_subscription_status_secure(uuid,text)'::regprocedure,
    'public.submit_subscription_receipt(uuid,text)'::regprocedure,
    'public.create_order_secure(uuid,bigint,jsonb,text,jsonb)'::regprocedure
  ] LOOP
    SELECT pg_catalog.pg_get_functiondef(v_function_oid)
    INTO v_function_definition;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc AS procedure_row
      WHERE procedure_row.oid = v_function_oid
        AND procedure_row.prosecdef
    ) THEN
      RAISE EXCEPTION 'repaired Subscription-related RPC % is not SECURITY DEFINER', v_function_oid;
    END IF;

    IF strpos(v_function_definition, 'search_path = ' || chr(39) || chr(39)) = 0 THEN
      RAISE EXCEPTION 'repaired RPC % does not use an explicitly empty search_path', v_function_oid;
    END IF;

    IF v_function_definition LIKE '%COMMIT%'
       OR v_function_definition LIKE '%ROLLBACK%' THEN
      RAISE EXCEPTION 'repaired RPC % contains transaction control and is not transaction-scoped', v_function_oid;
    END IF;
  END LOOP;

  SELECT pg_catalog.pg_get_functiondef(
    'public.update_subscription_status_secure(uuid,text)'::regprocedure
  )
  INTO v_function_definition;
  IF v_function_definition NOT LIKE '%p_action%'
     OR v_function_definition LIKE '%p_new_status%' THEN
    RAISE EXCEPTION 'update_subscription_status_secure does not use the canonical p_action contract';
  END IF;

  FOREACH v_function_oid IN ARRAY ARRAY[
    'public.create_subscription_secure(uuid,bigint,text)'::regprocedure,
    'public.update_subscription_status_secure(uuid,text)'::regprocedure,
    'public.submit_subscription_receipt(uuid,text)'::regprocedure
  ] LOOP
    IF pg_catalog.pg_get_function_result(v_function_oid) <> 'jsonb' THEN
      RAISE EXCEPTION 'Subscription RPC % does not return the canonical JSONB result contract', v_function_oid;
    END IF;
  END LOOP;

  SELECT pg_catalog.pg_get_functiondef(
    'public.create_subscription_secure(uuid,bigint,text)'::regprocedure
  )
  INTO v_function_definition;
  IF strpos(v_function_definition, '''plan_id''') = 0
     OR strpos(v_function_definition, '''total''') = 0
     OR strpos(v_function_definition, '''status''') = 0
     OR strpos(v_function_definition, '''receipt_url''') = 0 THEN
    RAISE EXCEPTION 'create_subscription_secure result is missing a required Subscription field';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(
    'public.update_subscription_status_secure(uuid,text)'::regprocedure
  )
  INTO v_function_definition;
  IF strpos(v_function_definition, '''plan_id''') = 0
     OR strpos(v_function_definition, '''total''') = 0
     OR strpos(v_function_definition, '''status''') = 0
     OR strpos(v_function_definition, '''receipt_url''') = 0 THEN
    RAISE EXCEPTION 'update_subscription_status_secure result is missing a required Subscription field';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(
    'public.submit_subscription_receipt(uuid,text)'::regprocedure
  )
  INTO v_function_definition;
  IF strpos(v_function_definition, '''plan_id''') = 0
     OR strpos(v_function_definition, '''plan_name''') = 0
     OR strpos(v_function_definition, '''total''') = 0
     OR strpos(v_function_definition, '''status''') = 0
     OR strpos(v_function_definition, '''receipt_url''') = 0 THEN
    RAISE EXCEPTION 'submit_subscription_receipt result is missing a required Subscription field';
  END IF;

  FOREACH v_function_oid IN ARRAY ARRAY[
    'public.create_subscription_secure(uuid,bigint,text)'::regprocedure,
    'public.update_subscription_status_secure(uuid,text)'::regprocedure,
    'public.submit_subscription_receipt(uuid,text)'::regprocedure,
    'public.create_order_secure(uuid,bigint,jsonb,text,jsonb)'::regprocedure
  ] LOOP
    IF has_function_privilege('anon', v_function_oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'anon can execute repaired RPC %', v_function_oid;
    END IF;
    IF NOT has_function_privilege('authenticated', v_function_oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'authenticated cannot execute repaired RPC %', v_function_oid;
    END IF;
  END LOOP;

  IF v_function_definition IS NULL THEN
    RAISE EXCEPTION 'function source inspection failed';
  END IF;

END;
$$;

-- Behavioral verification is limited to the approved pre-approval lifecycle
-- and applicable existing actions. All fixtures are rolled back at the end.
INSERT INTO public.profiles (
  id, clerk_user_id, email, name, role, account_type, global_role
) VALUES (
  '20000000-0000-4000-8000-000000000001',
  'phase_2a1_parent',
  'phase-2a1-parent@example.invalid',
  'Phase 2A.1 Parent',
  'parent',
  'parent',
  NULL
);

INSERT INTO public.child_profiles (
  id, user_id, student_user_id, name, birth_date, gender
) OVERRIDING SYSTEM VALUE VALUES (
  940001,
  '20000000-0000-4000-8000-000000000001',
  NULL,
  'Phase 2A.1 Child',
  '2014-01-01',
  'ذكر'
);

INSERT INTO public.subscription_plans (
  id, name, duration_months, price, is_active, deleted_at
) VALUES (
  940001,
  '__phase_2a1_plan__',
  1,
  125,
  TRUE,
  NULL
);

SELECT set_config('request.jwt.claims', '{"sub":"phase_2a1_parent"}', TRUE);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_failed BOOLEAN := FALSE;
BEGIN
  -- This failure is deliberately induced after create_order_secure has
  -- inserted a Subscription and before it can insert the Order. PostgreSQL
  -- rolls back all writes made by the failing function call, proving the
  -- database-side atomicity boundary without implying Storage transactionality.
  BEGIN
    PERFORM public.create_order_secure(
      '20000000-0000-4000-8000-000000000001',
      940001,
      jsonb_build_array(
        jsonb_build_object(
          'type', 'subscription',
          'planName', '__phase_2a1_plan__',
          'details', jsonb_build_object(
            'subscriptionId', '20000000-0000-4000-8000-000000000003'
          )
        ),
        jsonb_build_object(
          'type', 'product',
          'productKey', '__phase_2a1_missing_product__'
        )
      ),
      NULL,
      '{}'::jsonb
    );
  EXCEPTION
    WHEN OTHERS THEN
      v_failed := TRUE;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'create_order_secure rollback fixture did not fail as expected';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE id = '20000000-0000-4000-8000-000000000003'
  ) THEN
    RAISE EXCEPTION 'Subscription write survived a failed create_order_secure call';
  END IF;
END;
$$;
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"phase_2a1_parent"}', TRUE);
SET LOCAL ROLE authenticated;
SELECT public.create_subscription_secure(
  '20000000-0000-4000-8000-000000000001',
  940001,
  '__phase_2a1_plan__'
);
RESET ROLE;

DO $$
DECLARE
  v_subscription public.subscriptions;
BEGIN
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE user_id = '20000000-0000-4000-8000-000000000001'
    AND child_id = 940001
    AND plan_id = 940001;

  IF NOT FOUND OR v_subscription.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'Subscription creation did not produce pending_payment';
  END IF;
  IF v_subscription.total <> 125 THEN
    RAISE EXCEPTION 'Subscription total was not sourced from the database plan';
  END IF;
END;
$$;

SELECT set_config('request.jwt.claims', '{"sub":"phase_2a1_parent"}', TRUE);
SET LOCAL ROLE authenticated;
SELECT public.submit_subscription_receipt(
  (
    SELECT id
    FROM public.subscriptions
    WHERE user_id = '20000000-0000-4000-8000-000000000001'
      AND child_id = 940001
      AND plan_id = 940001
  ),
  'https://storage.example.invalid/phase-2a1-receipt.png'
);
RESET ROLE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = '20000000-0000-4000-8000-000000000001'
      AND child_id = 940001
      AND plan_id = 940001
      AND status = 'pending_review'
      AND receipt_url = 'https://storage.example.invalid/phase-2a1-receipt.png'
  ) THEN
    RAISE EXCEPTION 'Receipt submission did not produce pending_review';
  END IF;
END;
$$;

-- Explicit fixtures verify the existing supported status values and actions.
INSERT INTO public.subscriptions (
  id, user_id, child_id, plan_id, plan_name, status, total
) VALUES
  ('20000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 940001, 940001, '__phase_2a1_plan__', 'active', 125),
  ('20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 940001, 940001, '__phase_2a1_plan__', 'pending_payment', 125);

SELECT set_config('request.jwt.claims', '{"sub":"phase_2a1_parent"}', TRUE);
SET LOCAL ROLE authenticated;

-- active -> pause -> paused -> reactivate -> active -> cancel -> cancelled
SELECT public.update_subscription_status_secure(
  '20000000-0000-4000-8000-000000000002',
  'pause'
);
SELECT public.update_subscription_status_secure(
  '20000000-0000-4000-8000-000000000002',
  'reactivate'
);
SELECT public.update_subscription_status_secure(
  '20000000-0000-4000-8000-000000000002',
  'cancel'
);

-- pending_payment -> cancel -> cancelled
SELECT public.update_subscription_status_secure(
  '20000000-0000-4000-8000-000000000004',
  'cancel'
);

-- pending_review -> cancel -> cancelled; approval is intentionally absent.
SELECT public.update_subscription_status_secure(
  (
    SELECT id
    FROM public.subscriptions
    WHERE user_id = '20000000-0000-4000-8000-000000000001'
      AND child_id = 940001
      AND plan_id = 940001
  ),
  'cancel'
);
RESET ROLE;

DO $$
BEGIN
  IF (SELECT status FROM public.subscriptions WHERE id = '20000000-0000-4000-8000-000000000002') <> 'cancelled' THEN
    RAISE EXCEPTION 'active/pause/reactivate/cancel transition sequence is invalid';
  END IF;
  IF (SELECT status FROM public.subscriptions WHERE id = '20000000-0000-4000-8000-000000000004') <> 'cancelled' THEN
    RAISE EXCEPTION 'pending_payment cancellation is invalid';
  END IF;
  IF (
    SELECT status
    FROM public.subscriptions
    WHERE user_id = '20000000-0000-4000-8000-000000000001'
      AND child_id = 940001
      AND plan_id = 940001
  ) <> 'cancelled' THEN
    RAISE EXCEPTION 'pending_review cancellation is invalid';
  END IF;
END;
$$;

ROLLBACK;
