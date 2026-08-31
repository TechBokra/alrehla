'use client';

import { SearchX } from 'lucide-react';
import { useResource } from '@alrehla/admin-core/resource';
import { Button } from '../ui/button';
import { EmptyState } from '../layout/empty-state';
import { ResourceCreate } from './resource-create';

export function ResourceEmptyState() {
  const { definition, dataView, capabilities } = useResource();
  const hasQuery = Boolean(dataView.state.search || Object.keys(dataView.state.filters).length);
  if (!hasQuery && !capabilities.create) return <EmptyState title={definition.emptyState?.title ?? 'لا توجد بيانات'} description={definition.emptyState?.description} />;
  return <EmptyState icon={hasQuery ? <SearchX className="h-6 w-6" /> : undefined} title={hasQuery ? 'لا توجد نتائج' : definition.emptyState?.title ?? 'لا توجد بيانات'} description={hasQuery ? 'لا توجد سجلات تطابق البحث أو الفلاتر الحالية.' : definition.emptyState?.description} action={hasQuery ? <Button variant="outline" onClick={dataView.onFiltersReset}>مسح الفلاتر</Button> : <ResourceCreate size="sm" />} />;
}
