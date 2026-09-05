import { AppError, type AppErrorType } from "../types/app-error";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function readStatus(value: unknown): number | undefined {
  if (!isRecord(value)) return undefined;
  return typeof value.status === "number" ? value.status : undefined;
}

function readType(value: unknown): AppErrorType | undefined {
  switch (value) {
    case "validation":
      return "validation";
    case "authentication":
    case "unauthorized":
      return "authentication";
    case "authorization":
    case "forbidden":
      return "authorization";
    case "not_found":
      return "not_found";
    case "conflict":
      return "conflict";
    case "rate_limited":
      return "rate_limited";
    case "rate-limit":
    case "rate_limit":
      return "rate_limited";
    case "network":
      return "network";
    case "timeout":
      return "timeout";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "server":
      return "server";
    case "unknown":
      return "unknown";
    default:
      return undefined;
  }
}

function typeFromStatus(status: number | undefined): AppErrorType {
  switch (status) {
    case 401:
      return "authentication";
    case 403:
      return "authorization";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 422:
      return "validation";
    case 429:
      return "rate_limited";
    default:
      return status !== undefined && status >= 500 ? "server" : "unknown";
  }
}

function hasNetworkEvidence(value: unknown): boolean {
  if (!isRecord(value)) return false;

  const code = readString(value.code)?.toUpperCase();
  if (
    code === "ECONNABORTED" ||
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ENETUNREACH" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT"
  ) {
    return true;
  }

  const message = readString(value.message)?.toLowerCase() ?? "";
  if (
    message === "fetch failed" ||
    message === "failed to fetch" ||
    message === "network request failed" ||
    message.includes("networkerror") ||
    message.includes("network request")
  ) {
    return true;
  }

  return "cause" in value && hasNetworkEvidence(value.cause);
}

function isCancelled(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const name = readString(value.name)?.toLowerCase();
  const code = readString(value.code)?.toUpperCase();
  const type = readString(value.type)?.toLowerCase();
  const kind = readString(value.kind)?.toLowerCase();
  return (
    name === "aborterror" ||
    code === "abort_err" ||
    code === "err_canceled" ||
    type === "cancelled" ||
    type === "canceled" ||
    kind === "cancelled" ||
    kind === "canceled"
  );
}

function isTimeout(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const code = readString(value.code)?.toUpperCase();
  const message = readString(value.message)?.toLowerCase() ?? "";
  return (
    code === "ETIMEDOUT" ||
    code === "ECONNABORTED" ||
    code === "TIMEOUT" ||
    code === "ERR_TIMEOUT" ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    ("cause" in value && isTimeout(value.cause))
  );
}

function addFieldError(
  output: Record<string, string[]>,
  field: string,
  message: string
) {
  output[field] = [...(output[field] ?? []), message];
}

function readFieldErrors(value: unknown): Record<string, string[]> | undefined {
  if (!isRecord(value)) return undefined;

  const output: Record<string, string[]> = {};
  const direct = value.fieldErrors;
  if (isRecord(direct)) {
    for (const [field, messages] of Object.entries(direct)) {
      if (Array.isArray(messages)) {
        for (const message of messages) {
          const text = readString(message);
          if (text) addFieldError(output, field, text);
        }
      } else {
        const text = readString(messages);
        if (text) addFieldError(output, field, text);
      }
    }
  }

  const errors = value.errors;
  if (isRecord(errors)) {
    for (const [field, messages] of Object.entries(errors)) {
      const values = Array.isArray(messages) ? messages : [messages];
      for (const message of values) {
        const text = readString(message);
        if (text) addFieldError(output, field, text);
      }
    }
  }
  if (Array.isArray(errors)) {
    for (const entry of errors) {
      if (!isRecord(entry)) continue;
      const field = readString(entry.path) ?? readString(entry.field);
      const message = readString(entry.message);
      if (field && message) addFieldError(output, field, message);
    }
  }

  const details = value.details;
  if (isRecord(details)) {
    const nested = readFieldErrors(details);
    if (nested) {
      for (const [field, messages] of Object.entries(nested)) {
        for (const message of messages) addFieldError(output, field, message);
      }
    }
  }

  const issues = value.issues;
  if (Array.isArray(issues)) {
    for (const issue of issues) {
      if (!isRecord(issue)) continue;
      const path = Array.isArray(issue.path)
        ? issue.path.filter(
            (part): part is string | number =>
              typeof part === "string" || typeof part === "number"
          )
        : [];
      const field = path.length > 0 ? path.join(".") : undefined;
      const message = readString(issue.message);
      if (field && message) addFieldError(output, field, message);
    }
  }

  return Object.keys(output).length > 0 ? output : undefined;
}

/** Converts action, API, transport, and arbitrary failures to one app error. */
export function normalizeAppError(
  error: unknown,
  fallbackMessage = DEFAULT_ERROR_MESSAGE
): AppError {
  if (AppError.isAppError(error)) return error;

  if (isCancelled(error)) {
    return new AppError("Request cancelled.", {
      code: "REQUEST_CANCELLED",
      type: "cancelled",
      cause: error,
    });
  }

  if (isTimeout(error)) {
    return new AppError("The request timed out. Please try again.", {
      code: "TIMEOUT",
      type: "timeout",
      cause: error,
    });
  }

  if (hasNetworkEvidence(error)) {
    return new AppError("Unable to reach the server. Please try again.", {
      code: "network",
      type: "network",
      cause: error,
    });
  }

  if (isRecord(error)) {
    const status = readStatus(error);
    const fieldErrors = readFieldErrors(error);
    const type =
      readType(error.type) ?? readType(error.kind) ?? typeFromStatus(status);
    const code = readString(error.code);
    const kind = readString(error.kind);
    const details = "details" in error ? error.details : undefined;
    const message = readString(error.message) ?? fallbackMessage;

    return new AppError(message, {
      ...(code ? { code } : {}),
      ...(kind ? { kind } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(fieldErrors ? { fieldErrors } : {}),
      ...(details !== undefined ? { details } : {}),
      type,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new AppError(error.message || fallbackMessage, { cause: error });
  }

  return new AppError(fallbackMessage, { cause: error });
}
