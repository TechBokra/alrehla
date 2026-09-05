export type FormErrorSource = "validation" | "server" | "form";

export interface FormErrorEntry {
  fieldPath?: string;
  message: string;
  source: FormErrorSource;
}

export interface FormErrorStateLike {
  errorMap?: unknown;
  fieldMeta?: unknown;
}

export interface FormLikeWithState {
  state?: FormErrorStateLike;
}

const SOURCE_PRIORITY: Record<FormErrorSource, number> = {
  form: 1,
  validation: 2,
  server: 3,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function messageFromUnknown(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  if (isRecord(value) && typeof value.message === "string") {
    return value.message.trim() || undefined;
  }
  return undefined;
}

function pathFromUnknown(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const path = value.reduce((result, part) => {
      if (part === undefined || part === null || part === "") return result;
      return typeof part === "number"
        ? `${result}[${part}]`
        : result
          ? `${result}.${String(part)}`
          : String(part);
    }, "");
    return path || undefined;
  }
  return undefined;
}

/**
 * Converts TanStack field metadata and form error maps into one deterministic
 * list. The map is deliberately tolerant of Zod issues and server payloads so
 * all error producers share the same presentation and navigation pipeline.
 */
export function normalizeFormErrors(
  input: FormErrorStateLike | FormLikeWithState
): FormErrorEntry[] {
  const state =
    isRecord(input) && "state" in input && isRecord(input.state)
      ? (input.state as FormErrorStateLike)
      : (input as FormErrorStateLike);
  const entries: FormErrorEntry[] = [];
  const byKey = new Map<string, number>();

  const add = (
    fieldPath: string | undefined,
    message: string | undefined,
    source: FormErrorSource
  ) => {
    const normalizedPath = fieldPath?.trim() || undefined;
    const normalizedMessage = message?.trim();
    if (!normalizedMessage) return;
    const key = `${normalizedPath ?? ""}\u0000${normalizedMessage}`;
    const existingIndex = byKey.get(key);
    if (existingIndex !== undefined) {
      const existing = entries[existingIndex];
      if (
        existing &&
        SOURCE_PRIORITY[source] > SOURCE_PRIORITY[existing.source]
      ) {
        entries[existingIndex] = { ...existing, source };
      }
      return;
    }
    byKey.set(key, entries.length);
    entries.push({
      ...(normalizedPath ? { fieldPath: normalizedPath } : {}),
      message: normalizedMessage,
      source,
    });
  };

  const visit = (
    value: unknown,
    source: FormErrorSource,
    fallbackField?: string,
    visited = new Set<unknown>()
  ): void => {
    if (value === null || value === undefined) return;
    const directMessage = messageFromUnknown(value);
    if (directMessage) {
      const issuePath = isRecord(value)
        ? pathFromUnknown(value.path)
        : undefined;
      add(issuePath ?? fallbackField, directMessage, source);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item, source, fallbackField, visited);
      return;
    }
    if (!isRecord(value) || visited.has(value)) return;
    visited.add(value);

    let handled = false;
    for (const key of ["form", "formError"]) {
      const formValue = value[key];
      if (formValue !== undefined) {
        handled = true;
        visit(formValue, "form", undefined, visited);
      }
    }
    for (const key of ["fields", "fieldErrors"]) {
      const fieldValues = value[key];
      if (isRecord(fieldValues)) {
        handled = true;
        for (const [fieldPath, fieldError] of Object.entries(fieldValues)) {
          visit(fieldError, source, fieldPath, visited);
        }
      }
    }
    if (value.path !== undefined && value.message !== undefined) {
      handled = true;
      add(
        pathFromUnknown(value.path) ?? fallbackField,
        messageFromUnknown(value.message),
        source
      );
    }
    if (value.message !== undefined && !handled) {
      handled = true;
      visit(
        value.message,
        fallbackField ? source : "form",
        fallbackField,
        visited
      );
    }

    if (!handled) {
      for (const [fieldPath, fieldError] of Object.entries(value)) {
        if (
          fieldPath === "path" ||
          fieldPath === "message" ||
          fieldPath === "form" ||
          fieldPath === "formError" ||
          fieldPath === "fields" ||
          fieldPath === "fieldErrors"
        ) {
          continue;
        }
        visit(fieldError, source, fieldPath, visited);
      }
    }
  };

  // Field metadata preserves registration order, which is the most useful
  // stable order for client-side validation messages.
  if (isRecord(state.fieldMeta)) {
    for (const [fieldPath, meta] of Object.entries(state.fieldMeta)) {
      if (isRecord(meta) && Array.isArray(meta.errors)) {
        const source =
          isRecord(meta.errorMap) && meta.errorMap.onServer !== undefined
            ? "server"
            : "validation";
        for (const error of meta.errors) visit(error, source, fieldPath);
      }
    }
  }

  if (isRecord(state.errorMap)) {
    for (const [key, value] of Object.entries(state.errorMap)) {
      if (value === undefined || value === null) continue;
      const source: FormErrorSource =
        key === "onServer"
          ? "server"
          : messageFromUnknown(value)
            ? "form"
            : "validation";
      visit(value, source);
    }
  }

  // Keep form/global messages first while retaining insertion order within
  // each group. This makes summaries and first-error navigation deterministic.
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const aGlobal = a.entry.fieldPath ? 1 : 0;
      const bGlobal = b.entry.fieldPath ? 1 : 0;
      return aGlobal - bGlobal || a.index - b.index;
    })
    .map(({ entry }) => entry);
}

export function firstInvalidFieldPath(
  errors: readonly FormErrorEntry[]
): string | undefined {
  return errors.find((error) => error.fieldPath)?.fieldPath;
}
