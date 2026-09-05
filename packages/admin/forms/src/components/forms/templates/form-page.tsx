import * as React from "react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { FormHeaderTitle } from "../form-header";

export interface FormPageProps {
  title: string;
  icon?: React.ElementType<{ className?: string }>;
  description?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormPage({
  title,
  icon: Icon,
  description,
  breadcrumbs,
  actions,
  sidebar,
  footer,
  children,
  className,
}: FormPageProps) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl space-y-6", className)}>
      {breadcrumbs && <div className="text-sm text-muted-foreground">{breadcrumbs}</div>}
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            <FormHeaderTitle icon={Icon}>{title}</FormHeaderTitle>
          </h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>

      <div className={cn("grid gap-6", sidebar && "lg:grid-cols-[minmax(0,1fr)_18rem]")}>
        <main className="min-w-0 space-y-6">{children}</main>
        {sidebar && <aside className="min-w-0 space-y-6">{sidebar}</aside>}
      </div>

      {footer && (
        <footer className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
          {footer}
        </footer>
      )}
    </div>
  );
}
