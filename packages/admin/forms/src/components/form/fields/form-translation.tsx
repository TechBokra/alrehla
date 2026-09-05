"use client";

import { useFieldContext, normalizeFieldErrors } from "../context";
import type { FormFieldPresentationProps } from "../types";
import { Field, FieldDescription, FieldError } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import {
  TranslationField,
  type LanguageOption,
  type TranslationValue,
} from "../../fields/core/translation-field";

export interface FormTranslationProps extends FormFieldPresentationProps {
  languages?: LanguageOption[] | undefined;
  type?: "input" | "textarea" | "richText" | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
}

export function FormTranslation({
  label,
  description,
  required,
  languages,
  type,
  placeholder,
  disabled,
  readOnly,
  className,
}: FormTranslationProps) {
  const field = useFieldContext<TranslationValue>();
  const invalid = !field.state.meta.isValid;
  const errorMsg = normalizeFieldErrors(field.state.meta.errors);

  return (
    <Field data-invalid={invalid} className={className}>
      <TranslationField
        id={field.name}
        label={typeof label === "string" ? label : undefined}
        languages={languages}
        type={type}
        value={field.state.value ?? {}}
        onChange={(value) => field.handleChange(value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
      />
      {required && <span className="sr-only">Required</span>}
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
