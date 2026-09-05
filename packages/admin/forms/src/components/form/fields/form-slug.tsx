"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { SlugField, type SlugAvailability } from "../../fields/core/slug-field";

export interface FormSlugProps extends FormFieldPresentationProps {
  sourceValue?: string | undefined;
  prefix?: string | undefined;
  placeholder?: string | undefined;
  availability?: SlugAvailability | undefined;
  onCheckAvailability?:
    | ((slug: string) => Promise<boolean> | boolean)
    | undefined;
  checkOnBlur?: boolean | undefined;
  initialSlug?: string | undefined;
  disabled?: boolean | undefined;
}

export function FormSlug({
  label,
  description,
  required,
  sourceValue,
  prefix = "/products/",
  placeholder,
  availability,
  onCheckAvailability,
  checkOnBlur,
  initialSlug,
  disabled,
  className,
}: FormSlugProps) {
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
      <SlugField
        id={field.name}
        value={field.state.value || ""}
        sourceValue={sourceValue}
        onChange={(val) => field.handleChange(val)}
        onBlur={() => field.handleBlur()}
        prefix={prefix}
        placeholder={placeholder}
        availability={availability}
        onCheckAvailability={onCheckAvailability}
        checkOnBlur={checkOnBlur}
        initialSlug={initialSlug}
        disabled={disabled}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
