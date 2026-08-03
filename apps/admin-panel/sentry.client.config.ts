import * as Sentry from '@sentry/nextjs';
import { sentryBeforeSend } from '@alrehla/utils';

const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  debug: false,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
    process.env.SENTRY_ENVIRONMENT ||
    process.env.NODE_ENV ||
    'development',
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.SENTRY_RELEASE,

  // Tracing: 10% in production, 100% in non-production
  tracesSampleRate: isProduction ? 0.1 : 1.0,

  // Session Replay: 100% on error, 10% normal replay in production
  replaysOnErrorSampleRate: isProduction ? 1.0 : 0,
  replaysSessionSampleRate: isProduction ? 0.1 : 0,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Mask all inputs to prevent sensitive admin data recording
      maskAllInputs: true,
      maskAllText: false,
      block: [
        'input[type="password"]',
        'input[name*="password"]',
        'input[name*="token"]',
        'input[name*="secret"]',
        'input[name*="credit_card"]',
        'input[name*="card"]',
        'input[name*="cvv"]',
        'input[name*="cvc"]',
        '.sentry-block',
        '[data-sentry-block]',
      ],
    }),
  ],

  // Filter expected errors and scrub sensitive PII
  beforeSend: sentryBeforeSend,
});
