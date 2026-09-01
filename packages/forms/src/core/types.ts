import type * as React from 'react';
import type { FormAsyncValidateOrFn, FormValidateOrFn, ValidationLogicFn } from '@tanstack/react-form';
import type { FormErrorEntry } from './errors';

export interface CoreFormValidatorMap<TValues> {
  onMount?: FormValidateOrFn<TValues>;
  onChange?: FormValidateOrFn<TValues>;
  onChangeAsync?: FormAsyncValidateOrFn<TValues>;
  onBlur?: FormValidateOrFn<TValues>;
  onBlurAsync?: FormAsyncValidateOrFn<TValues>;
  onSubmit?: FormValidateOrFn<TValues>;
  onSubmitAsync?: FormAsyncValidateOrFn<TValues>;
  onDynamic?: FormValidateOrFn<TValues>;
  onDynamicAsync?: FormAsyncValidateOrFn<TValues>;
}

export type CoreFormSubmitStatus = 'idle' | 'validating' | 'invalid' | 'submitting' | 'pending' | 'success' | 'error';

export interface CoreFormState<TValues = unknown> {
  values: TValues;
  errors?: readonly unknown[];
  errorMap?: unknown;
  fieldMeta?: unknown;
  isSubmitting: boolean;
  isSubmitted?: boolean;
  submissionAttempts?: number;
  isDirty: boolean;
  isTouched: boolean;
  canSubmit: boolean;
}

export interface CoreFormSubscribeProps<TValues, TSelected> {
  selector: (state: CoreFormState<TValues>) => TSelected;
  children: (selected: TSelected) => React.ReactNode;
}

export interface CoreFormInstance<TValues = unknown> {
  readonly store: unknown;
  readonly state: CoreFormState<TValues>;
  readonly AppForm: React.ComponentType<{ children?: React.ReactNode }>;
  readonly Subscribe: <TSelected>(props: CoreFormSubscribeProps<TValues, TSelected>) => React.ReactNode;
  readonly handleSubmit: () => unknown;
  readonly reset: (values?: TValues) => void;
  readonly setErrorMap: (errorMap: object) => void;
  readonly coreStatus?: CoreFormSubmitStatus;
}

export interface FormSubmitInvalidContext<TValues> {
  value: TValues;
  form: CoreFormInstance<TValues>;
  errors: readonly FormErrorEntry[];
  firstInvalidFieldPath?: string;
  focusFirstInvalid: () => boolean;
}

export interface CoreFormOptions<TValues> {
  formId?: string;
  defaultValues: TValues;
  validators?: CoreFormValidatorMap<TValues>;
  validationLogic?: ValidationLogicFn;
  onSubmit: (values: TValues) => void | Promise<void>;
  onSubmitError?: (error: unknown, form: CoreFormInstance<TValues>) => void | Promise<void>;
  onSubmitInvalid?: (context: FormSubmitInvalidContext<TValues>) => void | Promise<void>;
  resetOnSuccess?: boolean;
  resetValues?: TValues;
  syncInitialValues?: boolean;
  resetDirtyOnInitialValuesChange?: boolean;
}

export interface CoreFormProps<TValues = unknown> {
  form: CoreFormInstance<TValues>;
  children: React.ReactNode;
  className?: string;
  id?: string;
  disabled?: boolean;
  pending?: boolean;
  noValidate?: boolean;
}

export interface FormSubmitStateValue {
  status: CoreFormSubmitStatus;
  isPending: boolean;
  isDirty: boolean;
  isTouched: boolean;
  canSubmit: boolean;
  hasUnsavedChanges: boolean;
}

export interface FormSubmitStateProps<TValues = unknown> {
  form: CoreFormInstance<TValues>;
  pending?: boolean;
  status?: CoreFormSubmitStatus;
  children: (state: FormSubmitStateValue) => React.ReactNode;
}
