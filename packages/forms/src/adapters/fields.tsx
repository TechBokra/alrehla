"use client";

import * as React from 'react';
import { Button, type ButtonProps } from '@alrehla/ui/button';
import { Checkbox } from '@alrehla/ui/checkbox';
import { DatePicker, type DatePickerProps } from '@alrehla/ui/date-picker';
import { DateTimePicker, type DateTimePickerProps } from '@alrehla/ui/date-time-picker';
import { RadioGroup, RadioGroupItem } from '@alrehla/ui/components/ui/radio-group';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Select, type SelectProps } from '@alrehla/ui/native-select';
import { Textarea } from '@alrehla/ui/textarea';
import { cn } from '@alrehla/ui/lib/utils';
import { Switch } from '@alrehla/ui/components/ui/switch';
import { useFieldContext, useFormContext } from '../core/contexts';
import {
  getFieldErrorMessages,
  getFormErrorMessages,
  type FieldErrorSource,
} from '../core/errors';
import { selectFormSubmissionState } from '../core/form-state';

interface FieldAdapterProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

const getFieldPresentation = (field: FieldErrorSource, id?: string) => {
  const errors = getFieldErrorMessages(field);

  return {
    errors,
    hasError: errors.length > 0,
    id,
  };
};

const getAccessibilityProps = (
  fieldId: string,
  hasError: boolean,
  description?: React.ReactNode,
  error?: string,
) => ({
  'aria-invalid': hasError || undefined,
  'aria-describedby': [
    description ? `${fieldId}-description` : undefined,
    error ? `${fieldId}-error` : undefined,
  ].filter(Boolean).join(' ') || undefined,
});

interface FieldShellProps extends FieldAdapterProps {
  children: React.ReactNode;
  error?: string;
  fieldId: string;
}

const FieldShell = ({
  children,
  description,
  error,
  fieldId,
  label,
  required,
}: FieldShellProps) => (
  <FormField
    data-invalid={Boolean(error) || undefined}
    error={error}
    helperText={description}
    htmlFor={fieldId}
    label={label}
    required={required}
    descriptionId={description ? `${fieldId}-description` : undefined}
    errorId={error ? `${fieldId}-error` : undefined}
  >
    {children}
  </FormField>
);

type TextFieldProps = FieldAdapterProps &
  Omit<React.ComponentProps<typeof Input>, 'aria-invalid' | 'disabled' | 'id' | 'onBlur' | 'onChange' | 'required' | 'value'>;

export const TextField = ({
  description,
  disabled,
  id,
  label,
  required,
  ...inputProps
}: TextFieldProps) => {
  const field = useFieldContext<string>();
  const fieldId = id ?? field.name;
  const { errors, hasError } = getFieldPresentation(field, fieldId);

  return (
    <FieldShell
      description={description}
      error={errors[0]}
      fieldId={fieldId}
      label={label}
      required={required}
    >
      <Input
        {...inputProps}
        {...getAccessibilityProps(fieldId, hasError, description, errors[0])}
        disabled={disabled}
        id={fieldId}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.currentTarget.value)}
        required={required}
        value={field.state.value ?? ''}
      />
    </FieldShell>
  );
};

type TextareaFieldProps = FieldAdapterProps &
  Omit<React.ComponentProps<typeof Textarea>, 'aria-invalid' | 'disabled' | 'id' | 'onBlur' | 'onChange' | 'required' | 'value'>;

export const TextareaField = ({
  description,
  disabled,
  id,
  label,
  required,
  ...textareaProps
}: TextareaFieldProps) => {
  const field = useFieldContext<string>();
  const fieldId = id ?? field.name;
  const { errors, hasError } = getFieldPresentation(field, fieldId);

  return (
    <FieldShell
      description={description}
      error={errors[0]}
      fieldId={fieldId}
      label={label}
      required={required}
    >
      <Textarea
        {...textareaProps}
        {...getAccessibilityProps(fieldId, hasError, description, errors[0])}
        disabled={disabled}
        id={fieldId}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.currentTarget.value)}
        required={required}
        value={field.state.value ?? ''}
      />
    </FieldShell>
  );
};

/**
 * NumberField emits a number for numeric input and undefined when the input is
 * cleared. It never converts an empty input to 0, NaN, or an empty string.
 */
export type NumberFieldValue = number | undefined;

type NumberFieldProps = FieldAdapterProps &
  Omit<React.ComponentProps<typeof Input>, 'aria-invalid' | 'disabled' | 'id' | 'onBlur' | 'onChange' | 'required' | 'type' | 'value'>;

