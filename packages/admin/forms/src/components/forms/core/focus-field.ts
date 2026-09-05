export interface FormFieldFocusTarget {
  fieldPath: string;
  id: string;
  name: string;
}

/** Stable DOM contract for registered fields (TanStack names are also IDs). */
export function getFormFieldFocusTarget(
  fieldPath: string
): FormFieldFocusTarget {
  return { fieldPath, id: fieldPath, name: fieldPath };
}

function isFocusable(element: Element): element is HTMLElement {
  return (
    typeof HTMLElement !== "undefined" &&
    element instanceof HTMLElement &&
    !element.hasAttribute("disabled") &&
    typeof element.focus === "function"
  );
}

/**
 * Focus a registered field by its stable name/id contract. Custom editors may
 * opt into `data-form-field` or `data-field-path`; missing targets are a safe
 * no-op so navigation still works for editors without a native control.
 */
export function focusFormField(
  fieldPath: string | undefined,
  root: ParentNode = typeof document === "undefined"
    ? ({} as ParentNode)
    : document
): boolean {
  if (!fieldPath || !root || typeof root.querySelectorAll !== "function") {
    return false;
  }
  const target = getFormFieldFocusTarget(fieldPath);
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[name], [id], [data-form-field], [data-field-path]"
    )
  );
  const element = candidates.find(
    (candidate) =>
      isFocusable(candidate) &&
      (candidate.getAttribute("name") === target.name ||
        candidate.id === target.id ||
        candidate.getAttribute("data-form-field") === fieldPath ||
        candidate.getAttribute("data-field-path") === fieldPath)
  );
  if (!element) return false;
  element.focus();
  return true;
}
