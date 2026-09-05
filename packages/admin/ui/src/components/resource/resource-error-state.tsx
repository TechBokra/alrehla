"use client";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  LockKeyhole,
  RotateCcw,
  X,
} from "lucide-react";
import type { ResourceErrorState as ResourceErrorModel } from "@eng-mohamedelsayed/admin-core/resource";
import { cn } from "../../lib/utils";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { UnauthorizedState } from "../feedback/unauthorized-state";

export interface ResourceErrorStateProps {
  state: ResourceErrorModel | null | undefined;
  onRetry?: (() => void) | undefined;
  className?: string | undefined;
}

export interface ResourceAccessDeniedStateProps {
  title?: string | undefined;
  description?: string | undefined;
  className?: string | undefined;
}

/** Restrained, non-alarming presentation for forbidden resource access. */
export function ResourceAccessDeniedState({
  title = "Access denied.",
  description = "You do not have permission to access this resource.",
  className,
}: ResourceAccessDeniedStateProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border/80 bg-card p-8 text-center shadow-xs",
        className
      )}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border/60">
        <LockKeyhole className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/**
 * Renders the canonical Resource-level error state based on ResourceErrorState contract.
 * Automatically delegates to UnauthorizedState, ResourceAccessDeniedState, or standard
 * restrained load error state with accessible retry controls.
 */
export function ResourceErrorState({
  state,
  onRetry,
  className,
}: ResourceErrorStateProps) {
  if (!state || state.error.type === "cancelled") return null;

  // Authentication expired
  if (state.error.type === "authentication") {
    return (
      <UnauthorizedState
        title={state.title}
        description={state.description}
        className={className}
      />
    );
  }

  // Authorization denied (forbidden)
  if (
    state.context === "authorization" ||
    state.error.type === "authorization"
  ) {
    return (
      <ResourceAccessDeniedState
        title={state.title}
        description={state.description}
        className={className}
      />
    );
  }

  const canRetry = Boolean(state.retryable && onRetry);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border/80 bg-card p-8 text-center shadow-xs",
        className
      )}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </div>

      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {state.title}
      </h3>
      <p className="mt-1.5 mb-5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {state.description}
      </p>

      {canRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2 text-xs font-medium"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Try again</span>
        </Button>
      )}
    </div>
  );
}

export interface ResourceErrorBannerProps extends ResourceErrorStateProps {
  onDismiss?: (() => void) | undefined;
}

/**
 * Non-blocking Resource feedback banner for background refetches, partial bulk operations,
 * and form/mutation surfaces.
 */
export function ResourceErrorBanner({
  state,
  onRetry,
  onDismiss,
  className,
}: ResourceErrorBannerProps) {
  if (!state || state.error.type === "cancelled") return null;

  const partial = state.partial;
  const summary = partial
    ? `${partial.succeededIds.length} succeeded, ${partial.failedIds.length} failed.`
    : undefined;

  const variant =
    state.severity === "warning"
      ? "warning"
      : state.severity === "error"
        ? "destructive"
        : "default";

  const isWarning = variant === "warning";
  const canRetry = Boolean(state.retryable && onRetry);

  return (
    <Alert
      variant={variant}
      className={cn(
        "flex items-start justify-between gap-3 text-left transition-all",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {isWarning ? (
          <AlertTriangle
            className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
        ) : (
          <AlertCircle
            className="h-4 w-4 text-destructive shrink-0 mt-0.5"
            aria-hidden="true"
          />
        )}
        <div className="space-y-0.5 min-w-0 flex-1">
          <AlertTitle className="text-sm font-semibold tracking-tight">
            {state.title}
          </AlertTitle>
          <AlertDescription className="text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground/90">
            {summary ? (
              <span className="font-medium text-foreground block sm:inline sm:mr-1">
                {summary}
              </span>
            ) : null}
            {state.description}
          </AlertDescription>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-center">
        {canRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="h-7 px-2.5 text-xs gap-1.5 font-medium border-border/80 hover:bg-background/80"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            <span>Retry</span>
          </Button>
        )}

        {onDismiss && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

export interface ResourceOperationFeedbackProps {
  error?: ResourceErrorModel | null | undefined;
  onRetry?: (() => void) | undefined;
  className?: string | undefined;
}

/** Contextual feedback wrapper for mutations and sub-resource operations. */
export function ResourceOperationFeedback({
  error,
  onRetry,
  className,
}: ResourceOperationFeedbackProps) {
  if (!error) return null;
  return (
    <ResourceErrorBanner
      state={error}
      onRetry={onRetry}
      className={className}
    />
  );
}
