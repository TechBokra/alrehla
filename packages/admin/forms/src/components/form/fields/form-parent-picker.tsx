"use client";

import * as React from "react";
import {
  ParentPicker,
  type ParentEntity,
  type ParentPickerProps,
} from "../../fields/pickers/parent-picker";
import { Field, FieldDescription, FieldError, FieldLabel } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { normalizeFieldErrors, useFieldContext } from "../context";
import type { FormFieldPresentationProps } from "../types";

export interface FormParentPickerProps
  extends FormFieldPresentationProps,
    Omit<ParentPickerProps, "id" | "value" | "onChange" | "onBlur" | "className"> {}

export function FormParentPicker({
  label,
  description,
  required,
  placeholder,
  rootLabel,
  disabled,
  items,
  onSearch,
  currentId,
  excludeIds,
  allowClear,
  allowRoot,
  className,
}: FormParentPickerProps) {
  const field = useFieldContext<string | null | undefined>();
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
      <ParentPicker
        id={field.name}
        value={field.state.value}
        onChange={(val) => field.handleChange(val as string)}
        placeholder={placeholder}
        rootLabel={rootLabel}
        disabled={disabled}
        items={items}
        onSearch={onSearch}
        currentId={currentId}
        excludeIds={excludeIds}
        allowClear={allowClear}
        allowRoot={allowRoot}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}
