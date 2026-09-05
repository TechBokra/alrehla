import {
  normalizeAppError,
  type AppError,
  type AppErrorType,
} from "@eng-mohamedelsayed/mutations";

/** Context in which a Resource error is being presented. */
export type ResourceErrorContext =
  | "query"
  | "create"
  | "update"
  | "delete"
  | "form"
  | "authorization"
  | "bulk"
  | "partial";

export type ResourceErrorSeverity = "error" | "warning";

export interface ResourcePartialOutcome {
  succeededIds: string[];
  failedIds: string[];
}

export interface ResourceErrorState {
  context: ResourceErrorContext;
  error: AppError;
  severity: ResourceErrorSeverity;
  blocking: boolean;
  retryable: boolean;
  title: string;
  description: string;
  fieldErrors?: Record<string, string[]>;
  partial?: ResourcePartialOutcome;
}

export interface ResourceErrorOptions {
  resourceLabel?: string;
  singularLabel?: string;
  operationLabel?: string;
  partial?: ResourcePartialOutcome;
}

const SAFE_MESSAGES = new Set<AppErrorType>([
  "validation",
  "authentication",
  "authorization",
  "not_found",
  "conflict",
]);

function label(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function defaultTitle(
  context: ResourceErrorContext,
  resourceLabel: string,
  singularLabel: string
): string {
  switch (context) {
    case "query":
      return `Could not load ${resourceLabel}.`;
    case "create":
      return `Could not create ${singularLabel}.`;
    case "update":
      return `Could not update ${singularLabel}.`;
    case "delete":
      return `Could not delete ${singularLabel}.`;
    case "form":
      return "Could not save your changes.";
    case "authorization":
      return "Access denied.";
    case "bulk":
      return `Could not complete the ${resourceLabel.toLowerCase()} action.`;
    case "partial":
      return `${resourceLabel} loaded with warnings.`;
  }
}

function defaultDescription(
  context: ResourceErrorContext,
  error: AppError,
  resourceLabel: string,
  singularLabel: string
): string {
  if (error.type === "authentication") {
    return "Your session may have expired. Sign in again to continue.";
  }
  if (error.type === "authorization") {
    return "You do not have permission to access this Store resource.";
  }
  if (error.type === "cancelled") return "";
  if (error.type === "validation") {
    return error.message || "Please review the highlighted fields.";
  }
  if (error.type === "conflict") {
    return (
      error.message ||
      "This record changed before your action completed. Reload and try again."
    );
  }
  if (error.type === "not_found") {
    return error.message || `${singularLabel} could not be found.`;
  }
  if (error.type === "network") {
    return "We could not reach the server. Check your connection and try again.";
  }
  if (error.type === "timeout") {
    return "The request took too long to complete. Please try again.";
  }
  if (error.type === "server") {
    return `The server could not ${context === "query" ? `load ${resourceLabel.toLowerCase()}` : "complete this request"}. Please try again.`;
  }
  if (SAFE_MESSAGES.has(error.type) && error.message) return error.message;
  return context === "query"
    ? `We could not load ${resourceLabel.toLowerCase()}. Please try again.`
    : `We could not complete this ${singularLabel.toLowerCase()} action. Please try again.`;
}

function isRetryable(error: AppError, context: ResourceErrorContext): boolean {
  if (context === "authorization" || error.type === "authorization")
    return false;
  if (error.type === "authentication" || error.type === "validation")
    return false;
  if (error.type === "conflict" || error.type === "not_found") return false;
  return (
    error.type === "network" ||
    error.type === "server" ||
    error.type === "timeout"
  );
}

function readIds(value: unknown, keys: readonly string[]): string[] {
  if (!value || typeof value !== "object") return [];
  for (const key of keys) {
    const candidate = (value as Record<string, unknown>)[key];
    if (Array.isArray(candidate)) {
      const ids = candidate.filter(
        (id): id is string => typeof id === "string"
      );
      if (ids.length > 0) return [...new Set(ids)];
    }
  }
  return [];
}

/** Extracts structured partial execution IDs without inspecting messages. */
export function extractResourcePartialOutcome(
  value: unknown
): ResourcePartialOutcome | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const nested =
    source.details && typeof source.details === "object"
      ? source.details
      : source.data && typeof source.data === "object"
        ? source.data
        : source.result && typeof source.result === "object"
          ? source.result
          : value;
  const succeededIds = readIds(nested, ["succeededIds", "successIds"]);
  const failedIds = readIds(nested, ["failedIds"]);
  if (succeededIds.length === 0 && failedIds.length === 0) return undefined;
  return { succeededIds, failedIds };
}

/** Converts any raw error to the canonical, UI-neutral Resource error policy. */
export function resolveResourceError(
  error: unknown,
  context: ResourceErrorContext,
  options: ResourceErrorOptions = {}
): ResourceErrorState | null {
  if (error === null || error === undefined) return null;
  const normalized = normalizeAppError(error);
  if (normalized.type === "cancelled") return null;

  const resourceLabel = label(options.resourceLabel, "Resources");
  const singularLabel = label(
    options.singularLabel,
    resourceLabel.replace(/s$/, "")
  );
  const effectiveContext =
    context === "authorization" ? "authorization" : context;
  const partial =
    options.partial ?? extractResourcePartialOutcome(normalized.details);
  return {
    context: effectiveContext,
    error: normalized,
    severity: effectiveContext === "partial" ? "warning" : "error",
    blocking:
      effectiveContext === "query" || effectiveContext === "authorization",
    retryable: isRetryable(normalized, effectiveContext),
    title: defaultTitle(effectiveContext, resourceLabel, singularLabel),
    description: defaultDescription(
      effectiveContext,
      normalized,
      resourceLabel,
      singularLabel
    ),
    ...(normalized.fieldErrors ? { fieldErrors: normalized.fieldErrors } : {}),
    ...(partial ? { partial } : {}),
  };
}
