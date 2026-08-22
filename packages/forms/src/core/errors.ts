type ErrorWithMessage = {
  message: string;
};

type StandardFormError = {
  form?: Record<string, readonly unknown[]>;
};

export type FieldErrorSource = {
  state: {
    meta: {
      errors: readonly unknown[];
      isTouched: boolean;
    };
  };
};

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
    if (hasStandardFormError(error)) {
      return getErrorMessages(error.form?.['']);
    }

    return getErrorMessages([error]);
  });
};
