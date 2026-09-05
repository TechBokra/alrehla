"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import { Field, FieldLabel, FieldDescription, FieldError } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { Switch } from "@eng-mohamedelsayed/admin-ui/components/ui/switch";

export interface FormSwitchProps extends FormFieldPresentationProps {
  disabled?: boolean | undefined;
}

export function FormSwitch({ label, description, required, disabled, className }: FormSwitchProps) {
  const field = useFieldContext<boolean>();
  const invalid = !field.state.meta.isValid;
  const errorMsg = normalizeFieldErrors(field.state.meta.errors);

  return (
    <Field data-invalid={invalid} className={className}>
      <div className="flex items-center justify-between space-x-2 rounded-lg border p-3 bg-card shadow-2xs">
        <div className="space-y-0.5">
          {label && (
            <FieldLabel htmlFor={field.name} className="text-sm font-medium cursor-pointer">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FieldLabel>
          )}
          {description && <FieldDescription>{description}</FieldDescription>}
        </div>
        <Switch
          id={field.name}
          checked={!!field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked)}
          disabled={disabled}
        />
      </div>
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
