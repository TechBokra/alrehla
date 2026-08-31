import type { ApiClient, RequestOptions } from '../../clients';
import { ApiError, normalizeApiError } from '../../errors';
import { applyAbortSignal, optionalResult } from '../../shared';
import type {
  BookingAvailability,
  BookingConfirmationResult,
  BookingCreationResult,
  ChildProfile,
  CreativeWritingBooking,
  Instructor,
  ScheduledSession,
  SessionJoinAuthorizationResult,
} from '@alrehla/types';
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
  BookingListResult,
  BookingMutationResult,
  BookingRecord,
  CreateBookingInput,
  ListBookingsParams,
  ListScheduledSessionsParams,
} from './types';
import {
  canonicalToDatabaseStatus,
  toCanonicalBookingStatus,
  toDatabaseBookingStatus,
  type BookingStatusInput,
} from './status';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const first = <T>(value: T | T[] | null): T | null => (Array.isArray(value) ? value[0] || null : value);

const contractError = (message: string, details?: unknown) =>
  new ApiError(message, {
    type: 'contract',
    code: 'API_CONTRACT_ERROR',
    details,
  });

const normalizeDatabaseStatus = (value: unknown) => {
  const status = toCanonicalBookingStatus(value);
  return {
    status,
    databaseStatus: canonicalToDatabaseStatus[status],
  };
};

const normalizeBooking = (value: unknown): BookingRecord => {
  if (!isRecord(value) || typeof value.id !== 'string') {
    throw contractError('نتيجة الحجز المُرجعة من الخادم غير صالحة.', value);
  }
  const normalizedStatus = normalizeDatabaseStatus(value.status);
  return {
    ...(value as Omit<CreativeWritingBooking, 'status'>),
    id: value.id,
    ...normalizedStatus,
  } as BookingRecord;
};

const normalizeMutation = (value: unknown): BookingMutationResult => {
  const result = first(value as Record<string, unknown> | Record<string, unknown>[] | null);
  if (!result || typeof result.id !== 'string') {
    throw contractError('نتيجة عملية الحجز المُرجعة من الخادم غير صالحة.', value);
  }
  const normalizedStatus = normalizeDatabaseStatus(result.status);
  return {
    ...result,
    id: result.id,
    ...normalizedStatus,
  };
};

const escapeIlike = (value: string) => value.replace(/[\\%,()]/g, (character) => `\\${character}`);

const applyBookingFilters = (query: any, params: ListBookingsParams) => {
  let next = query;
  if (params.status && params.status !== 'all') {
    if (params.status === 'active') {
      next = next.neq('status', 'ملغي').neq('status', 'مكتمل');
    } else if (params.status === 'archived') {
      next = next.or('status.eq.ملغي,status.eq.مكتمل');
    } else {
      next = next.eq('status', toDatabaseBookingStatus(params.status));
    }
  }
  if (params.statuses?.length) {
    next = next.in('status', params.statuses.map(toDatabaseBookingStatus));
  }
  if (params.instructorId !== undefined) next = next.eq('instructor_id', params.instructorId);
  if (params.userId !== undefined) next = next.eq('user_id', params.userId);
  if (params.childProfileId !== undefined) next = next.eq('child_id', params.childProfileId);
  if (params.search?.trim()) {
    const search = escapeIlike(params.search.trim());
    next = next.or(`id.ilike.%${search}%,package_name.ilike.%${search}%`);
  }
  return next;
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
    let query = client.from('bookings').select(getBookingSelect, { count: 'exact' });
    query = applyBookingFilters(query, params).order('created_at', { ascending: false }).range(from, to);
    const result = await applyAbortSignal(query, options.signal);
    if (result.error) throw result.error;
    return {
      rows: ((result.data || []) as unknown[]).map(normalizeBooking),
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
  try {
    const query = client.from('bookings').select(getBookingSelect).eq('id', bookingId).maybeSingle();
    const result = await applyAbortSignal(query, options.signal);
    if (result.error) throw result.error;
    return result.data ? normalizeBooking(result.data) : null;
  } catch (error) {
    throw normalizeApiError(error, 'تعذر قراءة الحجز.');
  }
};

export const createBooking = async (
  client: ApiClient,
  input: CreateBookingInput,
  options: RequestOptions = {},
): Promise<BookingMutationResult> => {
  try {
    const result = await createBookingSecure(client, input, options);
    return normalizeMutation(result as BookingCreationResult);
  } catch (error) {
    throw normalizeApiError(error, 'تعذر إنشاء الحجز.');
  }
};

export const quoteBooking = async (
  client: ApiClient,
  packageName: string,
  instructorId: number,
  options: RequestOptions = {},
) => calculateBookingPrice(client, { packageName, instructorId }, options);

export const getBookingAvailability = async (
  client: ApiClient,
  options: RequestOptions = {},
): Promise<{ bookings: BookingAvailability[] }> => ({
  bookings: await getBookingAvailabilitySecure(client, options),
});

export const checkBookingSlotAvailability = async (
  client: ApiClient,
  instructorId: number,
  bookingDate: string,
  bookingTime: string,
  options: RequestOptions = {},
) => isBookingSlotAvailableSecure(client, { instructorId, bookingDate, bookingTime }, options);

export const confirmBooking = async (
  client: ApiClient,
  bookingId: string,
  options: RequestOptions = {},
): Promise<BookingMutationResult> => {
  try {
    return normalizeMutation(await confirmBookingSecure(client, bookingId, options) as BookingConfirmationResult);
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
  const databaseStatus = toDatabaseBookingStatus(status);
  if (databaseStatus === canonicalToDatabaseStatus.confirmed) {
    return confirmBooking(client, bookingId, options);
  }

  try {
    return normalizeMutation(
      await updateBookingStatusSecure(client, { bookingId, databaseStatus }, options) as unknown as Record<string, unknown>,
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
    return (result.data || []) as ScheduledSession[];
  } catch (error) {
    throw normalizeApiError(error, 'تعذر تحميل الجلسات المجدولة.');
  }
};

export const authorizeSessionJoin = async (
  client: ApiClient,
  sessionId: string,
  options: RequestOptions = {},
): Promise<SessionJoinAuthorizationResult> => {
  try {
    return await authorizeSessionJoinSecure(client, sessionId, options);
  } catch (error) {
    throw normalizeApiError(error, 'تعذر التحقق من صلاحية دخول الجلسة.');
  }
};

export const getBookingInstructor = async (
  client: ApiClient,
  instructorId: number,
  options: RequestOptions = {},
): Promise<Instructor | null> => {
  const result = await applyAbortSignal(
    client.from('instructors').select('*').eq('id', instructorId).is('deleted_at', null).maybeSingle(),
    options.signal,
  );
  if (result.error) throw normalizeApiError(result.error, 'تعذر قراءة المدرب.');
  return (result.data || null) as Instructor | null;
};

export const getBookingPackage = async (
  client: ApiClient,
  packageName: string,
  options: RequestOptions = {},
): Promise<{ name: string } | null> => {
  const result = await applyAbortSignal(
    client.from('creative_writing_packages').select('name').eq('name', packageName).eq('is_active', true).is('deleted_at', null).maybeSingle(),
    options.signal,
  );
  if (result.error) throw normalizeApiError(result.error, 'تعذر قراءة باقة الكتابة.');
  return result.data as { name: string } | null;
};
