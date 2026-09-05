import type { MutationError } from "../types/mutation-error";

export interface ServerErrorFormApi {
  // `never` keeps this structural adapter compatible with any TanStack Form
  // instance, including forms whose validator type leaves `onServer` undefined.
  setErrorMap: (errorMap: never) => void;
}

/** Maps normalized server field errors into TanStack Form's native onServer error map. */
export function applyServerFieldErrors(
  form: ServerErrorFormApi,
  error: MutationError
): void {
  const fields = Object.fromEntries(
    Object.entries(error.fieldErrors ?? {}).map(([field, messages]) => [
      field,
      messages.join(", "),
    ])
  );

  form.setErrorMap({
    onServer: {
      form: error.message,
      fields,
    },
  } as never);
}

/** Clears server errors after a form-level recovery action. */
export function clearServerFieldErrors(form: ServerErrorFormApi): void {
  form.setErrorMap({
    onServer: {
      fields: {},
    },
  } as never);
}
