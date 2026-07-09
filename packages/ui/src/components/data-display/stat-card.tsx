import * as React from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

export interface StatCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

const trendStyles = {
  up: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  down: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  neutral: 'bg-muted text-muted-foreground',
};

function TrendIcon({ trend }: { trend: NonNullable<StatCardProps['trend']> }) {
  if (trend === 'up') return <ArrowUp className="h-3 w-3" />;
  if (trend === 'down') return <ArrowDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

const StatCard = React.forwardRef<HTMLElement, StatCardProps>(({ className, title, value, icon, description, trend, trendLabel, loading, onClick, ...props }, ref) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Card
      ref={ref}
      as={Component}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn('w-full text-start transition-colors', onClick && 'cursor-pointer hover:border-primary/50 hover:bg-muted/30', className)}
      {...props}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="rounded-md bg-muted p-2 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold tracking-tight">{value}</div>}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {trend && (
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium', trendStyles[trend])}>
              <TrendIcon trend={trend} />
              {trendLabel ?? trend}
            </span>
          )}
          {description && <span>{description}</span>}
        </div>
      </CardContent>
    </Card>
  );
});
StatCard.displayName = 'StatCard';

export { StatCard };
export default StatCard;
