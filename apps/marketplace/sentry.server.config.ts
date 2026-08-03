import * as Sentry from '@sentry/nextjs';
import {
  sentryBeforeBreadcrumb,
  sentryBeforeSend,
  sentryBeforeSendTransaction,
} from '@alrehla/utils/sentry';

const dsn = process.env.SENTRY_DSN;
const environment = process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || 'unknown';
const isProduction = environment === 'production';
const isDeployedEnvironment = ['production', 'preview', 'staging'].includes(environment);
const debug = process.env.SENTRY_DEBUG === 'true';
const enabled =
  Boolean(dsn) &&
  process.env.NODE_ENV !== 'test' &&
  (isDeployedEnvironment || debug);

try {
  Sentry.init({
    dsn,
    enabled,
    debug,
    environment,
    release: process.env.SENTRY_RELEASE,
    sendDefaultPii: false,
    tracesSampleRate: isProduction ? 0.1 : debug ? 1.0 : 0,
    beforeBreadcrumb: sentryBeforeBreadcrumb,
    beforeSend: sentryBeforeSend,
    beforeSendTransaction: sentryBeforeSendTransaction,
  });
} catch {
  // Silent fallback
}
