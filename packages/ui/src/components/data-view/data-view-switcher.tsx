'use client';

import * as React from 'react';
import { Button } from '../ui/button';
import {
  useDataViewPresentation,
  type DataViewPresentationContextValue,
} from './presentation-provider';

export type DataViewSwitcherVisibility = 'auto' | 'always' | 'never';

export function DataViewSwitcher({
  visibility = 'auto',
}: {
  visibility?: DataViewSwitcherVisibility;
}) {
  const presentation = useDataViewPresentation();
  const shouldRender = visibility !== 'never' && presentation.usableViews.length > 0 && (
    visibility === 'always' || presentation.usableViews.length > 1
  );
  if (!shouldRender) return null;
  return <DataViewSwitcherButtons presentation={presentation} />;
}

function DataViewSwitcherButtons({
  presentation,
}: {
  presentation: DataViewPresentationContextValue;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/20 p-1" role="group" aria-label="طريقة العرض">
      {presentation.usableRenderers.map((renderer) => {
        const view = renderer.id;
        return (
          <Button
            key={view}
            type="button"
            size="sm"
            variant={presentation.activeView === view ? 'secondary' : 'ghost'}
            aria-pressed={presentation.activeView === view}
            onClick={() => presentation.onViewChange(view)}
          >
            {renderer.icon ? <renderer.icon className="me-1 h-4 w-4" /> : null}
            {renderer.label}
          </Button>
        );
      })}
    </div>
  );
}
