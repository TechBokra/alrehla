import { describe, expect, it, vi } from 'vitest';
import {
  applyServerFieldErrors,
  firstInvalidFieldPath,
  focusFormField,
  normalizeFormErrors,
  resolveFormErrorsBySection,
} from '../src';

describe('form contracts', () => {
  it('normalizes and deduplicates validation, server, Zod, and global errors', () => {
    const errors = normalizeFormErrors({
      fieldMeta: {
        email: { errors: [{ message: 'Invalid email' }], errorMap: {} },
      },
      errorMap: {
        onServer: {
          form: 'Unable to save',
          fields: { email: ['Invalid email'], name: ['Name is required'] },
        },
      },
    });
    expect(errors).toEqual([
      { message: 'Unable to save', source: 'form' },
      { fieldPath: 'email', message: 'Invalid email', source: 'server' },
      { fieldPath: 'name', message: 'Name is required', source: 'server' },
    ]);
    expect(firstInvalidFieldPath(errors)).toBe('email');
  });

  it('assigns nested and array paths to section ownership', () => {
    const result = resolveFormErrorsBySection(
      [
        { fieldPath: 'profile.name', message: 'Required', source: 'validation' },
        { fieldPath: 'items[0].sku', message: 'Required', source: 'validation' },
        { message: 'Save failed', source: 'form' },
      ],
      [
        { id: 'profile', fieldPrefixes: ['profile'] },
        { id: 'items', fieldPrefixes: ['items'] },
      ],
    );
    expect(result.errorCountBySection).toEqual({ profile: 1, items: 1 });
    expect(result.firstInvalidSectionId).toBe('profile');
    expect(result.unassignedErrors).toHaveLength(1);
  });

  it('focuses a registered field safely', () => {
    document.body.innerHTML = '<input id="items[0].sku" />';
    expect(focusFormField('items[0].sku')).toBe(true);
    expect(document.activeElement?.id).toBe('items[0].sku');
    expect(focusFormField('missing')).toBe(false);
  });

  it('maps mutation field and global errors into the form error map', () => {
    const setErrorMap = vi.fn();
    const normalized = applyServerFieldErrors({ setErrorMap }, {
      name: 'ApiError',
      message: 'Please review the form',
      code: 'VALIDATION_FAILED',
      fieldErrors: { 'items[0].sku': ['SKU is required'] },
    });

    expect(normalized.message).toBe('Please review the form');
    expect(setErrorMap).toHaveBeenCalledWith({
      onServer: {
        form: 'Please review the form',
        fields: { 'items[0].sku': ['SKU is required'] },
      },
    });
  });
});
