import { describe, expect, it } from 'vitest';
import { normalizeApiError } from '../src/errors';
import { bookingKeys } from '../src/query-keys';
import {
  canonicalToDatabaseStatus,
  databaseToCanonicalStatus,
  toCanonicalBookingStatus,
  toDatabaseBookingStatus,
} from '../src/resources/bookings/status';

describe('api-client contracts', () => {
  it('creates deterministic query keys for equivalent parameter objects', () => {
    expect(bookingKeys.list({ pageSize: 20, page: 1 })).toEqual(
      bookingKeys.list({ page: 1, pageSize: 20 }),
    );
    expect(bookingKeys.list({ page: 1, search: undefined })).toEqual(
      bookingKeys.list({ page: 1 }),
    );
  });

  it('maps every verified database booking status in both directions', () => {
    for (const [databaseStatus, canonicalStatus] of Object.entries(databaseToCanonicalStatus)) {
      expect(toCanonicalBookingStatus(databaseStatus)).toBe(canonicalStatus);
      expect(toDatabaseBookingStatus(canonicalStatus)).toBe(databaseStatus);
    }
    expect(Object.keys(databaseToCanonicalStatus)).toHaveLength(
      Object.keys(canonicalToDatabaseStatus).length,
    );
  });

  it('rejects unknown booking statuses as typed contract errors', () => {
    expect(() => toCanonicalBookingStatus('future_status')).toThrowError(
      expect.objectContaining({ code: 'BOOKING_STATUS_CONTRACT_ERROR', type: 'contract' }),
    );
    expect(() => toDatabaseBookingStatus('future_status')).toThrowError(
      expect.objectContaining({ code: 'BOOKING_STATUS_CONTRACT_ERROR', type: 'contract' }),
    );
  });

  it('preserves backend error semantics', () => {
    const error = normalizeApiError({
      code: '23505',
      status: 409,
      message: 'هذا الموعد محجوز بالفعل مع هذا المدرب.',
      details: { constraint: 'bookings_active_instructor_slot_unique' },
    });

    expect(error.type).toBe('conflict');
    expect(error.code).toBe('23505');
    expect(error.status).toBe(409);
    expect(error.message).toContain('الموعد');
    expect(error.details).toEqual({ constraint: 'bookings_active_instructor_slot_unique' });
  });
});

