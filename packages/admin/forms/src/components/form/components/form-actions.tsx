"use client";

import * as React from "react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import { ResetButton } from "./reset-button";
import { SubmitButton } from "./submit-button";

export interface FormActionsProps {
  children?: React.ReactNode;
  className?: string | undefined;
  align?: "start" | "center" | "end" | "between" | undefined;
  submitLabel?: string;
  cancelLabel?: string;
  resetLabel?: string;
  onCancel?: () => void;
  showReset?: boolean;
  isPending?: boolean;
}

export function FormActions({
  children,
  className,
  align = "end",
  submitLabel = "Save",
  cancelLabel = "Cancel",
  resetLabel = "Reset",
  onCancel,
  showReset = false,
  isPending = false,
}: FormActionsProps) {
  const alignClass = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  }[align];

  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 mt-6 flex items-center gap-3 border-t bg-background/95 py-4 backdrop-blur",
        alignClass,
        className
      )}
    >
      {children ?? (
        <>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              {cancelLabel}
            </Button>
          )}
          {showReset && <ResetButton disabled={isPending}>{resetLabel}</ResetButton>}
          <SubmitButton disabled={isPending}>{submitLabel}</SubmitButton>
        </>
      )}
    </div>
  );
}
