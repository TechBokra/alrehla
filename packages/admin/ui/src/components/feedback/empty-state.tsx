import * as React from "react";
import { FolderOpen, SearchX } from "lucide-react";
import { cn } from "../../lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title = "No data found",
  description = "There are no records available to display.",
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50",
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 mb-4 text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function SearchEmptyState({
  title = "No search results",
  description = "No records matched your search parameters. Try adjusting your query or resetting filters.",
  action,
  ...props
}: Omit<EmptyStateProps, "icon">) {
  return (
    <EmptyState
      icon={SearchX}
      title={title}
      description={description}
      action={action}
      {...props}
    />
  );
}
