import type { MutationErrorKind } from "./mutation-error";
import type { AppErrorType } from "./app-error";

export interface ActionError {
  code?: string;
  status?: number;
  type?: AppErrorType;
  kind?: MutationErrorKind;
  message: string;
  fieldErrors?: Record<string, string[]>;
  details?: unknown;
}

export type ActionResult<TData> =
  | {
      success: true;
      data: TData;
    }
  | {
      success: false;
      error: ActionError;
    };

export function isActionResult(value: unknown): value is ActionResult<unknown> {
  if (typeof value !== "object" || value === null || !("success" in value)) {
    return false;
  }

  const success = (value as { success?: unknown }).success;
  return success === true || success === false;
}

export function isActionFailure(
  value: unknown
): value is Extract<ActionResult<unknown>, { success: false }> {
  return isActionResult(value) && value.success === false;
}
