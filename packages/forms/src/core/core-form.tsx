'use client';

import * as React from 'react';
import type { FormAsyncValidateOrFn, FormValidateOrFn } from '@tanstack/react-form';
import { useAppForm } from './app-form';
import { firstInvalidFieldPath, normalizeFormErrors, type FormErrorEntry } from './errors';
import { focusFormField } from './focus-field';
import type { CoreFormInstance, CoreFormOptions, CoreFormProps, CoreFormSubmitStatus } from './types';

type OptionalSyncValidator<TValues> = FormValidateOrFn<TValues> | undefined;
type OptionalAsyncValidator<TValues> = FormAsyncValidateOrFn<TValues> | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * TanStack's extended form API contains framework-specific generic parameters
 * that are intentionally not part of the public CoreForm contract. Keep this
 * runtime-checked adapter local to Forms so consumers never need a cast.
 */
function isCoreFormInstance<TValues>(value: unknown): value is CoreFormInstance<TValues> {
  if (
    !isRecord(value) ||
    !isRecord(value.state) ||
    typeof value.reset !== 'function' ||
    typeof value.setErrorMap !== 'function' ||
    typeof value.handleSubmit !== 'function' ||
    typeof value.AppForm !== 'function' ||
    typeof value.Subscribe !== 'function'
  ) {
    return false;
  }

  return true;
}

function adaptTanStackForm<TValues>(value: unknown): CoreFormInstance<TValues> {
  if (!isCoreFormInstance<TValues>(value)) {
    throw new Error('The TanStack form instance does not satisfy the CoreForm contract.');
  }

  return value;
}

