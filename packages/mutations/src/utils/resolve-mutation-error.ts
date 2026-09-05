import { normalizeAppError } from "./normalize-app-error";
import { MutationError, type MutationErrorKind } from "../types/mutation-error";
import type { AppErrorType } from "../types/app-error";

function mutationKindFromAppErrorType(type: AppErrorType): MutationErrorKind {
  switch (type) {
    case "authentication":
      return "unauthorized";
    case "authorization":
      return "forbidden";
    default:
      return type;
  }
}

/** Backward-compatible mutation error wrapper over the canonical AppError normalizer. */
export function normalizeMutationError(
  error: unknown,
  fallbackMessage?: string
): MutationError {
  if (MutationError.isMutationError(error)) return error;
  const normalized = normalizeAppError(error, fallbackMessage);
  return new MutationError(normalized.message, {
    ...(normalized.code ? { code: normalized.code } : {}),
    ...(normalized.status !== undefined ? { status: normalized.status } : {}),
    ...(normalized.fieldErrors ? { fieldErrors: normalized.fieldErrors } : {}),
    ...(normalized.details !== undefined
      ? { details: normalized.details }
      : {}),
    kind: mutationKindFromAppErrorType(normalized.type),
    cause: normalized.cause ?? error,
  });
}

export function getMutationErrorMessage(error: unknown): string {
  return normalizeMutationError(error).message;
}
