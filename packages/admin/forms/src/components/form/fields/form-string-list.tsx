"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { Input } from "@eng-mohamedelsayed/admin-ui/components/ui/input";

export interface FormStringListProps extends FormFieldPresentationProps {
  placeholder?: string | undefined;
  delimiter?: string | undefined;
  disabled?: boolean | undefined;
}

/** Binds a delimited text input to a string array without lossy normalization. */
export function FormStringList({
  label,
  description,
  required,
  placeholder,
  delimiter = ",",
  disabled,
  className,
}: FormStringListProps) {
  const field = useFieldContext<string[]>();
  const invalid = !field.state.meta.isValid;
  const errorMsg = normalizeFieldErrors(field.state.meta.errors);
  const descriptionId = `${field.name}-description`;
  const errorId = `${field.name}-error`;
  const describedBy = [
    description ? descriptionId : null,
    invalid && errorMsg ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Field
      data-invalid={invalid}
      data-disabled={disabled}
      className={className}
    >
      {label ? (
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </FieldLabel>
      ) : null}
      <Input
        id={field.name}
        name={field.name}
        value={(field.state.value ?? []).join(`${delimiter} `)}
        onChange={(event) =>
          field.handleChange(
            event.target.value
              .split(delimiter)
              .map((item) => item.trim())
              .filter(Boolean)
          )
        }
        onBlur={field.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid}
        {...(describedBy ? { "aria-describedby": describedBy } : {})}
      />
      {description ? (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      ) : null}
      {invalid && errorMsg ? (
        <FieldError id={errorId}>{errorMsg}</FieldError>
      ) : null}
    </Field>
  );
}
