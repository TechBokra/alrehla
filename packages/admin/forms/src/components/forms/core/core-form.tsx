"use client";

import * as React from "react";
import { useStore } from "@tanstack/react-form";
import { useFormRuntime } from "../../form/runtime";
import { FormErrorSummary } from "../../form/components/form-error-summary";
import { focusFormField } from "./focus-field";
import {
  firstInvalidFieldPath,
  normalizeFormErrors,
  type FormErrorEntry,
  type FormErrorStateLike,
} from "./form-errors";
import type {
  CoreFormInstance,
  CoreFormOptions,
  CoreFormProps,
  CoreFormRuntime,
  FormErrorPayload,
} from "./types";

/**
 * The minimal state exposed to application-level form observers. TanStack
 * Form remains an implementation detail of this package; Admin features use
 * this selector instead of importing the form engine directly.
 */
export interface CoreFormSubscriptionState {
  errorMap?: unknown;
  fieldMeta?: unknown;
  values?: unknown;
  isSubmitting?: boolean;
  isSubmitted?: boolean;
  submissionAttempts?: number;
  isDirty?: boolean;
  isTouched?: boolean;
  canSubmit?: boolean;
}

export interface CoreFormSubscriptionForm {
  store: unknown;
}

export function useCoreFormSubscription<TSelected>(
  form: CoreFormSubscriptionForm,
  selector: (state: CoreFormSubscriptionState) => TSelected
): TSelected {
  return useStore(
    form.store as Parameters<typeof useStore>[0],
    selector as Parameters<typeof useStore>[1]
  ) as TSelected;
}

export function useCoreForm<TFormData>(options: CoreFormOptions<TFormData>) {
  const { useAppForm } = useFormRuntime();
  const form = useAppForm({
    ...(options.formId ? { formId: options.formId } : {}),
    defaultValues: options.defaultValues,
    ...(options.validators ? { validators: options.validators } : {}),
    onSubmit: async ({ value }: { value: TFormData }) => {
      try {
        await options.onSubmit(value);
        if (options.resetOnSuccess) {
          form.reset(options.resetValues ?? options.defaultValues);
        }
      } catch (error: unknown) {
        await options.onSubmitError?.(error, form as CoreFormInstance);
        throw error;
      }
    },
    ...(options.onSubmitInvalid
      ? {
          onSubmitInvalid: async ({
            value,
            formApi,
          }: {
            value: TFormData;
            formApi: { state: FormErrorStateLike };
          }) => {
            const errors = normalizeFormErrors(formApi.state);
            const invalidPath = firstInvalidFieldPath(errors);
            const context = {
              value,
              form: formApi as unknown as CoreFormInstance,
              errors,
              focusField: focusFormField,
            };
            if (invalidPath) {
              await options.onSubmitInvalid?.({
                ...context,
                firstInvalidFieldPath: invalidPath,
              });
            } else {
              await options.onSubmitInvalid?.(context);
            }
          },
        }
      : {}),
  });

  React.useEffect(() => {
    if (options.syncInitialValues) {
      form.reset(options.defaultValues);
    }
  }, [form, options.defaultValues, options.syncInitialValues]);

  return form;
}

export function setCoreFormError(
  form: CoreFormInstance,
  error: FormErrorPayload
): void {
  form.setErrorMap({
    onServer: {
      form: error.form,
      fields: error.fields ?? {},
    },
  } as never);
}

export function CoreForm<TForm>({
  form,
  children,
  className,
  id,
  disabled = false,
  pending = false,
  noValidate = true,
}: CoreFormProps<TForm>) {
  const runtime = form as unknown as CoreFormRuntime;

  return (
    <runtime.AppForm>
      <form
        id={id}
        noValidate={noValidate}
        aria-busy={pending || runtime.state.isSubmitting}
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          if (runtime.state.isSubmitting || pending || disabled) return;
          void Promise.resolve(runtime.handleSubmit()).catch(() => undefined);
        }}
      >
        <fieldset disabled={disabled || pending} className="min-w-0">
          {children}
        </fieldset>
      </form>
    </runtime.AppForm>
  );
}

export function CoreFormError({
  form,
  title = "Please fix the following errors before saving:",
  description,
  className,
  action,
  getFieldLabel,
  onSelectField,
}: {
  form: CoreFormInstance;
  title?: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
  getFieldLabel?: (fieldPath: string) => React.ReactNode;
  onSelectField?: (fieldPath: string, entry: FormErrorEntry) => void;
}) {
  return (
    <FormErrorSummary
      form={form}
      title={title}
      {...(description ? { description } : {})}
      {...(className ? { className } : {})}
      {...(action ? { action } : {})}
      {...(getFieldLabel ? { getFieldLabel } : {})}
      {...(onSelectField ? { onSelectField } : {})}
    />
  );
}
