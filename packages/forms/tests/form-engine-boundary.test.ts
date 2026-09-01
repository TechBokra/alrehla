import { readdirSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const applicationsRoot = resolve(repositoryRoot, 'apps');

const legacyAllowlist = new Set([
  'apps/admin-panel/src/components/shared/ShippingAddressForm.tsx',
  'apps/marketplace/src/components/order/form-types.ts',
  'apps/marketplace/src/features/enha-lak-order/hooks/useOrderPage.ts',
  'apps/marketplace/src/features/enha-lak-subscription/hooks/useSubscriptionPage.ts',
  'apps/student-panel/src/components/order/form-types.ts',
  'apps/student-panel/src/features/enha-lak-order/templates/OrderPage.tsx',
]);

const walk = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });

describe('business form engine boundary', () => {
  it('allows only the documented legacy direct form-engine consumers', () => {
    const directEngineImport = /(?:from\s+|import\s*\()\s*['"](?:@tanstack\/react-form|react-hook-form|@hookform\/resolvers)(?:['"]|\/)/;
    const violations = walk(applicationsRoot)
      .filter((path) => directEngineImport.test(readFileSync(path, 'utf8')))
      .map((path) => relative(repositoryRoot, path))
      .filter((path) => !legacyAllowlist.has(path));

    expect(violations).toEqual([]);
  });

  it('keeps the legacy allowlist explicit and limited to audited files', () => {
    for (const path of legacyAllowlist) expect(statSync(resolve(repositoryRoot, path)).isFile()).toBe(true);
  });
});
