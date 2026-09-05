"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import { Field, FieldLabel, FieldDescription, FieldError } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { RichTextField } from "../../fields/core/rich-text-field";

export interface FormRichTextProps extends FormFieldPresentationProps {
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  dir?: "ltr" | "rtl" | "auto" | undefined;
  minHeight?: string | number | undefined;
}

export function FormRichText({
  label,
  description,
  required,
  placeholder,
  disabled,
  readOnly,
  dir,
  minHeight,
  className,
}: FormRichTextProps) {
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
      <RichTextField
        id={field.name}
        value={field.state.value || ""}
        onChange={(val) => field.handleChange(val)}
        onBlur={() => field.handleBlur()}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        dir={dir}
        minHeight={minHeight}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
