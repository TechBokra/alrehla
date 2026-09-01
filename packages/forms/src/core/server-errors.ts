import { normalizeMutationError } from '@alrehla/mutations';
import type { CoreFormInstance } from './types';

export const applyServerFieldErrors = <TValues>(
  form: Pick<CoreFormInstance<TValues>, 'setErrorMap'>,
  error: unknown,
): ReturnType<typeof normalizeMutationError> => {
  const normalized = normalizeMutationError(error);
  form.setErrorMap({
    onServer: {
      form: normalized.message,
      fields: normalized.fieldErrors ?? {},
    },
  });
  return normalized;
};
