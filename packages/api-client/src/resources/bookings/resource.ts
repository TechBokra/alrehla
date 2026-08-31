import type { ApiClient, RequestOptions } from '../../clients';
import { normalizeApiError } from '../../errors';
import { applyAbortSignal } from '../../shared';
import {
  authorizeSessionJoinSecure,
  calculateBookingPrice,
  confirmBookingSecure,
  createBookingSecure,
  getBookingAvailabilitySecure,
  isBookingSlotAvailableSecure,
  updateBookingStatusSecure,
} from '../../rpc';
import type {
  BookingAvailability,
  Instructor,
  ScheduledSession,
  SessionJoinAuthorizationResult,
} from '@alrehla/types';
import type {
  BookingListResult,
  BookingMutationResult,
  BookingRecord,
  CreateBookingInput,
  ListBookingsParams,
  ListScheduledSessionsParams,
} from './types';
import {
  contractError,
  normalizeBookingAvailability,
  normalizeBookingConfirmationResult,
  normalizeBookingCreationResult,
  normalizeBookingMutationResult,
  normalizeBookingPackage,
  normalizeBookingRecord,
  normalizeBookingStatusUpdateResult,
  normalizeInstructor,
  normalizeScheduledSession,
  normalizeSessionJoinAuthorizationResult,
} from './normalize';
import {
  canonicalToDatabaseStatus,
  toDatabaseBookingStatus,
  type BookingStatusInput,
} from './status';

const requireIdentifier = (value: unknown, name: string): string => {
  if (typeof value !== 'string' || !value.trim()) throw contractError(`المعرّف ${name} غير صالح.`, value);
  return value;
};

const requirePositiveInteger = (value: unknown, name: string): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw contractError(`المعرّف ${name} غير صالح.`, value);
  }
  return value;
};

const requireNonNegativeNumber = (value: unknown, name: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw contractError(`القيمة ${name} غير صالحة.`, value);
  }
  return value;
};

const escapeIlike = (value: string) => value.replace(/[\\%,()]/g, (character) => `\\${character}`);

const validateListParams = (params: ListBookingsParams): void => {
  if (params.instructorId !== undefined) requirePositiveInteger(params.instructorId, 'المدرب');
  if (params.childProfileId !== undefined) requirePositiveInteger(params.childProfileId, 'الطفل');
  if (params.userId !== undefined) requireIdentifier(params.userId, 'المستخدم');
  params.statuses?.forEach((status) => toDatabaseBookingStatus(status));
};

const validateCreateInput = (input: CreateBookingInput): void => {
  requireIdentifier(input.userId, 'المستخدم');
  requirePositiveInteger(input.childProfileId, 'الطفل');
  requirePositiveInteger(input.instructorId, 'المدرب');
  if (typeof input.packageName !== 'string' || !input.packageName.trim()) {
    throw contractError('اسم باقة الحجز غير صالح.', input.packageName);
  }
  if (typeof input.bookingDate !== 'string' || !input.bookingDate.trim()) {
    throw contractError('تاريخ الحجز غير صالح.', input.bookingDate);
  }
  if (typeof input.bookingTime !== 'string' || !input.bookingTime.trim()) {
    throw contractError('وقت الحجز غير صالح.', input.bookingTime);
  }
  if (input.receiptUrl !== undefined && input.receiptUrl !== null && typeof input.receiptUrl !== 'string') {
    throw contractError('إيصال الحجز غير صالح.', input.receiptUrl);
  }
  requireNonNegativeNumber(input.expectedTotal, 'إجمالي الحجز');
};

const getBookingSelect =
  '*, child_profiles:child_profiles!fk_bookings_child(*), instructors:instructors!fk_bookings_instructor(*), users:profiles!fk_bookings_user(email, name)';

