-- Remove the legacy integer overload of create_order_secure.
-- child_profiles.id is BIGINT, so the bigint signature is canonical.

BEGIN;

DROP FUNCTION IF EXISTS public.create_order_secure(UUID, INTEGER, JSONB, TEXT, JSONB);

GRANT EXECUTE ON FUNCTION public.create_order_secure(UUID, BIGINT, JSONB, TEXT, JSONB)
  TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
