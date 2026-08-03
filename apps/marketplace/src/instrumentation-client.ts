import * as Sentry from '@sentry/nextjs';
import {
  sentryBeforeBreadcrumb,
  sentryBeforeSend,
  sentryBeforeSendTransaction,
} from '@alrehla/utils/sentry';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'unknown';
const isProduction = environment === 'production';
const debug = process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true';
const isDeployedEnvironment = ['production', 'preview', 'staging'].includes(environment);
// A local DSN must never send production telemetry unless the developer opts in.
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
    sendDefaultPii: false,

    // Performance tracing remains available in opt-in local debug sessions.
    tracesSampleRate: isProduction ? 0.1 : debug ? 1.0 : 0,

    // Replay is instantiated only for explicitly-labelled production deployments.
    integrations: isProduction
      ? [
          Sentry.replayIntegration({
            maskAllText: true,
            maskAllInputs: true,
            blockAllMedia: true,
            block: [
              'input[type="password"]',
              'input[name*="password" i]',
              'input[name*="token" i]',
              'input[name*="secret" i]',
              'input[name*="card" i]',
              'input[name*="cvv" i]',
              'input[name*="cvc" i]',
              '.sentry-block',
              '[data-sentry-block]',
            ],
          }),
        ]
      : [],
    replaysOnErrorSampleRate: isProduction ? 1.0 : 0,
    replaysSessionSampleRate: isProduction ? 0.1 : 0,

    // Persist a bounded queue in IndexedDB and flush it when connectivity returns.
    transport: Sentry.makeBrowserOfflineTransport(),

    beforeBreadcrumb: sentryBeforeBreadcrumb,
    beforeSend: sentryBeforeSend,
    beforeSendTransaction: sentryBeforeSendTransaction,
  });
} catch {
  // Silent fallback
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
