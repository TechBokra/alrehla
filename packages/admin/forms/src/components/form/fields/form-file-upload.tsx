"use client";

import * as React from "react";
import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import { Field, FieldLabel, FieldDescription, FieldError } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { FileUploadField } from "../../fields/media/file-upload-field";
import type { UploadedAsset } from "@eng-mohamedelsayed/admin-ui/components/media";

export interface FormFileUploadProps extends FormFieldPresentationProps {
  accept?: string | undefined;
  maxSizeBytes?: number | undefined;
  disabled?: boolean | undefined;
}

export function FormFileUpload({ label, description, required, accept, maxSizeBytes, disabled, className }: FormFileUploadProps) {
  const field = useFieldContext<UploadedAsset | string | undefined>();
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
      <FileUploadField
        id={field.name}
        value={field.state.value}
        onChange={(asset) => field.handleChange(asset)}
        onBlur={field.handleBlur}
        accept={accept}
        maxSizeBytes={maxSizeBytes}
        disabled={disabled}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
