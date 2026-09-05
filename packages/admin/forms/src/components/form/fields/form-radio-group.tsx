"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import { Field, FieldLabel, FieldDescription, FieldError } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@eng-mohamedelsayed/admin-ui/components/ui/radio-group";

export interface FormRadioOption {
  value: string;
  label: string;
  description?: string | undefined;
}

export interface FormRadioGroupProps extends FormFieldPresentationProps {
  options: FormRadioOption[];
  disabled?: boolean | undefined;
}

export function FormRadioGroup({ label, description, required, options, disabled, className }: FormRadioGroupProps) {
  const field = useFieldContext<string>();
  const invalid = !field.state.meta.isValid;
  const errorMsg = normalizeFieldErrors(field.state.meta.errors);

  return (
    <Field data-invalid={invalid} className={className}>
      {label && (
        <FieldLabel>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FieldLabel>
      )}
      <RadioGroup
        value={field.state.value}
        onValueChange={(val) => field.handleChange(val)}
        disabled={disabled}
        className="space-y-2 pt-1"
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-start space-x-2">
            <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} className="mt-0.5" />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor={`${field.name}-${opt.value}`}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {opt.label}
              </label>
              {opt.description && (
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              )}
            </div>
          </div>
        ))}
      </RadioGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
