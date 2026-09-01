import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
  }).filter((path) => /\.(ts|tsx)$/.test(path));
}

describe('Admin Core framework boundary', () => {
  it('does not import framework, backend, UI, form, or application concerns', () => {
    const source = sourceFiles(join(packageRoot, 'src'))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');
    expect(source).not.toMatch(/(?:from|import\()\s*['"](?:next\/|@clerk\/|@fullcalendar\/|temporal-polyfill|@alrehla\/(?:ui|forms|api|supabase)|react-query|@tanstack\/react-query\/src)/);
    expect(source).not.toMatch(/(?:^|['"/])apps\//m);
    expect(source).not.toMatch(/from\s*['"]@sentry\//);
  });

  it('keeps the package dependency boundary free of Next, Clerk, and application packages', () => {
    const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.peerDependencies,
    };
    expect(Object.keys(dependencies)).not.toEqual(expect.arrayContaining([
      'next',
      '@alrehla/auth',
      '@alrehla/api',
      '@alrehla/supabase',
      '@alrehla/ui',
      '@alrehla/forms',
      '@clerk/nextjs',
      '@fullcalendar/react',
      'temporal-polyfill',
    ]));
  });
});
