import {
  isActionFailure,
  isActionResult,
  type ActionResult,
} from "../types/action-result";
import type { UnwrapMutationResult } from "../types/mutation-options";
import { normalizeAppError } from "./normalize-app-error";

/** Unwraps a successful Server Action result or turns a failure into an AppError. */
export function normalizeActionResult<TResult>(
  result: TResult
): UnwrapMutationResult<TResult> {
  if (!isActionResult(result)) return result as UnwrapMutationResult<TResult>;
  if (isActionFailure(result)) {
    throw normalizeAppError(result.error);
  }
  if (typeof window !== "undefined" && typeof (result as any)?.success === "boolean") {
    console.log("%c[CLIENT DATA RECEIVED] 📦 Items / Result:", "color: #0284c7; font-weight: bold;", result.data);
    console.log(result.data);
  }

  return result.data as UnwrapMutationResult<TResult>;
}
