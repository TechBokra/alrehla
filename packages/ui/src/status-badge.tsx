import { Circle } from 'lucide-react';
import { StatusBadge as BaseStatusBadge, type StatusBadgeProps } from './components/data-display/status-badge';

export default function StatusBadge({ showIcon, icon, ...props }: StatusBadgeProps) {
  return <BaseStatusBadge showIcon={showIcon} icon={icon ?? <Circle className="h-2 w-2 fill-current" />} {...props} />;
}

export { BaseStatusBadge as StatusBadge };
export type { StatusBadgeProps };
