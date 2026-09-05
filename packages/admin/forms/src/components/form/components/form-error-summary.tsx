"use client";

import * as React from "react";
import { useStore } from "@tanstack/react-form";
import { AlertCircle } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { useFormContext } from "../context";
import { focusFormField } from "../../forms/core/focus-field";
import {
  normalizeFormErrors,
  type FormErrorEntry,
} from "../../forms/core/form-errors";

export interface FormErrorSummaryProps {
  form?: any;
  className?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  action?: React.ReactNode | undefined;
  getFieldLabel?: ((fieldPath: string) => React.ReactNode) | undefined;
  onSelectField?:
    ((fieldPath: string, entry: FormErrorEntry) => void) | undefined;
}

export function formatFieldPathLabel(fieldPath: string): string {
  if (!fieldPath) return "Form";
  return fieldPath
    .replace(/\[(\d+)\]/g, (_, index) => ` ${Number(index) + 1}`)
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FormErrorSummary({
  form: formProp,
  className,
  title = "Please fix the following errors before saving:",
  description,
  action,
  getFieldLabel,
  onSelectField,
}: FormErrorSummaryProps) {
  const form = useFormContext(formProp);
  if (!form) return null;

  return (
    <FormErrorSummaryInner
      form={form}
      className={className}
      title={title}
      description={description}
      action={action}
      getFieldLabel={getFieldLabel}
      onSelectField={onSelectField}
    />
  );
}

function FormErrorSummaryInner({
  form,
  className,
  title = "Please fix the following errors before saving:",
  description,
  action,
  getFieldLabel,
  onSelectField,
}: FormErrorSummaryProps & { form: any }) {
  const errorMap = useStore(form.store, (state: any) => state?.errorMap);
  const fieldMeta = useStore(form.store, (state: any) => state?.fieldMeta);
  const isSubmitted = useStore(form.store, (state: any) => state?.isSubmitted);
  const submissionAttempts = useStore(
    form.store,
    (state: any) => state?.submissionAttempts
  );

  const errorEntries = normalizeFormErrors({ errorMap, fieldMeta });
  if (errorEntries.length === 0) return null;

  const hasSubmitted =
    Boolean(isSubmitted) ||
    (typeof submissionAttempts === "number" && submissionAttempts > 0);
  const hasServerOrFormErrors = errorEntries.some(
    (entry) => entry.source === "server" || entry.source === "form"
  );

  if (!hasSubmitted && !hasServerOrFormErrors) {
    return null;
  }

  const fieldCount = errorEntries.filter((entry) =>
    Boolean(entry.fieldPath)
  ).length;
  const globalCount = errorEntries.filter((entry) => !entry.fieldPath).length;

  let countDescription = description;
  if (!countDescription) {
    if (fieldCount > 0) {
      countDescription = `${fieldCount} ${fieldCount === 1 ? "field needs" : "fields need"} your attention.`;
    } else if (globalCount > 0) {
      countDescription = `${globalCount} ${globalCount === 1 ? "issue needs" : "issues need"} your attention.`;
    }
  }

  const displayField = (entry: FormErrorEntry) => {
    if (!entry.fieldPath) return "Form";
    return (
      getFieldLabel?.(entry.fieldPath) ?? formatFieldPathLabel(entry.fieldPath)
    );
  };

  const handleSelectField = (entry: FormErrorEntry) => {
    if (!entry.fieldPath) return;
    if (onSelectField) {
      onSelectField(entry.fieldPath, entry);
    } else {
      focusFormField(entry.fieldPath);
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive space-y-2 text-sm",
        className
      )}
    >
      <div className="flex items-start space-x-2 font-medium">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5 flex-1">
          <div className="font-semibold text-sm leading-tight">{title}</div>
          {countDescription ? (
            <div className="text-xs opacity-90">{countDescription}</div>
          ) : null}
        </div>
      </div>

      <ul className="list-disc list-inside space-y-1 text-xs opacity-90 pl-1 max-h-48 overflow-y-auto">
        {errorEntries.map((entry, index) => {
          const isActionable = Boolean(entry.fieldPath);
          return (
            <li
              key={`${entry.fieldPath ?? "form"}-${index}-${entry.message}`}
              className="leading-normal"
            >
              {isActionable ? (
                <button
                  type="button"
                  onClick={() => handleSelectField(entry)}
                  className="text-left font-normal text-destructive hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs cursor-pointer inline transition-colors"
                >
                  <strong className="font-semibold">
                    {displayField(entry)}:
                  </strong>{" "}
                  <span>{entry.message}</span>
                </button>
              ) : (
                <span>
                  <strong className="font-semibold">
                    {displayField(entry)}:
                  </strong>{" "}
                  <span>{entry.message}</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
