"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import { Field, FieldLabel, FieldDescription, FieldError } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { Input } from "@eng-mohamedelsayed/admin-ui/components/ui/input";

export interface FormNumberProps extends Omit<React.ComponentProps<typeof Input>, "name" | "value" | "onChange" | "onBlur" | "type">, FormFieldPresentationProps {}

export function FormNumber({ label, description, required, className, ...props }: FormNumberProps) {
  const field = useFieldContext<number | undefined>();
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
        type="number"
        step="any"
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => {
          const val = e.target.value === "" ? undefined : Number(e.target.value);
          field.handleChange(isNaN(val as number) ? undefined : val);
        }}
        aria-invalid={invalid}
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
