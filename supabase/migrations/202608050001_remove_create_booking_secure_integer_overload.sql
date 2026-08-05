-- Remove legacy integer/varchar overloads of create_booking_secure.
-- child_profiles.id and instructors.id are BIGINT, so the (UUID, BIGINT, BIGINT, TEXT, DATE, TEXT, TEXT) signature is canonical.

BEGIN;

DROP FUNCTION IF EXISTS public.create_booking_secure(UUID, INTEGER, INTEGER, VARCHAR, DATE, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS public.create_booking_secure(UUID, INTEGER, INTEGER, TEXT, DATE, TEXT, TEXT);

GRANT EXECUTE ON FUNCTION public.create_booking_secure(UUID, BIGINT, BIGINT, TEXT, DATE, TEXT, TEXT)
  TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
