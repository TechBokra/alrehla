"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { Input } from "@eng-mohamedelsayed/admin-ui/components/ui/input";
import { normalizeFieldErrors, useFieldContext } from "../context";
import type { FormFieldPresentationProps } from "../types";

export interface FormOrderProps
  extends Omit<
      React.ComponentProps<typeof Input>,
      "name" | "value" | "onChange" | "onBlur" | "type"
    >,
    FormFieldPresentationProps {
  min?: number;
  max?: number;
  step?: number;
  showSteppers?: boolean;
}

export function FormOrder({
  label = "Display order",
  description = "Lower numbers appear first within the same level.",
  required,
  min = 0,
  max,
  step = 1,
  showSteppers = true,
  placeholder = "0",
  className,
  disabled,
  ...props
}: FormOrderProps) {
  const field = useFieldContext<number | undefined>();
  const invalid = !field.state.meta.isValid;
  const errorMsg = normalizeFieldErrors(field.state.meta.errors);

  const currentValue = typeof field.state.value === "number" ? field.state.value : 0;

  const handleStep = (delta: number) => {
    let next = currentValue + delta;
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    field.handleChange(next);
  };

  return (
    <Field data-invalid={invalid} className={className}>
      {label && (
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FieldLabel>
      )}

      <div className="flex items-center gap-1.5">
        <Input
          id={field.name}
          name={field.name}
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          value={field.state.value ?? ""}
          onBlur={field.handleBlur}
          onChange={(e) => {
            const val =
              e.target.value === "" ? undefined : Number(e.target.value);
            field.handleChange(isNaN(val as number) ? undefined : val);
          }}
          aria-invalid={invalid}
          className="flex-1"
          {...props}
        />

        {showSteppers && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={disabled || (min !== undefined && currentValue <= min)}
              onClick={() => handleStep(-step)}
              aria-label="Decrease order"
              className="h-9 w-9 p-0"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={disabled || (max !== undefined && currentValue >= max)}
              onClick={() => handleStep(step)}
              aria-label="Increase order"
              className="h-9 w-9 p-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && errorMsg && <FieldError>{errorMsg}</FieldError>}
    </Field>
  );
}

export const FormRank = FormOrder;
