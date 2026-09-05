import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  error?: Error | null;
  showErrorMessage?: boolean;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading this section.",
  error,
  showErrorMessage = false,
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "relative flex flex-col items-center justify-center p-8 text-center rounded-2xl",
        "border border-destructive/20 bg-card shadow-lg overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Subtle top glow accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-destructive/50 to-transparent" />

      {/* Icon badge */}
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
        {/* Outer glow ring */}
        <span className="absolute inset-0 rounded-full bg-destructive/10 animate-pulse" />
        {/* Inner ring */}
        <span className="absolute inset-1.5 rounded-full bg-destructive/15 border border-destructive/20" />
        <AlertTriangle className="relative h-7 w-7 text-destructive drop-shadow-sm" />
      </div>

      {/* Status chip */}
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/8 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-destructive">
        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
        Error
      </span>

      <h3 className="text-base font-semibold tracking-tight text-foreground leading-snug">
        {title}
      </h3>
      <p className="mt-1.5 mb-5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {showErrorMessage && error?.message ? error.message : description}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Try again</span>
        </Button>
      )}

      {/* Subtle bottom glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-destructive/20 to-transparent" />
    </div>
  );
}
