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
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
  info: 'info',
  muted: 'muted',
  outline: 'outline',
  secondary: 'secondary',
};

function StatusBadge({ status, children, variant = 'secondary', icon, showIcon = false, className, ...props }: StatusBadgeProps) {
  const content = children ?? status;
  if (!content) return null;

  return (
    <Badge variant={statusVariantMap[variant]} className={cn('gap-1.5 whitespace-nowrap', className)} {...props}>
      {showIcon && icon}
      {content}
    </Badge>
  );
}

export { StatusBadge };
export default StatusBadge;
