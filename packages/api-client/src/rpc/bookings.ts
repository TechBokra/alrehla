import type { ApiClient, RequestOptions } from '../clients';
import { applyAbortSignal, unwrapResult } from '../shared';
import type {
  BookingAvailability,
  BookingConfirmationResult,
  BookingCreationResult,
  BookingStatusUpdateResult,
  DatabaseBookingStatus,
  SessionJoinAuthorizationResult,
} from '@alrehla/types';

export const calculateBookingPrice = async (
  client: ApiClient,
  input: { packageName: string; instructorId: number },
  options: RequestOptions = {},
): Promise<number> => {
  const request = client.rpc('calculate_booking_price', {
    p_package_name: input.packageName,
    p_instructor_id: input.instructorId,
  });
  return Number(unwrapResult(await applyAbortSignal(request, options.signal), 'تعذر حساب سعر الحجز.'));
};

export const isBookingSlotAvailableSecure = async (
  client: ApiClient,
  input: { instructorId: number; bookingDate: string; bookingTime: string },
  options: RequestOptions = {},
): Promise<boolean> => {
  const request = client.rpc('is_booking_slot_available_secure', {
    p_instructor_id: input.instructorId,
    p_booking_date: input.bookingDate,
    p_booking_time: input.bookingTime,
  });
  return unwrapResult(await applyAbortSignal(request, options.signal), 'تعذر التحقق من توفر الموعد.') === true;
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
  return Array.isArray(result) ? result : [];
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
  const request = client.rpc('create_booking_secure', {
    p_user_id: input.userId,
    p_child_id: input.childProfileId,
    p_instructor_id: input.instructorId,
    p_package_name: input.packageName,
    p_booking_date: input.bookingDate,
    p_booking_time: input.bookingTime,
    p_receipt_url: input.receiptUrl ?? null,
    p_expected_total: input.expectedTotal,
  });
  return unwrapResult(await applyAbortSignal(request, options.signal), 'تعذر إنشاء الحجز.');
};

export const confirmBookingSecure = async (
  client: ApiClient,
  bookingId: string,
  options: RequestOptions = {},
): Promise<BookingConfirmationResult> => {
  const request = client.rpc('confirm_booking_secure', { p_booking_id: bookingId });
  return unwrapResult(await applyAbortSignal(request, options.signal), 'تعذر تأكيد الحجز.');
};

export const updateBookingStatusSecure = async (
  client: ApiClient,
  input: { bookingId: string; databaseStatus: DatabaseBookingStatus },
  options: RequestOptions = {},
): Promise<BookingStatusUpdateResult> => {
  const request = client.rpc('update_booking_status_secure', {
    p_booking_id: input.bookingId,
    p_new_status: input.databaseStatus,
  });
  return unwrapResult(await applyAbortSignal(request, options.signal), 'تعذر تحديث حالة الحجز.');
};

export const authorizeSessionJoinSecure = async (
  client: ApiClient,
  sessionId: string,
  options: RequestOptions = {},
): Promise<SessionJoinAuthorizationResult> => {
  const request = client.rpc('authorize_session_join_secure', { p_session_id: sessionId });
  return unwrapResult(
    await applyAbortSignal(request, options.signal),
    'تعذر التحقق من صلاحية دخول الجلسة.',
  );
};

