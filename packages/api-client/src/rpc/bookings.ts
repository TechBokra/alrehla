import type { ApiClient, RequestOptions } from '../clients';
import { applyAbortSignal, unwrapResult } from '../shared';
import type {
  BookingAvailability,
  BookingConfirmationResult,
  BookingCreationResult,
  BookingStatusUpdateResult,
  SessionJoinAuthorizationResult,
} from '@alrehla/types';
import type { Database } from '@alrehla/types';
import { toDatabaseBookingStatus, type CanonicalBookingStatus } from '../resources/bookings/status';
import {
  normalizeBoolean,
  normalizeBookingAvailability,
  normalizeBookingConfirmationResult,
  normalizeBookingCreationResult,
  normalizeBookingStatusUpdateResult,
  normalizePrice,
  normalizeSessionJoinAuthorizationResult,
} from '../resources/bookings/normalize';

export const calculateBookingPrice = async (
  client: ApiClient,
  input: { packageName: string; instructorId: number },
  options: RequestOptions = {},
): Promise<number> => {
  const args: Database['public']['Functions']['calculate_booking_price']['Args'] = {
    p_package_name: input.packageName,
    p_instructor_id: input.instructorId,
  };
  const request = client.rpc('calculate_booking_price', args);
  return normalizePrice(unwrapResult(await applyAbortSignal(request, options.signal), 'تعذر حساب سعر الحجز.'));
};

export const isBookingSlotAvailableSecure = async (
  client: ApiClient,
  input: { instructorId: number; bookingDate: string; bookingTime: string },
  options: RequestOptions = {},
): Promise<boolean> => {
  const args: Database['public']['Functions']['is_booking_slot_available_secure']['Args'] = {
    p_instructor_id: input.instructorId,
    p_booking_date: input.bookingDate,
    p_booking_time: input.bookingTime,
  };
  const request = client.rpc('is_booking_slot_available_secure', args);
  return normalizeBoolean(
    unwrapResult(await applyAbortSignal(request, options.signal), 'تعذر التحقق من توفر الموعد.'),
    'نتيجة توفر الموعد المُرجعة من الخادم غير صالحة.',
  );
};

export const getBookingAvailabilitySecure = async (
  client: ApiClient,
  options: RequestOptions = {},
): Promise<BookingAvailability[]> => {
  const request = client.rpc('get_booking_availability_secure');
  const result = unwrapResult(
    await applyAbortSignal(request, options.signal),
    'تعذر تحميل مواعيد الحجز.',
  );
  return normalizeBookingAvailability(result);
};

export const createBookingSecure = async (
  client: ApiClient,
  input: {
    userId: string;
    childProfileId: number;
    instructorId: number;
    packageName: string;
    bookingDate: string;
    bookingTime: string;
    receiptUrl?: string | null;
    expectedTotal: number;
  },
  options: RequestOptions = {},
): Promise<BookingCreationResult> => {
  const args: Database['public']['Functions']['create_booking_secure']['Args'] = {
    p_user_id: input.userId,
    p_child_id: input.childProfileId,
    p_instructor_id: input.instructorId,
    p_package_name: input.packageName,
    p_booking_date: input.bookingDate,
    p_booking_time: input.bookingTime,
    p_receipt_url: input.receiptUrl ?? null,
    p_expected_total: input.expectedTotal,
  };
  const request = client.rpc('create_booking_secure', args);
  return normalizeBookingCreationResult(
    unwrapResult(await applyAbortSignal(request, options.signal), 'تعذر إنشاء الحجز.'),
  );
};

export const confirmBookingSecure = async (
  client: ApiClient,
  bookingId: string,
  options: RequestOptions = {},
): Promise<BookingConfirmationResult> => {
  const args: Database['public']['Functions']['confirm_booking_secure']['Args'] = {
    p_booking_id: bookingId,
  };
  const request = client.rpc('confirm_booking_secure', args);
  return normalizeBookingConfirmationResult(
    unwrapResult(await applyAbortSignal(request, options.signal), 'تعذر تأكيد الحجز.'),
  );
};

export const updateBookingStatusSecure = async (
  client: ApiClient,
  input: { bookingId: string; status: CanonicalBookingStatus },
  options: RequestOptions = {},
): Promise<BookingStatusUpdateResult> => {
  const databaseStatus = toDatabaseBookingStatus(input.status);
  const args: Database['public']['Functions']['update_booking_status_secure']['Args'] = {
    p_booking_id: input.bookingId,
    p_new_status: databaseStatus,
  };
  const request = client.rpc('update_booking_status_secure', args);
  return normalizeBookingStatusUpdateResult(
    unwrapResult(await applyAbortSignal(request, options.signal), 'تعذر تحديث حالة الحجز.'),
  );
};

export const authorizeSessionJoinSecure = async (
  client: ApiClient,
  sessionId: string,
  options: RequestOptions = {},
): Promise<SessionJoinAuthorizationResult> => {
  const args: Database['public']['Functions']['authorize_session_join_secure']['Args'] = {
    p_session_id: sessionId,
  };
  const request = client.rpc('authorize_session_join_secure', args);
  return normalizeSessionJoinAuthorizationResult(
    unwrapResult(await applyAbortSignal(request, options.signal), 'تعذر التحقق من صلاحية دخول الجلسة.'),
  );
};
