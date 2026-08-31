'use client';

import * as React from 'react';
import { useResource } from '@alrehla/admin-core/resource';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function ResourceBulkActionBar<TData = unknown>({ className }: { className?: string }) {
  const { dataView } = useResource<TData>();
  const rows = [...dataView.selectedRows];
  const [pending, setPending] = React.useState(false);
  if (!rows.length || !dataView.bulkActions.length) return null;
  return <div className={cn('flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2', className)}><span className="text-sm font-bold text-primary">{rows.length} محدد</span>{dataView.bulkActions.map((action) => <Button key={action.id} size="sm" variant={action.variant ?? 'outline'} disabled={pending || action.disabled?.(rows)} onClick={async () => { if (action.confirmation && !window.confirm(String(action.confirmation.description ?? 'هل أنت متأكد؟'))) return; setPending(true); try { await action.execute(rows); } catch { /* mutation feedback is handled by the shared mutation core. */ } finally { setPending(false); } }}>{action.icon ? <action.icon className="me-2 h-4 w-4" /> : null}{action.label}</Button>)}</div>;
}
