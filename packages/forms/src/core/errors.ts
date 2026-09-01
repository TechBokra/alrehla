type ErrorWithMessage = { message: string };

type StandardFormError = { form?: Record<string, readonly unknown[]> };

export type FieldErrorSource = {
  state: {
    meta: {
      errors: readonly unknown[];
      isTouched: boolean;
      errorMap?: Record<string, unknown>;
    };
  };
};

export type FormErrorSource = 'validation' | 'server' | 'form';

export interface FormErrorEntry {
  fieldPath?: string;
  message: string;
  source: FormErrorSource;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasMessage = (value: unknown): value is ErrorWithMessage =>
  isRecord(value) && typeof value.message === 'string';

const hasStandardFormError = (value: unknown): value is StandardFormError =>
  isRecord(value) && isRecord(value.form);

export const getErrorMessages = (errors: readonly unknown[] | undefined): string[] => {
  if (!errors) return [];
  return errors.flatMap((error) => {
    if (typeof error === 'string' && error.trim()) return [error];
    if (hasMessage(error) && error.message.trim()) return [error.message];
    return [];
  });
};

export const getFieldErrorMessages = (field: FieldErrorSource): string[] => {
  if (!field.state.meta.isTouched) return [];
  return getErrorMessages(field.state.meta.errors);
};

export const getFormErrorMessages = (errors: readonly unknown[] | undefined): string[] => {
  if (!errors) return [];
  return errors.flatMap((error) => {
    if (hasStandardFormError(error)) return getErrorMessages(error.form?.['']);
    return getErrorMessages([error]);
  });
};

const sourcePriority: Record<FormErrorSource, number> = { form: 1, validation: 2, server: 3 };

const pathFromUnknown = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value.trim() || undefined;
  if (!Array.isArray(value)) return undefined;
  const path = value.reduce<string>((result, part) => {
    if (part === undefined || part === null || part === '') return result;
    return typeof part === 'number' ? `${result}[${part}]` : result ? `${result}.${String(part)}` : String(part);
  }, '');
  return path || undefined;
};

const messageFromUnknown = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  if (hasMessage(value)) return value.message.trim() || undefined;
  return undefined;
};

/** Converts TanStack, Zod, mutation, and server errors into one stable list. */
export const normalizeFormErrors = (input: unknown): FormErrorEntry[] => {
  const root = isRecord(input) && isRecord(input.state) ? input.state : input;
  const state = isRecord(root) ? root : {};
  const entries: FormErrorEntry[] = [];
  const indexByKey = new Map<string, number>();

  const add = (fieldPath: string | undefined, message: string | undefined, source: FormErrorSource) => {
    const normalizedMessage = message?.trim();
    if (!normalizedMessage) return;
    const normalizedPath = fieldPath?.trim() || undefined;
    const key = `${normalizedPath ?? ''}\u0000${normalizedMessage}`;
    const existingIndex = indexByKey.get(key);
    if (existingIndex !== undefined) {
      const existing = entries[existingIndex];
      if (existing && sourcePriority[source] > sourcePriority[existing.source]) entries[existingIndex] = { ...existing, source };
      return;
    }
    indexByKey.set(key, entries.length);
    entries.push({ ...(normalizedPath ? { fieldPath: normalizedPath } : {}), message: normalizedMessage, source });
  };

  const visit = (value: unknown, source: FormErrorSource, fallbackField?: string, visited = new Set<unknown>()): void => {
    if (value === null || value === undefined) return;
    const directMessage = messageFromUnknown(value);
    if (directMessage) {
      add(isRecord(value) ? pathFromUnknown(value.path) ?? fallbackField : fallbackField, directMessage, source);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, source, fallbackField, visited));
      return;
    }
    if (!isRecord(value) || visited.has(value)) return;
    visited.add(value);

    for (const key of ['form', 'formError']) {
      if (value[key] !== undefined) visit(value[key], 'form', undefined, visited);
    }
    for (const key of ['fields', 'fieldErrors']) {
      const fields = value[key];
      if (isRecord(fields)) Object.entries(fields).forEach(([fieldPath, fieldError]) => visit(fieldError, source, fieldPath, visited));
    }
    if (value.path !== undefined && value.message !== undefined) {
      add(pathFromUnknown(value.path) ?? fallbackField, messageFromUnknown(value.message), source);
      return;
    }
    if (value.message !== undefined) {
      visit(value.message, fallbackField ? source : 'form', fallbackField, visited);
      return;
    }
    Object.entries(value).forEach(([fieldPath, fieldError]) => {
      if (!['form', 'formError', 'fields', 'fieldErrors', 'path', 'message'].includes(fieldPath)) visit(fieldError, source, fieldPath, visited);
    });
  };

  if (isRecord(state.fieldMeta)) {
    Object.entries(state.fieldMeta).forEach(([fieldPath, meta]) => {
      if (!isRecord(meta)) return;
      const source: FormErrorSource = isRecord(meta.errorMap) && meta.errorMap.onServer !== undefined ? 'server' : 'validation';
      visit(meta.errors, source, fieldPath);
    });
  }

  if (isRecord(state.errorMap)) {
    Object.entries(state.errorMap).forEach(([key, value]) => {
      if (value !== undefined && value !== null) visit(value, key === 'onServer' ? 'server' : 'form');
    });
  }

  if (Array.isArray(state.errors)) visit(state.errors, 'form');
  return entries.sort((a, b) => Number(Boolean(a.fieldPath)) - Number(Boolean(b.fieldPath)));
};

export const firstInvalidFieldPath = (errors: readonly FormErrorEntry[]): string | undefined =>
  errors.find((entry) => entry.fieldPath)?.fieldPath;
