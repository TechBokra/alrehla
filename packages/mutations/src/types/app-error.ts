export type AppErrorType =
  | "validation"
  | "authentication"
  | "authorization"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "network"
  | "timeout"
  | "cancelled"
  | "server"
  | "unknown";

export interface AppErrorOptions {
  /** Optional wire-compatible discriminator preserved alongside the canonical type. */
  kind?: string;
  code?: string;
  status?: number;
  type?: AppErrorType;
  fieldErrors?: Record<string, string[]>;
  details?: unknown;
  cause?: unknown;
}

/** Stable application error contract shared by query and mutation consumers. */
export class AppError extends Error {
  readonly kind: string;
  readonly code: string | undefined;
  readonly status: number | undefined;
  readonly type: AppErrorType;
  readonly fieldErrors: Record<string, string[]> | undefined;
  readonly details: unknown;
  override readonly cause: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined
    );
    this.name = "AppError";
    this.kind = options.kind ?? options.type ?? "unknown";
    this.code = options.code;
    this.status = options.status;
    this.type = options.type ?? "unknown";
    this.fieldErrors = options.fieldErrors;
    this.details = options.details;
    this.cause = options.cause;
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}
