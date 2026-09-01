'use client';

import { useResource } from '@alrehla/admin-core/resource';
import { Button } from '../ui/button';
import { useDataViewPresentation } from '../data-view/presentation-provider';

export function ResourcePagination() {
  const { dataView, definition } = useResource();
  const { effectiveCapabilities } = useDataViewPresentation();
  if (!effectiveCapabilities.pagination) return null;
  const pageSizeOptions = dataView.pageSizeOptions;
  const page = dataView.state.pagination.pageIndex + 1;
  const totalPages = Math.max(1, dataView.pageCount);
  if (totalPages <= 1 && dataView.rowCount <= dataView.state.pagination.pageSize) return null;
  return <div data-testid="resource-pagination" className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3 text-sm sm:flex-row"><span className="text-muted-foreground">صفحة {page} من {totalPages} (إجمالي {dataView.rowCount} سجل)</span><div className="flex items-center gap-2"><select value={dataView.state.pagination.pageSize} onChange={(event) => dataView.onPaginationChange({ pageIndex: 0, pageSize: Number(event.target.value) })} className="h-8 rounded border bg-background px-2 text-xs">{pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}</select><Button size="sm" variant="outline" disabled={page <= 1 || dataView.loading} onClick={() => dataView.onPaginationChange({ ...dataView.state.pagination, pageIndex: page - 2 })}>السابق</Button><Button size="sm" variant="outline" disabled={page >= totalPages || dataView.loading} onClick={() => dataView.onPaginationChange({ ...dataView.state.pagination, pageIndex: page })}>التالي</Button></div></div>;
}
