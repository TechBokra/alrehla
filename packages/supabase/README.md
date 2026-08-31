# Supabase client credentials

`@alrehla/supabase/public` and `@alrehla/supabase/server` require
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` at runtime.
Missing credentials fail fast in development and production; the public factory
only permits its `allowMissingCredentials` escape hatch when `NODE_ENV=test`.

The escape hatch exists for isolated test tooling that does not perform a
Supabase request. It uses placeholders only in that test environment and must
not be used to run an application or hide a missing production-build
configuration. Server clients never use placeholders and always receive their
access token through dependency injection.
