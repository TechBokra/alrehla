"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { Input } from "@eng-mohamedelsayed/admin-ui/components/ui/input";

export interface FormInputProps
  extends
    Omit<
      React.ComponentProps<typeof Input>,
      "name" | "value" | "onChange" | "onBlur"
    >,
    FormFieldPresentationProps {
  onValueChange?: ((value: string) => void) | undefined;
}

export function FormInput({
  label,
  description,
  required,
  className,
  onValueChange,
  ...props
}: FormInputProps) {
  const field = useFieldContext<string>();
  const invalid = !field.state.meta.isValid;
  const errorMsg = normalizeFieldErrors(field.state.meta.errors);

  return (
    <Field data-invalid={invalid} className={className}>
      {label && (
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FieldLabel>
      )}
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => {
          const value = e.target.value;
          field.handleChange(value);
          onValueChange?.(value);
        }}
        aria-invalid={invalid}
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
