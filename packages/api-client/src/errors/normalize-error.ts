import { ApiError, type ApiErrorType } from './api-error';

type ErrorRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ErrorRecord =>
  typeof value === 'object' && value !== null;

const getString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

const getStatus = (value: ErrorRecord): number | undefined => {
  if (typeof value.status === 'number') return value.status;
  if (typeof value.statusCode === 'number') return value.statusCode;
  return undefined;
};

const getFieldErrors = (value: ErrorRecord): Record<string, string[]> | undefined => {
  if (!isRecord(value.fieldErrors)) return undefined;

  const result: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(value.fieldErrors)) {
    if (!Array.isArray(messages)) continue;
    const normalized = messages.filter(
      (message): message is string => typeof message === 'string' && Boolean(message.trim()),
    );
    if (normalized.length) result[field] = normalized;
  }

  return Object.keys(result).length ? result : undefined;
};

const classify = (
  status: number | undefined,
  code: string | undefined,
  message: string,
): ApiErrorType => {
  const normalizedCode = code?.toUpperCase() ?? '';
  const normalizedMessage = message.toLowerCase();

  if (
    status === 401 ||
    normalizedCode === 'PGRST301' ||
    normalizedMessage.includes('not authenticated') ||
    normalizedMessage.includes('jwt')
  ) {
    return 'authentication';
  }
  if (
    status === 403 ||
    normalizedCode === '42501' ||
    normalizedMessage.includes('not authorized') ||
    normalizedMessage.includes('permission denied')
  ) {
    return 'authorization';
  }
  if (status === 404 || normalizedCode === 'PGRST116' || normalizedMessage.includes('not found')) {
    return 'not_found';
  }
  if (status === 409 || normalizedCode === '23505' || normalizedMessage.includes('duplicate key')) {
    return 'conflict';
  }
  if (
    status === 422 ||
    normalizedCode.startsWith('22') ||
    normalizedCode === '23502' ||
    normalizedCode === '23503' ||
    normalizedCode === '23514'
  ) {
    return 'validation';
  }
  if (status !== undefined && status >= 500) return 'database';
  if (normalizedCode.startsWith('PGRST') || normalizedCode.startsWith('42')) return 'database';
  return 'unknown';
};

const isCancelled = (error: ErrorRecord): boolean => {
  const name = getString(error.name)?.toLowerCase();
  const code = getString(error.code)?.toUpperCase();
  return name === 'aborterror' || code === 'ABORT_ERR' || code === 'ERR_CANCELED';
};

export const normalizeApiError = (
  error: unknown,
  fallbackMessage = 'تعذر التواصل مع الخادم. حاول مرة أخرى.',
): ApiError => {
  if (ApiError.is(error)) return error;

  if (isRecord(error) && isCancelled(error)) {
    return new ApiError('تم إلغاء الطلب.', {
      type: 'cancelled',
      code: 'REQUEST_CANCELLED',
      cause: error,
    });
  }

  if (error instanceof TypeError) {
    return new ApiError('تعذر الوصول إلى الخادم.', {
      type: 'network',
      code: 'NETWORK_ERROR',
      cause: error,
    });
  }

  if (isRecord(error)) {
    const code = getString(error.code);
    const status = getStatus(error);
    const message = getString(error.message) ?? fallbackMessage;
    const type = classify(status, code, message);
    return new ApiError(message, {
      type,
      code,
      status,
      details: error.details ?? error.hint ?? error,
      fieldErrors: getFieldErrors(error),
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError(error.message || fallbackMessage, { cause: error });
  }

  return new ApiError(fallbackMessage, { cause: error });
};
