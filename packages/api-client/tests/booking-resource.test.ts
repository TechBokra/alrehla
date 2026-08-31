import { describe, expect, it } from 'vitest';
import {
  getBooking,
  listBookings,
  listScheduledSessions,
  updateBookingStatus,
} from '../src/resources/bookings/resource';
import { ApiError } from '../src/errors';
import { createTestClient, jsonResponse } from './helpers';

const bookingId = 'BKG-1234567890';
const userId = '11111111-1111-4111-8111-111111111111';

const bookingRow = {
  id: bookingId,
  user_id: userId,
  child_id: 3,
  instructor_id: 7,
  package_name: 'رحلة الكتابة',
  booking_date: '2026-09-01',
  booking_time: '10:30',
  total: 350,
  status: 'مكتمل',
  receipt_url: null,
  progress_notes: 'مراجعة أولى',
  details: { draft: 'نص' },
  created_at: '2026-08-31T10:00:00.000Z',
  child_profiles: [{ name: 'ليان', avatar_url: null }],
  instructors: { name: 'محمد', user_id: userId },
  users: { name: 'ولي الأمر', email: 'parent@example.com' },
};

describe('booking resource normalization and orchestration', () => {
  it('normalizes a booking row and preserves pagination metadata', async () => {
    const { client, requests } = createTestClient(() => jsonResponse([bookingRow], {
      'content-range': '10-10/42',
    }));

    const result = await listBookings(client, {
      page: 2,
      pageSize: 10,
      search: 'BKG',
      statuses: ['completed', 'confirmed'],
      childProfileId: 3,
      instructorId: 7,
      userId,
    });

    const url = new URL(requests[0].url);
    expect(result.total).toBe(42);
    expect(result.rows[0]).toMatchObject({
      id: bookingId,
      status: 'completed',
      databaseStatus: 'مكتمل',
      child_profiles: { name: 'ليان', avatar_url: null },
      instructors: { name: 'محمد', user_id: userId },
      users: { name: 'ولي الأمر', email: 'parent@example.com' },
      details: { draft: 'نص' },
    });
    expect(url.searchParams.get('status')).toBe('in.(مكتمل,مؤكد)');
    expect(url.searchParams.get('child_id')).toBe('eq.3');
    expect(url.searchParams.get('instructor_id')).toBe('eq.7');
    expect(url.searchParams.get('user_id')).toBe(`eq.${userId}`);
    expect(url.searchParams.get('or')).toContain('BKG');
    expect(url.searchParams.get('offset')).toBe('10');
    expect(url.searchParams.get('limit')).toBe('10');
  });

  it('normalizes a single booking lookup', async () => {
    const { client } = createTestClient(() => jsonResponse(bookingRow));

    await expect(getBooking(client, bookingId)).resolves.toMatchObject({
      id: bookingId,
      status: 'completed',
      databaseStatus: 'مكتمل',
    });
  });

  it('routes confirmation through confirm_booking_secure and other transitions through update_booking_status_secure', async () => {
    const requests: Request[] = [];
    const { client } = createTestClient((request) => {
      requests.push(request);
      if (new URL(request.url).pathname.endsWith('/confirm_booking_secure')) {
        return jsonResponse({ id: bookingId, status: 'مؤكد', session_count: 4, idempotent: false });
      }
      return jsonResponse({ id: bookingId, status: 'مكتمل', released_future_sessions: 0 });
    });

    await expect(updateBookingStatus(client, bookingId, 'confirmed')).resolves.toMatchObject({
      status: 'confirmed',
      databaseStatus: 'مؤكد',
    });
    await expect(updateBookingStatus(client, bookingId, 'completed')).resolves.toMatchObject({
      status: 'completed',
      databaseStatus: 'مكتمل',
    });

    expect(new URL(requests[0].url).pathname).toContain('/rpc/confirm_booking_secure');
    expect(new URL(requests[1].url).pathname).toContain('/rpc/update_booking_status_secure');
    expect(await requests[0].clone().json()).toEqual({ p_booking_id: bookingId });
    expect(await requests[1].clone().json()).toEqual({
      p_booking_id: bookingId,
      p_new_status: 'مكتمل',
    });
  });

  it('rejects Arabic/database status values at the public mutation boundary', async () => {
    const { client } = createTestClient(() => jsonResponse({}));

    // @ts-expect-error Database status values are intentionally not public mutation inputs.
    const invalidMutation = updateBookingStatus(client, bookingId, 'مكتمل');
    await expect(invalidMutation).rejects.toMatchObject({
      type: 'contract',
      code: 'BOOKING_STATUS_CONTRACT_ERROR',
    });
  });

  it('normalizes scheduled-session relationships and filters', async () => {
    const { client, requests } = createTestClient(() => jsonResponse([{
      id: '22222222-2222-4222-8222-222222222222',
      booking_id: bookingId,
      subscription_id: null,
      child_id: 3,
      instructor_id: 7,
      session_date: '2026-09-08T08:30:00.000Z',
      status: 'upcoming',
      notes: null,
      child_profiles: { name: 'ليان' },
      instructors: [{ name: 'محمد', user_id: userId }],
    }]));

    const sessions = await listScheduledSessions(client, {
      bookingIds: [bookingId],
      childProfileId: 3,
      instructorId: 7,
    });

    expect(sessions[0]).toMatchObject({
      id: '22222222-2222-4222-8222-222222222222',
      booking_id: bookingId,
      child_profiles: { name: 'ليان' },
      instructors: { name: 'محمد', user_id: userId },
      child_name: 'ليان',
      instructor_name: 'محمد',
    });
    const url = new URL(requests[0].url);
    expect(url.searchParams.get('booking_id')).toBe(`in.(${bookingId})`);
    expect(url.searchParams.get('child_id')).toBe('eq.3');
    expect(url.searchParams.get('instructor_id')).toBe('eq.7');
  });

  it('fails loudly for invalid booking and scheduled-session result contracts', async () => {
    const invalidBooking = createTestClient(() => jsonResponse([{ ...bookingRow, status: 'غير معروف' }]));
    await expect(listBookings(invalidBooking.client)).rejects.toBeInstanceOf(ApiError);
    await expect(listBookings(invalidBooking.client)).rejects.toMatchObject({
      code: 'BOOKING_STATUS_CONTRACT_ERROR',
      type: 'contract',
    });

    const invalidSession = createTestClient(() => jsonResponse([{
      id: '22222222-2222-4222-8222-222222222222',
      booking_id: bookingId,
      child_id: 3,
      instructor_id: 7,
      session_date: '2026-09-08T08:30:00.000Z',
      status: 'unknown',
    }]));
    await expect(listScheduledSessions(invalidSession.client)).rejects.toMatchObject({
      code: 'API_CONTRACT_ERROR',
      type: 'contract',
    });
  });

  it('normalizes request cancellation into ApiError', async () => {
    const controller = new AbortController();
    controller.abort();
    const { client } = createTestClient((request) => {
      if (request.signal.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
      return jsonResponse([]);
    });

    await expect(listScheduledSessions(client, {}, { signal: controller.signal })).rejects.toMatchObject({
      type: 'cancelled',
      code: 'REQUEST_CANCELLED',
    });
  });
});
