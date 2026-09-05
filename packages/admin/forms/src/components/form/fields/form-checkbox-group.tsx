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
import { Checkbox } from "@eng-mohamedelsayed/admin-ui/components/ui/checkbox";

export interface FormCheckboxGroupOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean | undefined;
}

export interface FormCheckboxGroupProps extends FormFieldPresentationProps {
  options: readonly FormCheckboxGroupOption[];
  disabled?: boolean | undefined;
}

/** A reusable string-array checkbox field for catalog and settings forms. */
export function FormCheckboxGroup({
  label,
  description,
  required,
  options,
  disabled,
  className,
}: FormCheckboxGroupProps) {
  const field = useFieldContext<string[]>();
  const invalid = !field.state.meta.isValid;
  const errorMsg = normalizeFieldErrors(field.state.meta.errors);
  const selected = field.state.value ?? [];
  const descriptionId = `${field.name}-description`;
  const errorId = `${field.name}-error`;
  const describedBy = [
    description ? descriptionId : null,
    invalid && errorMsg ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  const toggle = (value: string, checked: boolean) => {
    field.handleChange(
      checked
        ? Array.from(new Set([...selected, value]))
        : selected.filter((item) => item !== value)
    );
  };

  return (
    <Field
      data-invalid={invalid}
      data-disabled={disabled}
      className={className}
    >
      {label ? (
        <FieldLabel>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </FieldLabel>
      ) : null}
      <div className="flex flex-wrap gap-2 rounded-md border border-border p-3">
        {options.map((option) => {
          const id = `${field.name}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs transition-colors hover:bg-muted"
            >
              <Checkbox
                id={id}
                checked={selected.includes(option.value)}
                onCheckedChange={(checked) =>
                  toggle(option.value, checked === true)
                }
                onBlur={field.handleBlur}
                disabled={disabled || option.disabled}
                aria-invalid={invalid}
                {...(describedBy ? { "aria-describedby": describedBy } : {})}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {description ? (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      ) : null}
      {invalid && errorMsg ? (
        <FieldError id={errorId}>{errorMsg}</FieldError>
      ) : null}
    </Field>
  );
}
