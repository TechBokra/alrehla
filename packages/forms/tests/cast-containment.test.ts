import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const formsCoreRoot = resolve(repositoryRoot, 'packages/forms/src/core');
const applicationsRoot = resolve(repositoryRoot, 'apps');
const genericFormUiRoot = resolve(repositoryRoot, 'packages/ui/src/components/forms');

const walk = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });

const structuralCast = /as\s+unknown\s+as|as\s+CoreFormInstance\b/;
const formsImport = /from\s+['"]@alrehla\/forms(?:['"]|\/)/;

describe('Form Core cast containment', () => {
  it('keeps structural compatibility casts out of the Forms core implementation', () => {
    const violations = walk(formsCoreRoot)
      .filter((path) => structuralCast.test(readFileSync(path, 'utf8')))
      .map((path) => relative(repositoryRoot, path));

    expect(violations).toEqual([]);
  });

  it('keeps Forms consumers cast-free at the application boundary', () => {
    const violations = walk(applicationsRoot)
      .filter((path) => {
        const source = readFileSync(path, 'utf8');
        return formsImport.test(source) && structuralCast.test(source);
      })
      .map((path) => relative(repositoryRoot, path));

    expect(violations).toEqual([]);
  });

  it('keeps generic Form UI free of compatibility casts', () => {
    const violations = walk(genericFormUiRoot)
      .filter((path) => structuralCast.test(readFileSync(path, 'utf8')))
      .map((path) => relative(repositoryRoot, path));

    expect(violations).toEqual([]);
  });
});
