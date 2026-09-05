import type {
  FormAsyncValidateOrFn,
  FormValidateOrFn,
} from "@tanstack/react-form";
import type * as React from "react";
import type { FormErrorEntry } from "./form-errors";

export interface CoreFormValidatorMap<TFormData> {
  onMount?: FormValidateOrFn<TFormData>;
  onChange?: FormValidateOrFn<TFormData>;
  onChangeAsync?: FormAsyncValidateOrFn<TFormData>;
  onBlur?: FormValidateOrFn<TFormData>;
  onBlurAsync?: FormAsyncValidateOrFn<TFormData>;
  onSubmit?: FormValidateOrFn<TFormData>;
  onSubmitAsync?: FormAsyncValidateOrFn<TFormData>;
  onDynamic?: FormValidateOrFn<TFormData>;
  onDynamicAsync?: FormAsyncValidateOrFn<TFormData>;
}

export interface CoreFormOptions<TFormData> {
  formId?: string;
  defaultValues: TFormData;
  validators?: CoreFormValidatorMap<TFormData>;
  onSubmit: (values: TFormData) => void | Promise<void>;
  onSubmitError?: (
    error: unknown,
    form: CoreFormInstance
  ) => void | Promise<void>;
  onSubmitInvalid?: (
    context: FormSubmitInvalidContext<TFormData>
  ) => void | Promise<void>;
  resetOnSuccess?: boolean;
  resetValues?: TFormData;
  syncInitialValues?: boolean;
}

export interface FormSubmitInvalidContext<TFormData> {
  value: TFormData;
  form: CoreFormInstance;
  errors: readonly FormErrorEntry[];
  firstInvalidFieldPath?: string;
  /** Focuses a registered field when its editor exposes the shared DOM contract. */
  focusField: (fieldPath: string | undefined) => boolean;
}

/** The server-error API shared by all TanStack form instances. */
export type CoreFormInstance = {
  setErrorMap: (errorMap: never) => void;
};

export interface CoreFormRuntimeState {
  isSubmitting: boolean;
  isDirty: boolean;
  isTouched: boolean;
  canSubmit: boolean;
}

export interface CoreFormRuntime {
  AppForm: React.ComponentType<{ children?: React.ReactNode }>;
  Subscribe: React.ComponentType<{
    selector: (state: CoreFormRuntimeState) => unknown;
    children: (state: {
      isPending: boolean;
      isDirty: boolean;
      isTouched: boolean;
      canSubmit: boolean;
    }) => React.ReactNode;
  }>;
  state: CoreFormRuntimeState;
  handleSubmit: () => unknown;
}

export interface CoreFormProps<TForm = unknown> {
  form: TForm;
  children: React.ReactNode;
  className?: string;
  id?: string;
  disabled?: boolean;
  pending?: boolean;
  noValidate?: boolean;
}

export interface FormErrorPayload {
  form?: string | undefined;
  fields?: Record<string, string | undefined> | undefined;
}
