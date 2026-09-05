"use client";

import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import { Field, FieldError } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { MetadataEditor, type MetadataValue } from "../../data/metadata-editor";

export interface FormMetadataProps extends FormFieldPresentationProps {
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
}

export function FormMetadata({
  label,
  description,
  disabled,
  readOnly,
  className,
}: FormMetadataProps) {
  const field = useFieldContext<MetadataValue>();
  const errorMsg = normalizeFieldErrors(field.state.meta.errors);

  return (
    <Field data-invalid={!field.state.meta.isValid} className={className}>
      <MetadataEditor
        id={field.name}
        value={field.state.value ?? {}}
        onChange={(value) => field.handleChange(value)}
        disabled={disabled}
        readOnly={readOnly}
      />
      {(label || description) && (
        <p className="text-sm text-muted-foreground">
          {label}
          {label && description ? " — " : ""}
          {description}
        </p>
      )}
      {errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
