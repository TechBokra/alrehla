'use client';

import * as React from 'react';
import { useResource } from '@alrehla/admin-core/resource';
import { EmptyState } from '../layout/empty-state';
import {
  DataViewSwitcher,
  type DataViewRendererProps,
  type DataViewSwitcherVisibility,
  useDataViewPresentation,
} from '../data-view';

export interface ResourceDataViewProps<TData = unknown> {
  renderRowActions?: (record: TData) => React.ReactNode;
  emptyState?: React.ReactNode;
  showViewSwitcher?: DataViewSwitcherVisibility;
}

export function ResourceDataView<TData = unknown>({
  renderRowActions,
  emptyState,
  showViewSwitcher = 'auto',
}: ResourceDataViewProps<TData> = {}) {
  const { dataView } = useResource<TData>();
  const presentation = useDataViewPresentation();
  const Renderer = presentation.renderer?.renderer as
    | React.ComponentType<DataViewRendererProps<TData>>
    | undefined;

  return (
    <div className="space-y-3">
      <DataViewSwitcher visibility={showViewSwitcher} />
      {Renderer && presentation.rendererAvailable ? (
        <React.Suspense fallback={<div className="rounded-xl border p-8 text-center text-muted-foreground">جارٍ تحميل طريقة العرض...</div>}>
          <Renderer
            dataView={dataView}
            effectiveCapabilities={presentation.effectiveCapabilities}
            {...(renderRowActions ? { renderRowActions } : {})}
            {...(emptyState ? { emptyState } : {})}
          />
        </React.Suspense>
      ) : (
        <EmptyState
          title="طريقة العرض غير متاحة حالياً"
          description={`لا يمكن تحميل طريقة العرض «${presentation.activeView}» في هذه الواجهة.`}
          className="border"
        />
      )}
    </div>
  );
}
