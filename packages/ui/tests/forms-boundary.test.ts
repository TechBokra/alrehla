import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const formsRoot = resolve(import.meta.dirname, '../src/components/forms');

const walk = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });

describe('@alrehla/ui forms boundary', () => {
  it('keeps presentation components independent from form engines and app infrastructure', () => {
    const forbidden = /@alrehla\/(forms|admin-core|api|supabase|admin-panel|instructor-panel)|@clerk\/|next\/navigation|@tanstack\/react-form|react-hook-form|@hookform\/resolvers|(?:^|\/)apps\//;
    for (const path of walk(formsRoot)) expect(readFileSync(path, 'utf8')).not.toMatch(forbidden);
  });

  it('does not create a UI-to-Forms dependency cycle', () => {
    const packageJson = JSON.parse(readFileSync(resolve(formsRoot, '../../../package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    expect(packageJson.dependencies?.['@alrehla/forms']).toBeUndefined();
  });
});
