import * as React from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

export interface UnauthorizedStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onSignIn?: () => void;
}

export function UnauthorizedState({
  title = "Session expired",
  description = "Your admin session is no longer available. Sign in again to continue.",
  action,
  onSignIn,
  className,
  ...props
}: UnauthorizedStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl",
        "border border-amber-500/25 bg-card p-8 text-center shadow-lg overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Ambient top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-500/60 to-transparent" />

      {/* Icon badge */}
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse" />
        <span className="absolute inset-1.5 rounded-full bg-amber-500/15 border border-amber-500/25" />
        <LockKeyhole className="relative h-7 w-7 text-amber-600 dark:text-amber-400 drop-shadow-sm" />
      </div>

      {/* Status chip */}
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Session Expired
      </span>

      <h3 className="text-base font-semibold tracking-tight text-foreground leading-snug">
        {title}
      </h3>
      <p className="mt-1.5 mb-5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {action ??
        (onSignIn ? (
          <Button
            size="sm"
            onClick={onSignIn}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in again
          </Button>
        ) : null)}

      {/* Ambient bottom accent */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-amber-500/25 to-transparent" />
    </div>
  );
}
