import { describe, expect, it } from 'vitest';
import {
  authorizeSessionJoinSecure,
  calculateBookingPrice,
  confirmBookingSecure,
  createBookingSecure,
  getBookingAvailabilitySecure,
  isBookingSlotAvailableSecure,
  updateBookingStatusSecure,
} from '../src/rpc/bookings';
import { requestBody, createTestClient, jsonResponse } from './helpers';

const bookingId = 'BKG-1234567890';

describe('booking RPC wrappers', () => {
  it('calls calculate_booking_price with its exact arguments', async () => {
    const { client, requests } = createTestClient(() => jsonResponse(350));

    await expect(calculateBookingPrice(client, { packageName: 'رحلة الكتابة', instructorId: 7 })).resolves.toBe(350);

    expect(new URL(requests[0].url).pathname).toBe('/rest/v1/rpc/calculate_booking_price');
    expect(await requestBody(requests[0])).toEqual({
      p_package_name: 'رحلة الكتابة',
      p_instructor_id: 7,
    });
  });

  it('calls is_booking_slot_available_secure with its exact arguments', async () => {
    const { client, requests } = createTestClient(() => jsonResponse(true));

    await expect(isBookingSlotAvailableSecure(client, {
      instructorId: 7,
      bookingDate: '2026-09-01',
      bookingTime: '10:30',
    })).resolves.toBe(true);

    expect(new URL(requests[0].url).pathname).toBe('/rest/v1/rpc/is_booking_slot_available_secure');
    expect(await requestBody(requests[0])).toEqual({
      p_instructor_id: 7,
      p_booking_date: '2026-09-01',
      p_booking_time: '10:30',
    });
  });

  it('calls get_booking_availability_secure without arguments', async () => {
    const { client, requests } = createTestClient(() => jsonResponse([
      { instructor_id: 7, booking_date: '2026-09-01', booking_time: '10:30', status: 'reserved' },
    ]));

    await expect(getBookingAvailabilitySecure(client)).resolves.toHaveLength(1);

    expect(new URL(requests[0].url).pathname).toBe('/rest/v1/rpc/get_booking_availability_secure');
    expect(await requestBody(requests[0])).toEqual({});
  });

  it('calls create_booking_secure with its exact arguments', async () => {
    const { client, requests } = createTestClient(() => jsonResponse({
      id: bookingId,
      user_id: '11111111-1111-4111-8111-111111111111',
      child_id: 3,
      instructor_id: 7,
      package_name: 'رحلة الكتابة',
      booking_date: '2026-09-01',
      booking_time: '10:30',
      total: 350,
      status: 'بانتظار الدفع',
      receipt_url: null,
      created_at: '2026-08-31T10:00:00.000Z',
    }));

    await createBookingSecure(client, {
      userId: '11111111-1111-4111-8111-111111111111',
      childProfileId: 3,
      instructorId: 7,
      packageName: 'رحلة الكتابة',
      bookingDate: '2026-09-01',
      bookingTime: '10:30',
      receiptUrl: null,
      expectedTotal: 350,
    });

    expect(new URL(requests[0].url).pathname).toBe('/rest/v1/rpc/create_booking_secure');
    expect(await requestBody(requests[0])).toEqual({
      p_user_id: '11111111-1111-4111-8111-111111111111',
      p_child_id: 3,
      p_instructor_id: 7,
      p_package_name: 'رحلة الكتابة',
      p_booking_date: '2026-09-01',
      p_booking_time: '10:30',
      p_receipt_url: null,
      p_expected_total: 350,
    });
  });

  it('calls confirm_booking_secure with p_booking_id only', async () => {
    const { client, requests } = createTestClient(() => jsonResponse({
      id: bookingId,
      status: 'مؤكد',
      session_count: 4,
      idempotent: false,
    }));

    await confirmBookingSecure(client, bookingId);

    expect(new URL(requests[0].url).pathname).toBe('/rest/v1/rpc/confirm_booking_secure');
    expect(await requestBody(requests[0])).toEqual({ p_booking_id: bookingId });
  });

  it('calls update_booking_status_secure with the verified database status argument', async () => {
    const { client, requests } = createTestClient(() => jsonResponse({
      id: bookingId,
      status: 'مكتمل',
      released_future_sessions: 0,
    }));

    await updateBookingStatusSecure(client, { bookingId, status: 'completed' });

    expect(new URL(requests[0].url).pathname).toBe('/rest/v1/rpc/update_booking_status_secure');
    expect(await requestBody(requests[0])).toEqual({
      p_booking_id: bookingId,
      p_new_status: 'مكتمل',
    });
  });

  it('calls authorize_session_join_secure with p_session_id only', async () => {
    const { client, requests } = createTestClient(() => jsonResponse({
      allowed: false,
      reason: 'too_early',
      session_id: '22222222-2222-4222-8222-222222222222',
      session_date: '2026-09-01T10:30:00.000Z',
      join_allowed_at: '2026-09-01T10:00:00.000Z',
      join_expires_at: '2026-09-01T11:00:00.000Z',
      domain: null,
      room_name: null,
    }));

    await authorizeSessionJoinSecure(client, '22222222-2222-4222-8222-222222222222');

    expect(new URL(requests[0].url).pathname).toBe('/rest/v1/rpc/authorize_session_join_secure');
    expect(await requestBody(requests[0])).toEqual({
      p_session_id: '22222222-2222-4222-8222-222222222222',
    });
  });
});
