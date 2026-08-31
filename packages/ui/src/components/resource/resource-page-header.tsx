import * as React from 'react';
import { cn } from '../../lib/utils';

export function ResourcePageHeader({ title, description, icon: Icon, actions, className }: { title: React.ReactNode; description?: React.ReactNode; icon?: React.ElementType<{ className?: string }>; actions?: React.ReactNode; className?: string }) {
  return <header className={cn('flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between', className)}><div className="space-y-2"><h1 className="flex items-center gap-2 text-2xl font-extrabold text-foreground md:text-3xl">{Icon ? <Icon className="h-6 w-6" /> : null}{title}</h1>{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}</div>{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}</header>;
}
