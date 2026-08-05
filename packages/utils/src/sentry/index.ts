import * as Sentry from '@sentry/core';

const FILTERED = '[FILTERED]';
const MAX_SANITIZE_DEPTH = 8;

/**
 * Sensitive keys that must never be recorded in Sentry events, extras, headers, or breadcrumbs.
 */
const SENSITIVE_KEYS = [
  'password',
  'passcode',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'jwt',
  'cookie',
  'set_cookie',
  'authorization',
  'secret',
  'client_secret',
  'private_key',
  'apikey',
  'api_key',
  'x_api_key',
  'signature',
  'credit_card',
  'creditcard',
  'card_number',
  'cvv',
  'cvc',
  'ssn',
  'pin',
];

const normalizeKey = (key: string): string => key.toLowerCase().replace(/[^a-z0-9]/g, '_');

const isSensitiveKey = (key: string): boolean => {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEYS.some((sensitive) => normalized.includes(sensitive));
};

const redactUrl = (value: string): string => {
  try {
    const isAbsolute = /^[a-z][a-z\d+\-.]*:\/\//i.test(value);
    const parsed = new URL(value, 'https://sentry.invalid');

    for (const [key, queryValue] of parsed.searchParams.entries()) {
      if (isSensitiveKey(key)) {
        parsed.searchParams.set(key, FILTERED);
      } else {
        parsed.searchParams.set(key, redactString(queryValue));
      }
    }

    return isAbsolute ? parsed.toString() : `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return value;
  }
};

/**
 * Scrubs common secrets and PII which may be embedded in error messages or URL values.
 */
export const redactString = (value: string): string => {
  let redacted = value;

  redacted = redacted.replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi, `Bearer ${FILTERED}`);
  redacted = redacted.replace(
    /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    '[FILTERED_JWT]',
  );
  redacted = redacted.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    '[FILTERED_EMAIL]',
  );
  redacted = redacted.replace(
    /((?:password|passcode|access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|authorization|cookie|client[_-]?secret)\s*["']?\s*[:=]\s*["']?)[^"',\s}&]+/gi,
    `$1${FILTERED}`,
  );

  return redacted.includes('?') ? redactUrl(redacted) : redacted;
};

const sanitizeValue = (
  data: unknown,
  seen: WeakSet<object>,
  depth: number,
): unknown => {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return redactString(data);
  if (typeof data !== 'object') return data;
  if (depth >= MAX_SANITIZE_DEPTH) return '[TRUNCATED]';
  if (seen.has(data)) return '[CIRCULAR]';

  seen.add(data);

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeValue(item, seen, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = isSensitiveKey(key)
      ? FILTERED
      : sanitizeValue(value, seen, depth + 1);
  }
  return sanitized;
};

/**
 * Recursively sanitizes arbitrary event context while handling cycles and limiting depth.
 */
export const sanitizeData = <T>(data: T): T => {
  return sanitizeValue(data, new WeakSet<object>(), 0) as T;
};

export interface SupabaseErrorContext {
  operation:
    | 'SELECT'
    | 'INSERT'
    | 'UPDATE'
    | 'DELETE'
    | 'RPC'
    | 'STORAGE_UPLOAD'
    | 'STORAGE_DOWNLOAD'
    | 'STORAGE_DELETE'
    | 'AUTH'
    | 'REALTIME'
    | 'EDGE_FUNCTION'
    | string;
  table?: string;
  rpcName?: string;
  bucket?: string;
  statusCode?: string | number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

const safeCapture = (capture: () => string): string => {
  try {
    return capture();
  } catch {
    return '';
  }
};

/**
 * Captures a Supabase failure with operation metadata but never request payloads.
 */
export const captureSupabaseError = (
  error: unknown,
  context: SupabaseErrorContext,
): string => {
  const tags: Record<string, string> = {
    'supabase.operation': context.operation,
  };
  if (context.table) tags['supabase.table'] = context.table;
  if (context.rpcName) tags['supabase.rpc'] = context.rpcName;
  if (context.bucket) tags['supabase.bucket'] = context.bucket;
  if (context.statusCode !== undefined) {
    tags['supabase.status_code'] = String(context.statusCode);
  }

  const extra = sanitizeData({
    operation: context.operation,
    duration_ms: context.durationMs,
    table: context.table,
    rpc_name: context.rpcName,
    bucket: context.bucket,
    status_code: context.statusCode,
    ...context.metadata,
  });

  return safeCapture(() =>
    Sentry.captureException(error, {
      tags,
      extra,
      level: 'error',
    }),
  );
};

export interface ApiErrorContext {
  url?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Captures an HTTP failure without request/response bodies or sensitive URL parameters.
 */
export const captureApiError = (error: unknown, context: ApiErrorContext): string => {
  const tags: Record<string, string> = {};
  if (context.method) tags['api.method'] = context.method.toUpperCase();
  if (context.statusCode !== undefined) tags['api.status_code'] = String(context.statusCode);

  const extra = sanitizeData({
    url: redactUrl(context.url || 'unknown_url'),
    method: context.method,
    status_code: context.statusCode,
    duration_ms: context.durationMs,
    ...context.metadata,
  });

  return safeCapture(() =>
    Sentry.captureException(error, {
      tags,
      extra,
      level: 'error',
    }),
  );
};

export type SentryCaptureContext = Parameters<typeof Sentry.captureException>[1];
export type SentryStartSpanOptions = Parameters<typeof Sentry.startSpan>[0];

export const captureException = (
  error: unknown,
  captureContext?: SentryCaptureContext,
): string => {
  return safeCapture(() =>
    Sentry.captureException(error, sanitizeData(captureContext)),
  );
};

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  captureContext?: Record<string, unknown>,
): string => {
  return safeCapture(() =>
    Sentry.captureMessage(redactString(message), {
      level,
      ...sanitizeData(captureContext),
    }),
  );
};

export interface SentryUserContext {
  id: string;
  email?: string;
  role?: string;
}

/**
 * User context has an explicit allow-list. Authentication/session data cannot pass this boundary.
 */
export const setUser = (user: SentryUserContext | null): void => {
  try {
    if (!user) {
      Sentry.setUser(null);
      return;
    }

    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch {
    // Monitoring must never interrupt authentication or application state.
  }
};

export const clearUser = (): void => setUser(null);

/**
 * Wraps an asynchronous operation in a performance span and preserves the original failure.
 */
export const startSpan = async <T>(
  context: SentryStartSpanOptions,
  callback: (span?: Sentry.Span) => T | Promise<T>,
): Promise<T> => {
  let operationStarted = false;

  try {
    return await Sentry.startSpan(context, async (span) => {
      operationStarted = true;
      try {
        return await callback(span);
      } catch (error) {
        span.setStatus({ code: 2, message: 'internal_error' });
        throw error;
      }
    });
  } catch (error) {
    if (!operationStarted) {
      return callback(undefined);
    }
    throw error;
  }
};

const getErrorDetails = (error: unknown): { name: string; message: string } => {
  if (error instanceof Error) return { name: error.name, message: error.message || error.name };
  if (typeof error === 'string') return { name: '', message: error };

  try {
    const candidate = error as { name?: unknown; message?: unknown };
    return {
      name: typeof candidate?.name === 'string' ? candidate.name : '',
      message:
        typeof candidate?.message === 'string'
          ? candidate.message
          : JSON.stringify(error),
    };
  } catch {
    return { name: '', message: String(error) };
  }
};

/**
 * Ignores only well-understood benign browser noise. Operational fetch and validation failures remain reportable.
 */
export const shouldIgnoreError = (error: unknown): boolean => {
  if (!error) return false;

  const { name, message } = getErrorDetails(error);

  if (
    name === 'AbortError' ||
    message.includes('AbortError') ||
    message.includes('The operation was aborted')
  ) {
    return true;
  }

  if (
    message.includes('ResizeObserver loop limit exceeded') ||
    message.includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    return true;
  }

  if (
    message.includes('chrome-extension://') ||
    message.includes('moz-extension://') ||
    message.includes('safari-extension://')
  ) {
    return true;
  }

  if (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError when attempting to fetch resource') ||
    message.includes('Load failed') ||
    message.includes('net::ERR_INTERNET_DISCONNECTED') ||
    message.includes('net::ERR_NAME_NOT_RESOLVED') ||
    message.includes('net::ERR_CONNECTION_RESET')
  ) {
    return true;
  }
};

const sanitizeBreadcrumb = (breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb => ({
  ...breadcrumb,
  message: breadcrumb.message ? redactString(breadcrumb.message) : breadcrumb.message,
  data: breadcrumb.data ? sanitizeData(breadcrumb.data) : breadcrumb.data,
});

const sanitizeEvent = <T extends Sentry.Event>(event: T): T => {
  if (event.message) event.message = redactString(event.message);

  if (event.request) {
    if (event.request.url) event.request.url = redactUrl(event.request.url);
    if (event.request.query_string) {
      event.request.query_string = sanitizeData(event.request.query_string);
    }

    delete event.request.cookies;
    delete event.request.data;

    if (event.request.headers) {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(event.request.headers)) {
        if (!isSensitiveKey(key)) headers[key] = redactString(value);
      }
      event.request.headers = headers;
    }
  }

  if (event.user) {
    event.user = {
      id: event.user.id,
      email: event.user.email,
      role: typeof event.user.role === 'string' ? event.user.role : undefined,
    };
  }

  if (event.extra) event.extra = sanitizeData(event.extra);
  if (event.contexts) event.contexts = sanitizeData(event.contexts);
  if (event.tags) event.tags = sanitizeData(event.tags);
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(sanitizeBreadcrumb);

  for (const exception of event.exception?.values || []) {
    if (exception.value) exception.value = redactString(exception.value);
    for (const frame of exception.stacktrace?.frames || []) {
      if (frame.filename) frame.filename = redactUrl(frame.filename);
      if (frame.abs_path) frame.abs_path = redactUrl(frame.abs_path);
    }
  }

  return event;
};

export const sentryBeforeBreadcrumb = (
  breadcrumb: Sentry.Breadcrumb,
): Sentry.Breadcrumb | null => {
  try {
    return sanitizeBreadcrumb(breadcrumb);
  } catch {
    return null;
  }
};

export const sentryBeforeSend = (
  event: Sentry.ErrorEvent,
  hint?: Sentry.EventHint,
): Sentry.ErrorEvent | null => {
  const originalException = hint?.originalException;
  if (originalException && shouldIgnoreError(originalException)) return null;

  if (event.exception?.values?.some((exception) => shouldIgnoreError(exception.value))) {
    return null;
  }

  try {
    return sanitizeEvent(event);
  } catch {
    // Fail closed: a sanitizer problem must not leak an unsanitized event.
    return null;
  }
};

export const sentryBeforeSendTransaction = (
  event: Sentry.TransactionEvent,
): Sentry.TransactionEvent | null => {
  try {
    return sanitizeEvent(event);
  } catch {
    return null;
  }
};
