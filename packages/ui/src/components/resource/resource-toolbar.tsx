import * as React from 'react';
import { cn } from '../../lib/utils';

export function ResourceToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>;
}