export const NumberField = ({
  description,
  disabled,
  id,
  label,
  required,
  ...inputProps
}: NumberFieldProps) => {
  const field = useFieldContext<NumberFieldValue>();
  const fieldId = id ?? field.name;
  const { errors, hasError } = getFieldPresentation(field, fieldId);

  return (
    <FieldShell
      description={description}
      error={errors[0]}
      fieldId={fieldId}
      label={label}
      required={required}
    >
      <Input
        {...inputProps}
        {...getAccessibilityProps(fieldId, hasError, description, errors[0])}
        disabled={disabled}
        id={fieldId}
        onBlur={field.handleBlur}
        onChange={(event) => {
          const value = event.currentTarget.valueAsNumber;
          field.handleChange(Number.isNaN(value) ? undefined : value);
        }}
        required={required}
        type="number"
        value={field.state.value ?? ''}
      />
    </FieldShell>
  );
};

type SelectFieldProps = FieldAdapterProps &
  Omit<SelectProps, 'aria-invalid' | 'disabled' | 'id' | 'onBlur' | 'onChange' | 'required' | 'value'>;

export const SelectField = ({
  children,
  description,
  disabled,
  id,
  label,
  required,
  ...selectProps
}: SelectFieldProps) => {
  const field = useFieldContext<string>();
  const fieldId = id ?? field.name;
  const { errors, hasError } = getFieldPresentation(field, fieldId);

  return (
    <FieldShell
      description={description}
      error={errors[0]}
      fieldId={fieldId}
      label={label}
      required={required}
    >
      <Select
        {...selectProps}
        {...getAccessibilityProps(fieldId, hasError, description, errors[0])}
        disabled={disabled}
        id={fieldId}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.currentTarget.value)}
        required={required}
        value={field.state.value ?? ''}
      >
        {children}
      </Select>
    </FieldShell>
  );
};

type CheckboxFieldProps = FieldAdapterProps &
  Omit<React.ComponentProps<typeof Checkbox>, 'aria-invalid' | 'checked' | 'disabled' | 'id' | 'onCheckedChange' | 'required'>;

export const CheckboxField = ({
  description,
  disabled,
  id,
  label,
  required,
  ...checkboxProps
}: CheckboxFieldProps) => {
  const field = useFieldContext<boolean>();
  const fieldId = id ?? field.name;
  const { errors, hasError } = getFieldPresentation(field, fieldId);

  return (
    <FieldShell
      description={description}
      error={errors[0]}
      fieldId={fieldId}
      label={label}
      required={required}
    >
      <Checkbox
        {...checkboxProps}
        {...getAccessibilityProps(fieldId, hasError, description, errors[0])}
        checked={field.state.value}
        disabled={disabled}
        id={fieldId}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
        required={required}
      />
    </FieldShell>
  );
};

type SwitchFieldProps = FieldAdapterProps &
  Omit<React.ComponentProps<typeof Switch>, 'aria-invalid' | 'checked' | 'disabled' | 'id' | 'onCheckedChange' | 'required'>;

export const SwitchField = ({
  description,
  disabled,
  id,
  label,
  required,
  ...switchProps
}: SwitchFieldProps) => {
  const field = useFieldContext<boolean>();
  const fieldId = id ?? field.name;
  const { errors, hasError } = getFieldPresentation(field, fieldId);

  return (
    <FieldShell
      description={description}
      error={errors[0]}
      fieldId={fieldId}
      label={label}
      required={required}
    >
      <Switch
        {...switchProps}
        {...getAccessibilityProps(fieldId, hasError, description, errors[0])}
        checked={field.state.value}
        disabled={disabled}
        id={fieldId}
        onCheckedChange={field.handleChange}
        required={required}
      />
    </FieldShell>
  );
};

type DateFieldProps = FieldAdapterProps &
  Omit<DatePickerProps, 'aria-invalid' | 'disabled' | 'id' | 'onBlur' | 'onChange' | 'required' | 'value'>;

export const DateField = ({
  description,
  disabled,
  id,
  label,
  required,
  ...datePickerProps
}: DateFieldProps) => {
  const field = useFieldContext<string>();
  const fieldId = id ?? field.name;
  const { errors, hasError } = getFieldPresentation(field, fieldId);

  return (
    <FieldShell
      description={description}
      error={errors[0]}
      fieldId={fieldId}
      label={label}
      required={required}
    >
      <DatePicker
        {...datePickerProps}
        {...getAccessibilityProps(fieldId, hasError, description, errors[0])}
        disabled={disabled}
        id={fieldId}
        onBlur={field.handleBlur}
        onChange={field.handleChange}
        required={required}
        value={field.state.value ?? ''}
      />
    </FieldShell>
  );
};

type TimeFieldProps = FieldAdapterProps &
  Omit<React.ComponentProps<typeof Input>, 'aria-invalid' | 'disabled' | 'id' | 'onBlur' | 'onChange' | 'required' | 'type' | 'value'>;

