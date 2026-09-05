import * as React from "react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Separator } from "@eng-mohamedelsayed/admin-ui/components/ui/separator";

export interface FormHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FormHeader({
  title,
  description,
  actions,
  className,
}: FormHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

export function FormLayoutDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
}

export function FormDivider({ className }: { className?: string }) {
  return (
    <Separator
      orientation="horizontal"
      className={cn("h-px w-full bg-border", className)}
    />
  );
}

export function FormRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start",
        className
      )}
    >
      {children}
    </div>
  );
}

export function FormSidebar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <aside className={cn("space-y-4", className)}>{children}</aside>;
}
