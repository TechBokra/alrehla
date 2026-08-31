import { describe, expect, it } from 'vitest';
import { normalizeMutationError } from '../src/errors';

describe('mutation error preservation', () => {
  it('preserves ApiError-compatible transport fields for mutation callers', () => {
    const cause = {
      name: 'ApiError',
      message: 'لا يمكن تنفيذ العملية.',
      type: 'authorization',
      code: 'AUTH_FORBIDDEN',
      status: 403,
      details: { permission: 'manage_bookings' },
      fieldErrors: { bookingId: ['غير صالح'] },
    };

    expect(normalizeMutationError(cause)).toMatchObject({
      message: cause.message,
      type: cause.type,
      code: cause.code,
      status: cause.status,
      details: cause.details,
      fieldErrors: cause.fieldErrors,
      cause,
    });
  });
});
