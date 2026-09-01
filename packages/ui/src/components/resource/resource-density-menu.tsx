'use client';

import { useResource, type ResourceDensity } from '@alrehla/admin-core/resource';
import { useDataViewPresentation } from '../data-view/presentation-provider';

export function ResourceDensityMenu() {
  const { density, setDensity } = useResource();
  const { effectiveCapabilities } = useDataViewPresentation();
  if (!effectiveCapabilities.density) return null;
  return <select value={density} onChange={(event) => setDensity(event.target.value as ResourceDensity)} aria-label="كثافة الصفوف" className="h-8 rounded border bg-background px-2 text-xs"><option value="compact">مضغوط</option><option value="comfortable">مريح</option><option value="spacious">واسع</option></select>;
}
