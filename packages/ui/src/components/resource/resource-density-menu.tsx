'use client';

import { useResource, type ResourceDensity } from '@alrehla/admin-core/resource';

export function ResourceDensityMenu() {
  const { density, setDensity } = useResource();
  return <select value={density} onChange={(event) => setDensity(event.target.value as ResourceDensity)} aria-label="كثافة الصفوف" className="h-8 rounded border bg-background px-2 text-xs"><option value="compact">مضغوط</option><option value="comfortable">مريح</option><option value="spacious">واسع</option></select>;
}
