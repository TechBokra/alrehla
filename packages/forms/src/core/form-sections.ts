import type { FormErrorEntry } from './errors';

export interface FormSectionOwnership {
  id: string;
  fields?: readonly string[];
  fieldPrefixes?: readonly string[];
}

export interface FormErrorsBySection {
  errorsBySection: Record<string, FormErrorEntry[]>;
  errorCountBySection: Record<string, number>;
  firstInvalidSectionId?: string;
  unassignedErrors: FormErrorEntry[];
}

const matchesBoundary = (fieldPath: string, ownedPath: string): boolean =>
  fieldPath === ownedPath || fieldPath.startsWith(`${ownedPath}.`) || fieldPath.startsWith(`${ownedPath}[`);

export const formFieldBelongsToSection = (
  fieldPath: string,
  section: Pick<FormSectionOwnership, 'fields' | 'fieldPrefixes'>,
): boolean => [...(section.fields ?? []), ...(section.fieldPrefixes ?? [])].some((ownedPath) => matchesBoundary(fieldPath, ownedPath));

export const resolveFormErrorsBySection = (
  errors: readonly FormErrorEntry[],
  sections: readonly FormSectionOwnership[],
): FormErrorsBySection => {
  const errorsBySection: Record<string, FormErrorEntry[]> = {};
  const errorCountBySection: Record<string, number> = {};
  for (const section of sections) {
    errorsBySection[section.id] = [];
    errorCountBySection[section.id] = 0;
  }

  const unassignedErrors: FormErrorEntry[] = [];
  for (const error of errors) {
    const section = error.fieldPath ? sections.find((candidate) => formFieldBelongsToSection(error.fieldPath!, candidate)) : undefined;
    if (!section) {
      unassignedErrors.push(error);
      continue;
    }
    errorsBySection[section.id]?.push(error);
    errorCountBySection[section.id] = (errorCountBySection[section.id] ?? 0) + 1;
  }

  const firstInvalidSectionId = sections.find((section) => (errorCountBySection[section.id] ?? 0) > 0)?.id;
  return {
    errorsBySection,
    errorCountBySection,
    ...(firstInvalidSectionId ? { firstInvalidSectionId } : {}),
    unassignedErrors,
  };
};
