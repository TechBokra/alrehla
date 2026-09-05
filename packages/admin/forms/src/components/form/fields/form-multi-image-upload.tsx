"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import { Field, FieldLabel, FieldDescription, FieldError } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { MultiImageUploadField } from "../../fields/media/multi-image-upload-field";
import type { ImageAsset } from "@eng-mohamedelsayed/admin-ui/components/media";

export interface FormMultiImageUploadProps extends FormFieldPresentationProps {
  maxFiles?: number | undefined;
  disabled?: boolean | undefined;
}

export function FormMultiImageUpload({ label, description, required, maxFiles = 10, disabled, className }: FormMultiImageUploadProps) {
  const field = useFieldContext<ImageAsset[]>();
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
      <MultiImageUploadField
        id={field.name}
        value={field.state.value || []}
        onChange={(assets) => field.handleChange(assets)}
        onBlur={field.handleBlur}
        maxFiles={maxFiles}
        disabled={disabled}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
