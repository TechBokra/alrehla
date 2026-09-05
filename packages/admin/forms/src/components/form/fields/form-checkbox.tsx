"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import { Field, FieldLabel, FieldDescription, FieldError } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { Checkbox } from "@eng-mohamedelsayed/admin-ui/components/ui/checkbox";

export interface FormCheckboxProps extends FormFieldPresentationProps {
  disabled?: boolean | undefined;
}

export function FormCheckbox({ label, description, required, disabled, className }: FormCheckboxProps) {
  const field = useFieldContext<boolean>();
  const invalid = !field.state.meta.isValid;
  const errorMsg = normalizeFieldErrors(field.state.meta.errors);

  return (
    <Field data-invalid={invalid} className={className}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={field.name}
          checked={!!field.state.value}
          onCheckedChange={(checked) => field.handleChange(!!checked)}
          disabled={disabled}
        />
        {label && (
          <FieldLabel htmlFor={field.name} className="font-normal cursor-pointer select-none">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FieldLabel>
        )}
      </div>
      {description && <FieldDescription className="pl-6">{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError className="pl-6">{errorMsg}</FieldError>}
    </Field>
  );
}