export const listBookings = async (
  client: ApiClient,
  params: ListBookingsParams = {},
  options: RequestOptions = {},
): Promise<BookingListResult> => {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    validateListParams(params);
    let query = client.from('bookings').select(getBookingSelect, { count: 'exact' });
    if (params.status && params.status !== 'all') {
      if (params.status === 'active') {
        query = query
          .neq('status', canonicalToDatabaseStatus.cancelled)
          .neq('status', canonicalToDatabaseStatus.completed);
      } else if (params.status === 'archived') {
        query = query.or(
          `status.eq.${canonicalToDatabaseStatus.cancelled},status.eq.${canonicalToDatabaseStatus.completed}`,
        );
      } else {
        query = query.eq('status', toDatabaseBookingStatus(params.status));
      }
    }
    if (params.statuses?.length) {
      query = query.in('status', params.statuses.map(toDatabaseBookingStatus));
    }
    if (params.instructorId !== undefined) query = query.eq('instructor_id', params.instructorId);
    if (params.userId !== undefined) query = query.eq('user_id', params.userId);
    if (params.childProfileId !== undefined) query = query.eq('child_id', params.childProfileId);
    if (params.search?.trim()) {
      const search = escapeIlike(params.search.trim());
      query = query.or(`id.ilike.%${search}%,package_name.ilike.%${search}%`);
    }
    query = query.order('created_at', { ascending: false }).range(from, to);
    const result = await applyAbortSignal(query, options.signal);
    if (result.error) throw result.error;
    if (!Array.isArray(result.data)) {
      throw contractError('قائمة الحجوزات المُرجعة من الخادم غير صالحة.', result.data);
    }
    return {
      rows: result.data.map(normalizeBookingRecord),
      total: result.count ?? 0,
    };
  } catch (error) {
    throw normalizeApiError(error, 'تعذر تحميل الحجوزات.');
  }
};

export const getBooking = async (
  client: ApiClient,
  bookingId: string,
  options: RequestOptions = {},
): Promise<BookingRecord | null> => {
  const normalizedBookingId = requireIdentifier(bookingId, 'الحجز');
  try {
    const query = client.from('bookings').select(getBookingSelect).eq('id', normalizedBookingId).maybeSingle();
    const result = await applyAbortSignal(query, options.signal);
    if (result.error) throw result.error;
    return result.data ? normalizeBookingRecord(result.data) : null;
  } catch (error) {
    throw normalizeApiError(error, 'تعذر قراءة الحجز.');
  }
};

export const createBooking = async (
  client: ApiClient,
  input: CreateBookingInput,
  options: RequestOptions = {},
): Promise<BookingMutationResult> => {
  validateCreateInput(input);
  try {
    const result = await createBookingSecure(client, input, options);
    return normalizeBookingMutationResult(normalizeBookingCreationResult(result));
  } catch (error) {
    throw normalizeApiError(error, 'تعذر إنشاء الحجز.');
  }
};

export const quoteBooking = async (
  client: ApiClient,
  packageName: string,
  instructorId: number,
  options: RequestOptions = {},
): Promise<number> => {
  if (typeof packageName !== 'string' || !packageName.trim()) {
    throw contractError('اسم باقة التسعير غير صالح.', packageName);
  }
  requirePositiveInteger(instructorId, 'المدرب');
  return calculateBookingPrice(client, { packageName, instructorId }, options);
};

export const getBookingAvailability = async (
  client: ApiClient,
  options: RequestOptions = {},
): Promise<{ bookings: BookingAvailability[] }> => ({
  bookings: normalizeBookingAvailability(await getBookingAvailabilitySecure(client, options)),
});

export const checkBookingSlotAvailability = async (
  client: ApiClient,
  instructorId: number,
  bookingDate: string,
  bookingTime: string,
  options: RequestOptions = {},
): Promise<boolean> => {
  requirePositiveInteger(instructorId, 'المدرب');
  if (typeof bookingDate !== 'string' || !bookingDate.trim()) throw contractError('تاريخ الموعد غير صالح.', bookingDate);
  if (typeof bookingTime !== 'string' || !bookingTime.trim()) throw contractError('وقت الموعد غير صالح.', bookingTime);
  return isBookingSlotAvailableSecure(client, { instructorId, bookingDate, bookingTime }, options);
};

export const confirmBooking = async (
  client: ApiClient,
  bookingId: string,
  options: RequestOptions = {},
): Promise<BookingMutationResult> => {
  const normalizedBookingId = requireIdentifier(bookingId, 'الحجز');
  try {
    return normalizeBookingMutationResult(
      normalizeBookingConfirmationResult(await confirmBookingSecure(client, normalizedBookingId, options)),
    );
  } catch (error) {
    throw normalizeApiError(error, 'تعذر تأكيد الحجز.');
  }
};

