import { normalizeApiError } from '../errors';

export interface ListResult<T> {
  rows: T[];
  total?: number;
}

export interface SupabaseResult<T> {
  data: T | null;
  error: unknown;
}

export const unwrapResult = <T>(
  result: SupabaseResult<T>,
  fallbackMessage?: string,
): T => {
  if (result.error) throw normalizeApiError(result.error, fallbackMessage);
  if (result.data === null) {
    throw normalizeApiError(new Error(fallbackMessage ?? 'لم يُرجع الخادم نتيجة.'), fallbackMessage);
  }
  return result.data;
};

export const optionalResult = <T>(
  result: SupabaseResult<T>,
  fallbackMessage?: string,
): T | null => {
  if (result.error) throw normalizeApiError(result.error, fallbackMessage);
  return result.data;
};

export const applyAbortSignal = async <T>(
  request: PromiseLike<T> & {
    abortSignal?: (requestSignal: AbortSignal) => PromiseLike<T>;
  },
  signal?: AbortSignal,
): Promise<T> => {
  const executable = signal && request.abortSignal
    ? request.abortSignal(signal)
    : request;
  return await executable;
};
