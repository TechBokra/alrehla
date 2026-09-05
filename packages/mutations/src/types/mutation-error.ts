import { AppError, type AppErrorOptions, type AppErrorType } from "./app-error";

export type MutationErrorKind =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "server"
  | "network"
  | "timeout"
  | "cancelled"
  | "unknown";

export interface MutationErrorOptions extends Pick<
  AppErrorOptions,
  "code" | "status" | "fieldErrors" | "details" | "cause"
> {
  kind?: MutationErrorKind;
}

/** A safe, stable error shape for mutation consumers and form adapters. */
export class MutationError extends AppError {
  override readonly kind: MutationErrorKind;

  constructor(message: string, options: MutationErrorOptions = {}) {
    super(message, {
      ...(options.kind ? { kind: options.kind } : {}),
      ...(options.code ? { code: options.code } : {}),
      ...(options.status !== undefined ? { status: options.status } : {}),
      ...(options.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
      ...(options.details !== undefined ? { details: options.details } : {}),
      ...(options.cause !== undefined ? { cause: options.cause } : {}),
      type: appErrorTypeFromMutationKind(options.kind),
    });
    this.name = "MutationError";
    this.kind = options.kind ?? "unknown";
  }

  static isMutationError(error: unknown): error is MutationError {
    return error instanceof MutationError;
  }
}

function appErrorTypeFromMutationKind(
  kind: MutationErrorKind | undefined
): AppErrorType {
  switch (kind) {
    case "unauthorized":
      return "authentication";
    case "forbidden":
      return "authorization";
    case "validation":
    case "not_found":
    case "conflict":
    case "rate_limited":
    case "server":
    case "network":
    case "timeout":
    case "cancelled":
    case "unknown":
      return kind;
    default:
      return "unknown";
  }
}
