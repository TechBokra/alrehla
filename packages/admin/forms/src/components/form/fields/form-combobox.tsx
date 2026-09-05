"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import { Field, FieldLabel, FieldDescription, FieldError } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@eng-mohamedelsayed/admin-ui/components/ui/combobox";

export interface FormComboboxOption {
  value: string;
  label: string;
}

export interface FormComboboxProps extends FormFieldPresentationProps {
  options: FormComboboxOption[];
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
}

export function FormCombobox({
  label,
  description,
  required,
  options,
  placeholder = "Select option...",
  disabled,
  className,
}: FormComboboxProps) {
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
      <Combobox
        value={field.state.value ?? ""}
        onValueChange={(val) => field.handleChange(val as string)}
        {...(disabled ? { disabled: true } : {})}
      >
        <ComboboxInput
          id={field.name}
          placeholder={placeholder}
          showClear
          onBlur={field.handleBlur}
          aria-invalid={invalid}
        />
        <ComboboxContent>
          <ComboboxEmpty>No options found.</ComboboxEmpty>
          <ComboboxList>
            {options.map((option) => (
              <ComboboxItem key={option.value} value={option.value}>
                {option.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
