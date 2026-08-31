import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourceDirectory = fileURLToPath(new URL('../src', import.meta.url));
const packageFile = fileURLToPath(new URL('../package.json', import.meta.url));

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') ? [path] : [];
  });

describe('api-client package boundary', () => {
  it('has no framework, UI, query-runtime, or monitoring imports', () => {
    const source = sourceFiles(sourceDirectory)
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');
    const forbiddenImports = [
      '@clerk/',
      'next/',
      'from \'react\'',
      "from 'react'",
      '@tanstack/react-query',
      '@alrehla/ui',
      '@alrehla/forms',
      '@alrehla/admin-core',
      'Sentry',
      '@sentry/',
    ];

    for (const forbiddenImport of forbiddenImports) {
      expect(source, `forbidden api-client dependency: ${forbiddenImport}`).not.toContain(forbiddenImport);
    }
  });

  it('declares only framework-independent runtime dependencies', () => {
    const packageText = readFileSync(packageFile, 'utf8');
    const forbiddenDependencies = [
      '@clerk/',
      'next',
      'react',
      '@tanstack/react-query',
      '@alrehla/ui',
      '@alrehla/forms',
      '@alrehla/admin-core',
      '@sentry/',
    ];

    for (const forbiddenDependency of forbiddenDependencies) {
      expect(packageText, `forbidden api-client dependency: ${forbiddenDependency}`).not.toContain(forbiddenDependency);
    }
  });
});
