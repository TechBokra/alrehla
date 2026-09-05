"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import { Field, FieldLabel, FieldDescription, FieldError } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@eng-mohamedelsayed/admin-ui/components/ui/select";

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

export interface FormSelectProps extends FormFieldPresentationProps {
  options: FormSelectOption[];
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
}

export function FormSelect({ label, description, required, options, placeholder = "Select an option", disabled, className }: FormSelectProps) {
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
      <Select
        {...(field.state.value ? { value: field.state.value } : {})}
        onValueChange={(val) => field.handleChange(val)}
        {...(disabled ? { disabled: true } : {})}
      >
        <SelectTrigger id={field.name} onBlur={field.handleBlur}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} {...(opt.disabled ? { disabled: true } : {})}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