export const updateBookingStatus = async (
  client: ApiClient,
  bookingId: string,
  status: BookingStatusInput,
  options: RequestOptions = {},
): Promise<BookingMutationResult> => {
  const normalizedBookingId = requireIdentifier(bookingId, 'الحجز');
  toDatabaseBookingStatus(status);
  if (status === 'confirmed') return confirmBooking(client, normalizedBookingId, options);

  try {
    return normalizeBookingMutationResult(
      normalizeBookingStatusUpdateResult(
        await updateBookingStatusSecure(client, { bookingId: normalizedBookingId, status }, options),
      ),
    );
  } catch (error) {
    throw normalizeApiError(error, 'تعذر تحديث حالة الحجز.');
  }
};

export const listScheduledSessions = async (
  client: ApiClient,
  params: ListScheduledSessionsParams = {},
  options: RequestOptions = {},
): Promise<ScheduledSession[]> => {
  if (params.sessionId) requireIdentifier(params.sessionId, 'الجلسة');
  if (params.bookingId) requireIdentifier(params.bookingId, 'الحجز');
  params.bookingIds?.forEach((bookingId) => requireIdentifier(bookingId, 'الحجز'));
  if (params.childProfileId !== undefined) requirePositiveInteger(params.childProfileId, 'الطفل');
  if (params.instructorId !== undefined) requirePositiveInteger(params.instructorId, 'المدرب');

  try {
    let query = client.from('scheduled_sessions').select('*, instructors(name), child_profiles(name)');
    if (params.sessionId) query = query.eq('id', params.sessionId);
    if (params.bookingId) query = query.eq('booking_id', params.bookingId);
    if (params.bookingIds?.length) query = query.in('booking_id', params.bookingIds);
    if (params.childProfileId !== undefined) query = query.eq('child_id', params.childProfileId);
    if (params.instructorId !== undefined) query = query.eq('instructor_id', params.instructorId);
    query = query.order('session_date', { ascending: true });
    const result = await applyAbortSignal(query, options.signal);
    if (result.error) throw result.error;
    if (!Array.isArray(result.data)) {
      throw contractError('قائمة الجلسات المجدولة المُرجعة من الخادم غير صالحة.', result.data);
    }
    return result.data.map(normalizeScheduledSession);
  } catch (error) {
    throw normalizeApiError(error, 'تعذر تحميل الجلسات المجدولة.');
  }
};

export const authorizeSessionJoin = async (
  client: ApiClient,
  sessionId: string,
  options: RequestOptions = {},
): Promise<SessionJoinAuthorizationResult> => {
  const normalizedSessionId = requireIdentifier(sessionId, 'الجلسة');
  try {
    return normalizeSessionJoinAuthorizationResult(
      await authorizeSessionJoinSecure(client, normalizedSessionId, options),
    );
  } catch (error) {
    throw normalizeApiError(error, 'تعذر التحقق من صلاحية دخول الجلسة.');
  }
};

export const getBookingInstructor = async (
  client: ApiClient,
  instructorId: number,
  options: RequestOptions = {},
): Promise<Instructor | null> => {
  requirePositiveInteger(instructorId, 'المدرب');
  try {
    const result = await applyAbortSignal(
      client.from('instructors').select('*').eq('id', instructorId).is('deleted_at', null).maybeSingle(),
      options.signal,
    );
    if (result.error) throw result.error;
    return normalizeInstructor(result.data);
  } catch (error) {
    throw normalizeApiError(error, 'تعذر قراءة المدرب.');
  }
};

export const getBookingPackage = async (
  client: ApiClient,
  packageName: string,
  options: RequestOptions = {},
): Promise<{ name: string } | null> => {
  if (typeof packageName !== 'string' || !packageName.trim()) {
    throw contractError('اسم الباقة غير صالح.', packageName);
  }
  try {
    const result = await applyAbortSignal(
      client
        .from('creative_writing_packages')
        .select('name')
        .eq('name', packageName)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle(),
      options.signal,
    );
    if (result.error) throw result.error;
    return normalizeBookingPackage(result.data);
  } catch (error) {
    throw normalizeApiError(error, 'تعذر قراءة باقة الكتابة.');
  }
};
