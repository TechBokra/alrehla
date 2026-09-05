import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "../ui/card";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ComponentType<{ className?: string }>;
}

export function MetricCard({
  title,
  value,
  description,
  delta,
  trend = "neutral",
  icon: Icon,
  className,
  ...props
}: MetricCardProps) {
  const isUp = trend === "up";
  const isDown = trend === "down";

  return (
    <Card className={cn("shadow-sm transition-all hover:shadow-md", className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
          {delta && (
            <div
              className={cn(
                "inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-md",
                isUp && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
                isDown && "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
                trend === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {isUp && <TrendingUp className="mr-1 h-3 w-3" />}
              {isDown && <TrendingDown className="mr-1 h-3 w-3" />}
              <span>{delta}</span>
            </div>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
