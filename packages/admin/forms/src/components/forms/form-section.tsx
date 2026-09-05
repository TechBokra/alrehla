import * as React from "react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({
  title,
  description,
  children,
  className,
  ...props
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {(title || description) && (
        <div className="space-y-1 pb-2 border-b">
          {title && (
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function FormGrid({
  columns = 2,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { columns?: 1 | 2 | 3 | 4 }) {
  const colsClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-1 md:grid-cols-3"
        : columns === 4
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 md:grid-cols-2";

  return (
    <div className={cn("grid gap-4", colsClass, className)} {...props}>
      {children}
    </div>
  );
}

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
  isDestructive?: boolean;
}

export function FormActions({
  submitText = "Save changes",
  cancelText = "Cancel",
  onCancel,
  loading = false,
  disabled = false,
  isDestructive = false,
  className,
  ...props
}: FormActionsProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t bg-background/95 py-4 backdrop-blur",
        className
      )}
      {...props}
    >
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelText}
        </Button>
      )}
      <Button
        type="submit"
        variant={isDestructive ? "destructive" : "default"}
        disabled={disabled || loading}
      >
        {loading ? "Saving..." : submitText}
      </Button>
    </div>
  );
}
