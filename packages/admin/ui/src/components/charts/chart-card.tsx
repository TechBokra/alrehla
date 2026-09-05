import * as React from "react";
import { cn } from "../../lib/utils";
import { EmptyState } from "../feedback/empty-state";
import { ErrorState } from "../feedback/error-state";
import { LoadingState } from "../feedback/loading-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
  loading?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  action,
  loading = false,
  error = null,
  isEmpty = false,
  emptyTitle = "No data to display",
  emptyDescription = "There is no chart data available for the selected period.",
  children,
  className,
  ...props
}: ChartCardProps) {
  return (
    <Card className={cn("shadow-sm", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </div>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState error={error} />
        ) : loading ? (
          <LoadingState label="Loading chart data..." className="min-h-[250px]" />
        ) : isEmpty ? (
          <EmptyState title={emptyTitle} description={emptyDescription} className="min-h-[250px]" />
        ) : (
          <div className="w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
