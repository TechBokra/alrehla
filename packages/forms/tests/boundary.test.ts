import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = resolve(import.meta.dirname, '../src');

const sourceFiles = ['core', 'adapters', 'validators'].flatMap((directory) => {
  const entries = ['app-form.tsx', 'contexts.tsx', 'core-form.tsx', 'errors.ts', 'focus-field.ts', 'form-sections.ts', 'form-state.ts', 'form-submit-state.tsx', 'index.ts', 'server-errors.ts', 'types.ts', 'fields.tsx', 'zod.ts'];
  return entries.map((entry) => resolve(sourceRoot, directory, entry));
}).filter((path) => {
  try { readFileSync(path); return true; } catch { return false; }
});

describe('@alrehla/forms package boundary', () => {
  it('does not import framework, UI application, or domain infrastructure', () => {
    const forbidden = /@clerk\/|next\/|@alrehla\/(admin-core|api|supabase)|@tanstack\/react-query|react-hook-form|@hookform\/resolvers|@sentry\/|(?:^|\/)apps\//;
    for (const file of sourceFiles) expect(readFileSync(file, 'utf8')).not.toMatch(forbidden);
  });

  it('does not make Forms depend on Resource Core', () => {
    const packageJson = JSON.parse(readFileSync(resolve(sourceRoot, '../package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    expect(packageJson.dependencies?.['@alrehla/admin-core']).toBeUndefined();
  });
});
