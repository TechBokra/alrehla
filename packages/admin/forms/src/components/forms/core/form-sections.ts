import type { FormSectionOwnership } from "@eng-mohamedelsayed/admin-core/resource";
import type { FormErrorEntry } from "./form-errors";

export interface FormErrorsBySection {
  errorsBySection: Record<string, FormErrorEntry[]>;
  errorCountBySection: Record<string, number>;
  firstInvalidSectionId?: string;
  unassignedErrors: FormErrorEntry[];
}

function matchesBoundary(fieldPath: string, ownedPath: string): boolean {
  return (
    fieldPath === ownedPath ||
    fieldPath.startsWith(`${ownedPath}.`) ||
    fieldPath.startsWith(`${ownedPath}[`)
  );
}

export function formFieldBelongsToSection(
  fieldPath: string,
  section: Pick<FormSectionOwnership, "fields" | "fieldPrefixes">
): boolean {
  return [...(section.fields ?? []), ...(section.fieldPrefixes ?? [])].some(
    (ownedPath) => matchesBoundary(fieldPath, ownedPath)
  );
}

/** Resolve field errors against sections in their declared, deterministic order. */
export function resolveFormErrorsBySection(
  errors: readonly FormErrorEntry[],
  sections: readonly FormSectionOwnership[]
): FormErrorsBySection {
  const errorsBySection: Record<string, FormErrorEntry[]> = {};
  const errorCountBySection: Record<string, number> = {};
  for (const section of sections) {
    errorsBySection[section.id] = [];
    errorCountBySection[section.id] = 0;
  }

  const unassignedErrors: FormErrorEntry[] = [];

  for (const error of errors) {
    const fieldPath = error.fieldPath;
    const section = fieldPath
      ? sections.find((candidate) =>
          formFieldBelongsToSection(fieldPath, candidate)
        )
      : undefined;
    if (!section) {
      unassignedErrors.push(error);
      continue;
    }
    errorsBySection[section.id]?.push(error);
    errorCountBySection[section.id] =
      (errorCountBySection[section.id] ?? 0) + 1;
  }

  // Section declaration order, rather than incoming error iteration order,
  // defines the first destination for deterministic navigation.
  const firstInvalidSectionId = sections.find(
    (section) => (errorCountBySection[section.id] ?? 0) > 0
  )?.id;

  return {
    errorsBySection,
    errorCountBySection,
    ...(firstInvalidSectionId ? { firstInvalidSectionId } : {}),
    unassignedErrors,
  };
}
