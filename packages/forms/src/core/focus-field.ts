export interface FormFieldFocusTarget {
  fieldPath: string;
  id: string;
  name: string;
}

export const getFormFieldFocusTarget = (fieldPath: string): FormFieldFocusTarget => ({
  fieldPath,
  id: fieldPath,
  name: fieldPath,
});

const isFocusable = (element: Element): element is HTMLElement =>
  typeof HTMLElement !== 'undefined' && element instanceof HTMLElement && !element.hasAttribute('disabled') && typeof element.focus === 'function';

export const focusFormField = (
  fieldPath: string | undefined,
  root?: ParentNode,
): boolean => {
  const queryRoot = root ?? (typeof document === 'undefined' ? undefined : document);
  if (!fieldPath || !queryRoot) return false;
  const target = getFormFieldFocusTarget(fieldPath);
  const candidates = Array.from(queryRoot.querySelectorAll<HTMLElement>('[name], [id], [data-form-field], [data-field-path]'));
  const element = candidates.find(
    (candidate) =>
      isFocusable(candidate) &&
      (candidate.getAttribute('name') === target.name ||
        candidate.id === target.id ||
        candidate.getAttribute('data-form-field') === fieldPath ||
        candidate.getAttribute('data-field-path') === fieldPath),
  );
  if (!element) return false;
  element.focus();
  return true;
};
