import * as React from "react";
import { cn } from "../../lib/utils";
import { ResourceProvider } from "@eng-mohamedelsayed/admin-core/resource";
import type {
  ResourceDefinition,
  ResourceListResult,
} from "@eng-mohamedelsayed/admin-core/resource";
import { ResourceViewRuntime } from "../resource/resource-data-view";

export interface ResourcePageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType<{ className?: string }>;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  className?: string;
}

export function ResourcePageHeader({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryActions,
  className,
}: ResourcePageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          {Icon ? <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" /> : null}
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {secondaryActions}
        {primaryAction}
      </div>
    </div>
  );
}

export interface ResourceToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export function ResourceToolbar({ children, className }: ResourceToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
      {children}
    </div>
  );
}

export interface ResourcePageProps<
  TData = unknown,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = Record<string, string>,
  TDeleteInput = string,
> {
  children: React.ReactNode;
  className?: string;
  resource?: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >;
  initialData?: TQueryRaw;
}

export function ResourcePage<
  TData = unknown,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = Record<string, string>,
  TDeleteInput = string,
>({ children, className, resource, initialData }: ResourcePageProps<TData, TCreateInput, TUpdateInput, TQueryRaw, TValue, TImport, TDeleteInput>) {
  const content = (
    <div className={cn("space-y-6 max-w-7xl mx-auto w-full", className)}>
      {children}
    </div>
  );

  if (!resource) return content;

  return (
    <ResourceProvider
      definition={resource}
      {...(initialData ? { initialData } : {})}
    >
      <ResourceViewRuntime>{content}</ResourceViewRuntime>
    </ResourceProvider>
  );
}