const stableSerialize = (value: unknown, seen = new WeakSet<object>()): string => {
  if (value === null || value === undefined) return String(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value !== 'object') return JSON.stringify(value);
  if (value instanceof Date) return `date:${value.toISOString()}`;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableSerialize(item, seen)).join(',')}]`;
  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key], seen)}`)
    .join(',')}}`;
};

export interface CoreFormSubscriptionState {
  errorMap?: unknown;
  fieldMeta?: unknown;
  values?: unknown;
  errors?: readonly unknown[];
  isSubmitting?: boolean;
  isSubmitted?: boolean;
  submissionAttempts?: number;
  isDirty?: boolean;
  isTouched?: boolean;
  canSubmit?: boolean;
}

export interface CoreFormSubscriptionForm {
  store: { state: CoreFormSubscriptionState; subscribe?: (listener: () => void) => () => void };
}

export function useCoreFormSubscription<TSelected>(
  form: CoreFormSubscriptionForm,
  selector: (state: CoreFormSubscriptionState) => TSelected,
): TSelected {
  const [selected, setSelected] = React.useState(() => selector(form.store.state));

  React.useEffect(() => {
    if (!form.store.subscribe) return undefined;
    return form.store.subscribe(() => setSelected(selector(form.store.state)));
  }, [form, selector]);

  return selected;
}

export function useCoreForm<TValues>(options: CoreFormOptions<TValues>) {
  const [coreStatus, setCoreStatus] = React.useState<CoreFormSubmitStatus>('idle');
  const form = useAppForm<
    TValues,
    OptionalSyncValidator<TValues>,
    OptionalSyncValidator<TValues>,
    OptionalAsyncValidator<TValues>,
    OptionalSyncValidator<TValues>,
    OptionalAsyncValidator<TValues>,
    OptionalSyncValidator<TValues>,
    OptionalAsyncValidator<TValues>,
    OptionalSyncValidator<TValues>,
    OptionalAsyncValidator<TValues>,
    OptionalAsyncValidator<TValues>,
    unknown
  >({
    ...(options.formId ? { formId: options.formId } : {}),
    defaultValues: options.defaultValues,
    ...(options.validators ? { validators: options.validators } : {}),
    ...(options.validationLogic ? { validationLogic: options.validationLogic } : {}),
    onSubmit: async ({ value }) => {
      setCoreStatus('submitting');
      try {
        await options.onSubmit(value);
        setCoreStatus('success');
        if (options.resetOnSuccess) form.reset(options.resetValues ?? options.defaultValues);
      } catch (error) {
        setCoreStatus('error');
        try {
          await options.onSubmitError?.(error, adaptTanStackForm<TValues>(form));
        } finally {
          throw error;
        }
      }
    },
    ...(options.onSubmitInvalid
      ? {
          onSubmitInvalid: ({ value, formApi }) => {
            setCoreStatus('invalid');
            const errors = normalizeFormErrors(formApi.state);
            const firstInvalid = firstInvalidFieldPath(errors);
            void options.onSubmitInvalid?.({
              value,
              form: adaptTanStackForm<TValues>(form),
              errors,
              ...(firstInvalid ? { firstInvalidFieldPath: firstInvalid } : {}),
              focusFirstInvalid: () => focusFormField(firstInvalid),
            });
          },
        }
      : {}),
  });

  const previousDefaults = React.useRef(stableSerialize(options.defaultValues));
  React.useEffect(() => {
    if (!options.syncInitialValues) return;
    const serialized = stableSerialize(options.defaultValues);
    if (serialized === previousDefaults.current) return;
    previousDefaults.current = serialized;
    if (!form.state.isDirty || options.resetDirtyOnInitialValuesChange) form.reset(options.defaultValues);
  }, [form, options.defaultValues, options.resetDirtyOnInitialValuesChange, options.syncInitialValues]);

  Object.assign(form, { coreStatus });
  return form;
}

export function CoreForm<TValues>({ form, children, className, id, disabled = false, pending = false, noValidate = true }: CoreFormProps<TValues>) {
  return (
    <form.AppForm>
      <form
        id={id}
        noValidate={noValidate}
        aria-busy={pending || form.state.isSubmitting}
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          if (form.state.isSubmitting || pending || disabled) return;
          void Promise.resolve(form.handleSubmit()).catch(() => undefined);
        }}
      >
        <fieldset disabled={disabled || pending} className="min-w-0">
          {children}
        </fieldset>
      </form>
    </form.AppForm>
  );
}

export function setCoreFormError(
  form: Pick<CoreFormInstance, 'setErrorMap'>,
  error: { form?: string; fields?: Record<string, string | undefined> },
): void {
  form.setErrorMap({ onServer: { form: error.form, fields: error.fields ?? {} } });
}

export function CoreFormError<TValues>({
  form,
  title = 'Please fix the following errors before saving:',
  description,
  className,
  getFieldLabel,
  onSelectField,
}: {
  form: CoreFormInstance<TValues>;
  title?: string;
  description?: string;
  className?: string;
  getFieldLabel?: (fieldPath: string) => React.ReactNode;
  onSelectField?: (fieldPath: string, entry: FormErrorEntry) => void;
}) {
  return (
    <form.Subscribe
      selector={(state) => ({
        errorMap: state.errorMap,
        fieldMeta: state.fieldMeta,
        errors: state.errors,
        isSubmitted: state.isSubmitted,
        submissionAttempts: state.submissionAttempts,
      })}
    >
      {(state) => {
        const entries = normalizeFormErrors(state);
        const submitted = Boolean(state.isSubmitted) || (state.submissionAttempts ?? 0) > 0;
        if (!entries.length || (!submitted && !entries.some((entry) => entry.source !== 'validation'))) return null;

        return (
          <div role="alert" aria-live="assertive" className={className}>
            <strong>{title}</strong>
            {description ? <p>{description}</p> : null}
            <ul>
              {entries.map((entry, index) => (
                <li key={`${entry.fieldPath ?? 'form'}-${entry.message}-${index}`}>
                  {entry.fieldPath && onSelectField ? (
                    <button type="button" onClick={() => onSelectField(entry.fieldPath!, entry)}>
                      {getFieldLabel?.(entry.fieldPath) ?? entry.fieldPath}: {entry.message}
                    </button>
                  ) : (
                    <span>
                      {entry.fieldPath ? `${getFieldLabel?.(entry.fieldPath) ?? entry.fieldPath}: ` : ''}
                      {entry.message}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      }}
    </form.Subscribe>
  );
}
