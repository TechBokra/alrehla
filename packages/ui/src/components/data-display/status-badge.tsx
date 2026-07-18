import * as React from 'react';
import { Badge, type BadgeProps } from '../ui/badge';
import { cn } from '../../lib/utils';

export type StatusBadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'muted' | 'outline' | 'secondary';

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status?: React.ReactNode;
  variant?: StatusBadgeVariant;
  icon?: React.ReactNode;
  showIcon?: boolean;
}

const statusVariantMap: Record<StatusBadgeVariant, BadgeProps['variant']> = {
  default: 'default',
  success: 'secondary',
  warning: 'secondary',
  destructive: 'destructive',
  info: 'secondary',
  muted: 'secondary',
  outline: 'outline',
  secondary: 'secondary',
};

const customBadgeClasses: Record<StatusBadgeVariant, string> = {
  default: '',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  info: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
  muted: 'bg-muted text-muted-foreground border-transparent hover:bg-muted',
  destructive: '',
  outline: '',
  secondary: '',
};

function StatusBadge({ status, children, variant = 'secondary', icon, showIcon = false, className, ...props }: StatusBadgeProps) {
  const content = children ?? status;
  if (!content) return null;

  return (
    <Badge variant={statusVariantMap[variant]} className={cn('gap-1.5 whitespace-nowrap', customBadgeClasses[variant], className)} {...props}>
      {showIcon && icon}
      {content}
    </Badge>
  );
}

export { StatusBadge };
export default StatusBadge;
