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
import { ImageUploadField } from "../../fields/media/image-upload-field";
import type { ImageAsset } from "@eng-mohamedelsayed/admin-ui/components/media";

export interface FormImageUploadProps extends FormFieldPresentationProps {
  disabled?: boolean | undefined;
  accept?: string | undefined;
  aspectRatio?: string | undefined;
  maxSizeBytes?: number | undefined;
}

export function FormImageUpload({
  label,
  description,
  required,
  disabled,
  accept,
  aspectRatio,
  maxSizeBytes,
  className,
}: FormImageUploadProps) {
  const field = useFieldContext<ImageAsset | string | undefined>();
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
      <ImageUploadField
        id={field.name}
        value={field.state.value}
        onChange={(asset) => field.handleChange(asset)}
        onBlur={field.handleBlur}
        disabled={disabled}
        accept={accept}
        aspectRatio={aspectRatio}
        maxSizeBytes={maxSizeBytes}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
