import 'server-only';

export function areDiagnosticsEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.SENTRY_DIAGNOSTICS_ENABLED !== 'false'
  );
}
