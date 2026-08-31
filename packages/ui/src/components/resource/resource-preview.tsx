'use client';

import * as React from 'react';
import { useResource } from '@alrehla/admin-core/resource';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';

export function ResourcePreview<TData = unknown>({ children, title = 'معاينة' }: { children: (record: TData) => React.ReactNode; title?: React.ReactNode }) {
  const { previewRecord, closePreview } = useResource<TData>();
  return <Sheet open={Boolean(previewRecord)} onOpenChange={(open) => { if (!open) closePreview(); }}><SheetContent><SheetHeader><SheetTitle>{title}</SheetTitle></SheetHeader>{previewRecord ? children(previewRecord) : null}</SheetContent></Sheet>;
}
