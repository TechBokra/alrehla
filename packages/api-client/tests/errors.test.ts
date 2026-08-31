import { describe, expect, it } from 'vitest';
import { ApiError, normalizeApiError } from '../src/errors';

describe('ApiError normalization', () => {
  it.each([
    [{ status: 401, code: 'AUTH_REQUIRED', message: 'Not authenticated' }, 'authentication'],
    [{ status: 403, code: '42501', message: 'permission denied' }, 'authorization'],
    [{ status: 422, code: '23514', message: 'check constraint' }, 'validation'],
    [{ status: 409, code: '23505', message: 'duplicate key' }, 'conflict'],
    [{ status: 404, code: 'PGRST116', message: 'not found' }, 'not_found'],
    [{ status: 500, code: 'XX000', message: 'database failure' }, 'database'],
  ] as const)('classifies backend error %j as %s', (input, type) => {
    expect(normalizeApiError(input)).toMatchObject({ type, code: input.code, status: input.status });
  });

  it('classifies network, cancellation, contract, and unknown failures', () => {
    expect(normalizeApiError(new TypeError('failed to fetch'))).toMatchObject({
      type: 'network',
      code: 'NETWORK_ERROR',
    });
    expect(normalizeApiError({ code: 'ECONNRESET', message: 'connection reset' })).toMatchObject({
      type: 'network',
      code: 'NETWORK_ERROR',
    });
    expect(normalizeApiError(new DOMException('Aborted', 'AbortError'))).toMatchObject({
      type: 'cancelled',
      code: 'REQUEST_CANCELLED',
    });
    const contract = new ApiError('bad response', {
      type: 'contract',
      code: 'API_CONTRACT_ERROR',
      details: { field: 'id' },
    });
    expect(normalizeApiError(contract)).toBe(contract);
    expect(normalizeApiError(new Error('unexpected failure'))).toMatchObject({
      type: 'unknown',
      message: 'unexpected failure',
    });
  });

  it('preserves backend code, details, field errors, status, and cause', () => {
    const cause = { code: 'VALIDATION_FAILED', status: 422, message: 'invalid input' };
    const error = normalizeApiError({
      ...cause,
      details: { constraint: 'booking_date' },
      fieldErrors: { bookingDate: ['invalid date'] },
    });

    expect(error).toMatchObject({
      type: 'validation',
      code: 'VALIDATION_FAILED',
      status: 422,
      details: { constraint: 'booking_date' },
      fieldErrors: { bookingDate: ['invalid date'] },
      cause,
    });
  });
});
