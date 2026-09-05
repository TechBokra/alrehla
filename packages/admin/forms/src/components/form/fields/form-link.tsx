"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import { Field, FieldLabel, FieldDescription, FieldError } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { LinkField } from "../../fields/core/link-field";

export interface FormLinkProps extends FormFieldPresentationProps {
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
}

export function FormLink({ label, description, required, placeholder, disabled, className }: FormLinkProps) {
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
      <LinkField
        id={field.name}
        value={field.state.value || ""}
        onChange={(val) => field.handleChange(val)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
