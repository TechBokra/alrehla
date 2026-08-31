export type ApiErrorType =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'conflict'
  | 'database'
  | 'network'
  | 'cancelled'
  | 'contract'
  | 'unknown';

export interface ApiErrorOptions {
  type?: ApiErrorType;
  code?: string;
  status?: number;
  details?: unknown;
  fieldErrors?: Record<string, string[]>;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly code?: string;
  readonly status?: number;
  readonly details?: unknown;
  readonly fieldErrors?: Record<string, string[]>;
  readonly cause?: unknown;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.type = options.type ?? 'unknown';
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
    this.fieldErrors = options.fieldErrors;
    this.cause = options.cause;
  }

  static is(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}