export const TimeField = ({
  description,
  disabled,
  id,
  label,
  required,
  ...inputProps
}: TimeFieldProps) => {
  const field = useFieldContext<string>();
  const fieldId = id ?? field.name;
  const { errors, hasError } = getFieldPresentation(field, fieldId);

  return (
    <FieldShell
      description={description}
      error={errors[0]}
      fieldId={fieldId}
      label={label}
      required={required}
    >
      <Input
        {...inputProps}
        {...getAccessibilityProps(fieldId, hasError, description, errors[0])}
        disabled={disabled}
        id={fieldId}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.currentTarget.value)}
        required={required}
        type="time"
        value={field.state.value ?? ''}
      />
    </FieldShell>
  );
};

export const EmailField = (props: TextFieldProps) => (
  <TextField {...props} type="email" autoComplete="email" />
);

export const PasswordField = (props: TextFieldProps) => (
  <TextField {...props} type="password" autoComplete="new-password" />
);

export const PhoneField = (props: TextFieldProps) => (
  <TextField {...props} type="tel" autoComplete="tel" />
);

export const UrlField = (props: TextFieldProps) => (
  <TextField {...props} type="url" inputMode="url" />
);

type DateTimeFieldProps = FieldAdapterProps &
  Omit<DateTimePickerProps, 'disabled' | 'id' | 'name' | 'onBlur' | 'onChange' | 'required' | 'value'>;

export const DateTimeField = ({
  description,
  disabled,
  id,
  label,
  required,
  ...dateTimeProps
}: DateTimeFieldProps) => {
  const field = useFieldContext<string>();
  const fieldId = id ?? field.name;
  const { errors, hasError } = getFieldPresentation(field, fieldId);

  return (
    <FieldShell
      description={description}
      error={errors[0]}
      fieldId={fieldId}
      label={label}
      required={required}
    >
      <DateTimePicker
        {...dateTimeProps}
        {...getAccessibilityProps(fieldId, hasError, description, errors[0])}
        disabled={disabled}
        id={fieldId}
        onBlur={field.handleBlur}
        onChange={field.handleChange}
        required={required}
        value={field.state.value ?? ''}
      />
    </FieldShell>
  );
};

interface RadioGroupFieldProps extends FieldAdapterProps {
  children: React.ReactNode;
}

export const RadioGroupField = ({
  children,
  description,
  disabled,
  id,
  label,
  required,
}: RadioGroupFieldProps) => {
  const field = useFieldContext<string>();
  const fieldId = id ?? field.name;
  const { errors, hasError } = getFieldPresentation(field, fieldId);

  return (
    <FieldShell
      description={description}
      error={errors[0]}
      fieldId={fieldId}
      label={label}
      required={required}
    >
      <RadioGroup
        id={fieldId}
        name={field.name}
        value={field.state.value ?? ''}
        onValueChange={field.handleChange}
        onBlur={field.handleBlur}
        aria-invalid={hasError || undefined}
        aria-disabled={disabled || undefined}
        className={disabled ? 'pointer-events-none opacity-60' : undefined}
      >
        {children}
      </RadioGroup>
    </FieldShell>
  );
};

export { RadioGroupItem };

export const FormError = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.errors}>
      {(errors) => {
        const messages = getFormErrorMessages(errors);
        if (!messages.length) return null;

        return (
          <p
            {...props}
            className={cn('text-sm font-medium text-destructive', className)}
            role="alert"
          >
            {messages.join(' ')}
          </p>
        );
      }}
    </form.Subscribe>
  );
};

export interface FormSubmitButtonProps extends Omit<ButtonProps, 'loading' | 'type'> {
  /** Pending state owned by an external mutation (for example useAppMutation). */
  pending?: boolean;
  pendingText?: React.ReactNode;
}

export const FormSubmitButton = ({
  children,
  disabled,
  pending = false,
  pendingText,
  ...buttonProps
}: FormSubmitButtonProps) => {
  const form = useFormContext();

  return (
    <form.Subscribe selector={selectFormSubmissionState}>
      {(state) => (
        <Button
          {...buttonProps}
          disabled={disabled || pending || !state.canSubmit || state.isSubmitting}
          loading={pending || state.isSubmitting}
          type="submit"
        >
          {pending && pendingText ? pendingText : children}
        </Button>
      )}
    </form.Subscribe>
  );
};

export type FormResetButtonProps = Omit<ButtonProps, 'type' | 'loading'>;

export const FormResetButton = ({ onClick, children = 'Reset', ...buttonProps }: FormResetButtonProps) => {
  const form = useFormContext();

  return (
    <Button
      {...buttonProps}
      type="button"
      onClick={(event) => {
        form.reset();
        onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
};
