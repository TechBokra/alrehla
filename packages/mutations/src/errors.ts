export interface AppMutationErrorInit {
  message: string;
  type?: string;
  code?: string;
  status?: number;
  details?: unknown;
  fieldErrors?: Record<string, string[]>;
  cause?: unknown;
}

export interface NormalizeMutationErrorOptions {
  fallbackMessage?: string;
}

export const DEFAULT_MUTATION_ERROR_MESSAGE =
  'تعذر إكمال العملية. يرجى المحاولة مرة أخرى.';

export class AppMutationError extends Error {
  readonly type?: string;
  readonly code?: string;
  readonly status?: number;
  readonly details?: unknown;
  readonly fieldErrors?: Record<string, string[]>;
  readonly cause?: unknown;

  constructor({ message, type, code, status, details, fieldErrors, cause }: AppMutationErrorInit) {
    super(message);
    this.name = 'AppMutationError';
    this.type = type;
    this.code = code;
    this.status = status;
    this.details = details;
    this.fieldErrors = fieldErrors;
    this.cause = cause;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getCode = (value: unknown): string | undefined =>
  isRecord(value) && typeof value.code === 'string' ? value.code : undefined;

const getFieldErrors = (value: unknown): Record<string, string[]> | undefined => {
  if (!isRecord(value) || !isRecord(value.fieldErrors)) return undefined;

  const fieldErrors = Object.entries(value.fieldErrors).reduce<Record<string, string[]>>(
    (result, [field, messages]) => {
      if (!Array.isArray(messages)) return result;

      const normalizedMessages = messages.filter(
        (message): message is string => typeof message === 'string' && Boolean(message.trim()),
      );

      if (normalizedMessages.length) result[field] = normalizedMessages;
      return result;
    },
    {},
  );

  return Object.keys(fieldErrors).length ? fieldErrors : undefined;
};

export const createAppMutationError = (
  error: AppMutationErrorInit,
): AppMutationError => new AppMutationError(error);

export const normalizeMutationError = (
  error: unknown,
  { fallbackMessage = DEFAULT_MUTATION_ERROR_MESSAGE }: NormalizeMutationErrorOptions = {},
): AppMutationError => {
  if (error instanceof AppMutationError) return error;

  const preserveMessage =
    isRecord(error) &&
    (error.name === 'ApiError' || error.name === 'ResourceContextError') &&
    typeof error.message === 'string';

  return new AppMutationError({
    cause: error,
    type: isRecord(error) && typeof error.type === 'string' ? error.type : undefined,
    code: getCode(error),
    status: isRecord(error) && typeof error.status === 'number' ? error.status : undefined,
    details: isRecord(error) ? error.details : undefined,
    fieldErrors: getFieldErrors(error),
    message: preserveMessage ? error.message as string : fallbackMessage,
  });
};
