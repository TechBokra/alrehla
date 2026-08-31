import type {
  BookingAvailability,
  BookingConfirmationResult,
  BookingCreationResult,
  BookingStatusUpdateResult,
  DatabaseBookingStatus,
  Instructor,
  Json,
  ScheduledSession,
  SessionJoinAuthorizationResult,
  SessionStatus,
} from '@alrehla/types';

import { ApiError } from '../../errors';
import type { BookingMutationResult, BookingRecord } from './types';
import {
  canonicalToDatabaseStatus,
  toCanonicalBookingStatus,
} from './status';

export type RecordValue = Record<string, unknown>;

export const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const contractError = (message: string, details?: unknown): ApiError =>
  new ApiError(message, {
    type: 'contract',
    code: 'API_CONTRACT_ERROR',
    details,
  });

const requiredString = (record: RecordValue, key: string, message: string): string => {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) throw contractError(message, { key, value });
  return value;
};

const optionalString = (
  record: RecordValue,
  key: string,
  message: string,
): string | undefined => {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw contractError(message, { key, value });
  return value;
};

const nullableString = (
  record: RecordValue,
  key: string,
  message: string,
): string | null => {
  const value = record[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw contractError(message, { key, value });
  return value;
};

const optionalNullableString = (
  record: RecordValue,
  key: string,
  message: string,
): string | null | undefined => {
  const value = record[key];
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string' || !value.trim()) throw contractError(message, { key, value });
  return value;
};

const requiredNumber = (record: RecordValue, key: string, message: string): number => {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw contractError(message, { key, value });
  }
  return value;
};

const positiveInteger = (record: RecordValue, key: string, message: string): number => {
  const value = requiredNumber(record, key, message);
  if (!Number.isSafeInteger(value) || value <= 0) throw contractError(message, { key, value });
  return value;
};

const nonNegativeInteger = (record: RecordValue, key: string, message: string): number => {
  const value = requiredNumber(record, key, message);
  if (!Number.isSafeInteger(value) || value < 0) throw contractError(message, { key, value });
  return value;
};

const optionalPositiveInteger = (
  record: RecordValue,
  key: string,
  message: string,
): number | undefined => {
  if (record[key] === undefined || record[key] === null) return undefined;
  return positiveInteger(record, key, message);
};

const optionalFiniteNumber = (
  record: RecordValue,
  key: string,
  message: string,
): number | undefined => {
  if (record[key] === undefined || record[key] === null) return undefined;
  return requiredNumber(record, key, message);
};

const optionalNonNegativeInteger = (
  record: RecordValue,
  key: string,
  message: string,
): number | undefined => {
  if (record[key] === undefined || record[key] === null) return undefined;
  return nonNegativeInteger(record, key, message);
};

const optionalBoolean = (
  record: RecordValue,
  key: string,
  message: string,
): boolean | undefined => {
  if (record[key] === undefined || record[key] === null) return undefined;
  return requiredBoolean(record, key, message);
};

const requiredBoolean = (record: RecordValue, key: string, message: string): boolean => {
  const value = record[key];
  if (typeof value !== 'boolean') throw contractError(message, { key, value });
  return value;
};

const optionalStringArray = (
  record: RecordValue,
  key: string,
  message: string,
): string[] | undefined => {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw contractError(message, { key, value });
  }
  return value;
};

const isJsonValue = (value: unknown): value is Json => {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isRecord(value) && Object.values(value).every(isJsonValue);
};

const optionalJson = (record: RecordValue, key: string): Json | null | undefined => {
  const value = record[key];
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isJsonValue(value)) throw contractError(`قيمة ${key} المُرجعة من الخادم غير صالحة.`, value);
  return value;
};

const normalizeSingleRelation = <T>(
  value: unknown,
  normalize: (candidate: unknown) => T,
  relationName: string,
): T | null => {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (value.length !== 1) throw contractError(`علاقة ${relationName} المُرجعة من الخادم غير صالحة.`, value);
    return normalize(value[0]);
  }
  return normalize(value);
};

const normalizeChildRelation = (value: unknown): { name: string; avatar_url?: string | null } => {
  if (!isRecord(value)) throw contractError('علاقة ملف الطفل المُرجعة من الخادم غير صالحة.', value);
  return {
    name: requiredString(value, 'name', 'اسم الطفل المُرجع من الخادم غير صالح.'),
    avatar_url: nullableString(value, 'avatar_url', 'رابط صورة الطفل المُرجع من الخادم غير صالح.'),
  };
};

const normalizeInstructorRelation = (value: unknown): { name: string; user_id?: string } => {
  if (!isRecord(value)) throw contractError('علاقة المدرب المُرجعة من الخادم غير صالحة.', value);
  return {
    name: requiredString(value, 'name', 'اسم المدرب المُرجع من الخادم غير صالح.'),
    user_id: optionalString(value, 'user_id', 'معرّف مستخدم المدرب المُرجع من الخادم غير صالح.'),
  };
};

const normalizeUserRelation = (value: unknown): { name: string; email: string } => {
  if (!isRecord(value)) throw contractError('علاقة المستخدم المُرجعة من الخادم غير صالحة.', value);
  return {
    name: requiredString(value, 'name', 'اسم المستخدم المُرجع من الخادم غير صالح.'),
    email: requiredString(value, 'email', 'بريد المستخدم المُرجع من الخادم غير صالح.'),
  };
};

const normalizeDatabaseStatus = (value: unknown): {
  status: ReturnType<typeof toCanonicalBookingStatus>;
  databaseStatus: DatabaseBookingStatus;
} => {
  const status = toCanonicalBookingStatus(value);
  return { status, databaseStatus: canonicalToDatabaseStatus[status] };
};

const oneRecord = (value: unknown, message: string): RecordValue => {
  if (Array.isArray(value)) {
    if (value.length !== 1) throw contractError(message, value);
    value = value[0];
  }
  if (!isRecord(value)) throw contractError(message, value);
  return value;
};

export const normalizeBookingRecord = (value: unknown): BookingRecord => {
  if (!isRecord(value)) throw contractError('نتيجة الحجز المُرجعة من الخادم غير صالحة.', value);
  const normalizedStatus = normalizeDatabaseStatus(value.status);
  return {
    id: requiredString(value, 'id', 'معرّف الحجز المُرجع من الخادم غير صالح.'),
    user_id: requiredString(value, 'user_id', 'معرّف مستخدم الحجز المُرجع من الخادم غير صالح.'),
    child_id: positiveInteger(value, 'child_id', 'معرّف طفل الحجز المُرجع من الخادم غير صالح.'),
    instructor_id: positiveInteger(value, 'instructor_id', 'معرّف مدرب الحجز المُرجع من الخادم غير صالح.'),
    package_name: requiredString(value, 'package_name', 'اسم باقة الحجز المُرجع من الخادم غير صالح.'),
    booking_date: requiredString(value, 'booking_date', 'تاريخ الحجز المُرجع من الخادم غير صالح.'),
    booking_time: requiredString(value, 'booking_time', 'وقت الحجز المُرجع من الخادم غير صالح.'),
    total: requiredNumber(value, 'total', 'إجمالي الحجز المُرجع من الخادم غير صالح.'),
    ...normalizedStatus,
    receipt_url: nullableString(value, 'receipt_url', 'إيصال الحجز المُرجع من الخادم غير صالح.'),
    progress_notes: optionalString(value, 'progress_notes', 'ملاحظات الحجز المُرجعة من الخادم غير صالحة.'),
    details: optionalJson(value, 'details'),
    created_at: optionalString(value, 'created_at', 'تاريخ إنشاء الحجز المُرجع من الخادم غير صالح.'),
    child_profiles: normalizeSingleRelation(value.child_profiles, normalizeChildRelation, 'الطفل'),
    instructors: normalizeSingleRelation(value.instructors, normalizeInstructorRelation, 'المدرب'),
    users: normalizeSingleRelation(value.users, normalizeUserRelation, 'المستخدم'),
  };
};

export const normalizeBookingMutationResult = (value: unknown): BookingMutationResult => {
  const result = oneRecord(value, 'نتيجة عملية الحجز المُرجعة من الخادم غير صالحة.');
  const normalizedStatus = normalizeDatabaseStatus(result.status);
  return {
    id: requiredString(result, 'id', 'معرّف نتيجة عملية الحجز غير صالح.'),
    ...normalizedStatus,
    user_id: optionalString(result, 'user_id', 'معرّف مستخدم نتيجة الحجز غير صالح.'),
    child_id: optionalPositiveInteger(result, 'child_id', 'معرّف طفل نتيجة الحجز غير صالح.'),
    instructor_id: optionalPositiveInteger(result, 'instructor_id', 'معرّف مدرب نتيجة الحجز غير صالح.'),
    package_name: optionalString(result, 'package_name', 'اسم باقة نتيجة الحجز غير صالح.'),
    booking_date: optionalString(result, 'booking_date', 'تاريخ نتيجة الحجز غير صالح.'),
    booking_time: optionalString(result, 'booking_time', 'وقت نتيجة الحجز غير صالح.'),
    total: optionalFiniteNumber(result, 'total', 'إجمالي نتيجة الحجز غير صالح.'),
    receipt_url: result.receipt_url === undefined
      ? undefined
      : nullableString(result, 'receipt_url', 'إيصال نتيجة الحجز غير صالح.'),
    created_at: optionalString(result, 'created_at', 'تاريخ إنشاء نتيجة الحجز غير صالح.'),
    session_count: optionalNonNegativeInteger(result, 'session_count', 'عدد جلسات نتيجة الحجز غير صالح.'),
    idempotent: optionalBoolean(result, 'idempotent', 'قيمة تكرار نتيجة الحجز غير صالحة.'),
    released_future_sessions: optionalNonNegativeInteger(
      result,
      'released_future_sessions',
      'عدد الجلسات المُحررة من نتيجة الحجز غير صالح.',
    ),
  };
};

export const normalizeBookingCreationResult = (value: unknown): BookingCreationResult => {
  const result = oneRecord(value, 'نتيجة إنشاء الحجز المُرجعة من الخادم غير صالحة.');
  return {
    id: requiredString(result, 'id', 'معرّف نتيجة إنشاء الحجز غير صالح.'),
    user_id: requiredString(result, 'user_id', 'معرّف مستخدم نتيجة إنشاء الحجز غير صالح.'),
    child_id: positiveInteger(result, 'child_id', 'معرّف طفل نتيجة إنشاء الحجز غير صالح.'),
    instructor_id: positiveInteger(result, 'instructor_id', 'معرّف مدرب نتيجة إنشاء الحجز غير صالح.'),
    package_name: requiredString(result, 'package_name', 'اسم باقة نتيجة إنشاء الحجز غير صالح.'),
    booking_date: requiredString(result, 'booking_date', 'تاريخ نتيجة إنشاء الحجز غير صالح.'),
    booking_time: requiredString(result, 'booking_time', 'وقت نتيجة إنشاء الحجز غير صالح.'),
    total: requiredNumber(result, 'total', 'إجمالي نتيجة إنشاء الحجز غير صالح.'),
    status: normalizeDatabaseStatus(result.status).databaseStatus,
    receipt_url: nullableString(result, 'receipt_url', 'إيصال نتيجة إنشاء الحجز غير صالح.'),
    created_at: requiredString(result, 'created_at', 'تاريخ إنشاء نتيجة الحجز غير صالح.'),
  };
};

export const normalizeBookingConfirmationResult = (value: unknown): BookingConfirmationResult => {
  const result = oneRecord(value, 'نتيجة تأكيد الحجز المُرجعة من الخادم غير صالحة.');
  return {
    id: requiredString(result, 'id', 'معرّف نتيجة تأكيد الحجز غير صالح.'),
    status: normalizeDatabaseStatus(result.status).databaseStatus,
    session_count: nonNegativeInteger(result, 'session_count', 'عدد جلسات نتيجة التأكيد غير صالح.'),
    idempotent: requiredBoolean(result, 'idempotent', 'قيمة تكرار نتيجة التأكيد غير صالحة.'),
  };
};

export const normalizeBookingStatusUpdateResult = (value: unknown): BookingStatusUpdateResult => {
  const result = oneRecord(value, 'نتيجة تحديث حالة الحجز المُرجعة من الخادم غير صالحة.');
  return {
    id: requiredString(result, 'id', 'معرّف نتيجة تحديث حالة الحجز غير صالح.'),
    status: normalizeDatabaseStatus(result.status).databaseStatus,
    released_future_sessions: nonNegativeInteger(
      result,
      'released_future_sessions',
      'عدد الجلسات المُحررة من نتيجة تحديث الحالة غير صالح.',
    ),
  };
};

export const normalizeBookingAvailability = (value: unknown): BookingAvailability[] => {
  if (!Array.isArray(value)) throw contractError('قائمة مواعيد الحجز المُرجعة من الخادم غير صالحة.', value);
  return value.map((entry) => {
    if (!isRecord(entry)) throw contractError('موعد الحجز المُرجع من الخادم غير صالح.', entry);
    const status = requiredString(entry, 'status', 'حالة موعد الحجز المُرجعة من الخادم غير صالحة.');
    return {
      instructor_id: positiveInteger(entry, 'instructor_id', 'معرّف مدرب الموعد غير صالح.'),
      booking_date: requiredString(entry, 'booking_date', 'تاريخ الموعد المُرجع من الخادم غير صالح.'),
      booking_time: requiredString(entry, 'booking_time', 'وقت الموعد المُرجع من الخادم غير صالح.'),
      status,
    };
  });
};

const sessionStatuses: readonly SessionStatus[] = ['upcoming', 'completed', 'missed'];
const isSessionStatus = (value: unknown): value is SessionStatus =>
  typeof value === 'string' && sessionStatuses.some((status) => status === value);

export const normalizeScheduledSession = (value: unknown): ScheduledSession => {
  if (!isRecord(value)) throw contractError('الجلسة المجدولة المُرجعة من الخادم غير صالحة.', value);
  const status = value.status;
  if (!isSessionStatus(status)) throw contractError('حالة الجلسة المجدولة غير معروفة.', status);
  const childRelation = normalizeSingleRelation(value.child_profiles, normalizeChildRelation, 'الطفل');
  const instructorRelation = normalizeSingleRelation(value.instructors, normalizeInstructorRelation, 'المدرب');
  return {
    id: requiredString(value, 'id', 'معرّف الجلسة المجدولة غير صالح.'),
    booking_id: optionalNullableString(value, 'booking_id', 'معرّف حجز الجلسة غير صالح.'),
    subscription_id: optionalNullableString(value, 'subscription_id', 'معرّف اشتراك الجلسة غير صالح.'),
    child_id: positiveInteger(value, 'child_id', 'معرّف طفل الجلسة غير صالح.'),
    instructor_id: positiveInteger(value, 'instructor_id', 'معرّف مدرب الجلسة غير صالح.'),
    session_date: requiredString(value, 'session_date', 'تاريخ الجلسة المجدولة غير صالح.'),
    status,
    notes: optionalString(value, 'notes', 'ملاحظات الجلسة المجدولة غير صالحة.'),
    child_profiles: childRelation,
    instructors: instructorRelation,
    child_name: childRelation?.name,
    instructor_name: instructorRelation?.name,
    package_name: optionalString(value, 'package_name', 'اسم باقة الجلسة غير صالح.'),
    type: optionalString(value, 'type', 'نوع الجلسة غير صالح.'),
    booking_status: optionalString(value, 'booking_status', 'حالة حجز الجلسة غير صالحة.'),
  };
};

export const normalizeSessionJoinAuthorizationResult = (
  value: unknown,
): SessionJoinAuthorizationResult => {
  const result = oneRecord(value, 'نتيجة صلاحية دخول الجلسة المُرجعة من الخادم غير صالحة.');
  const reason = result.reason;
  const reasons: readonly SessionJoinAuthorizationResult['reason'][] = [
    'allowed',
    'too_early',
    'expired',
    'booking_inactive',
    'session_closed',
  ];
  const isReason = (candidate: unknown): candidate is SessionJoinAuthorizationResult['reason'] =>
    typeof candidate === 'string' && reasons.some((knownReason) => knownReason === candidate);
  if (!isReason(reason)) {
    throw contractError('سبب صلاحية دخول الجلسة غير معروف.', reason);
  }
  return {
    allowed: requiredBoolean(result, 'allowed', 'قيمة صلاحية دخول الجلسة غير صالحة.'),
    reason,
    session_id: requiredString(result, 'session_id', 'معرّف الجلسة المُرجع غير صالح.'),
    session_date: requiredString(result, 'session_date', 'تاريخ الجلسة المُرجع غير صالح.'),
    join_allowed_at: requiredString(result, 'join_allowed_at', 'وقت السماح بالدخول غير صالح.'),
    join_expires_at: requiredString(result, 'join_expires_at', 'وقت انتهاء الدخول غير صالح.'),
    domain: nullableString(result, 'domain', 'نطاق الجلسة المُرجع غير صالح.'),
    room_name: nullableString(result, 'room_name', 'اسم غرفة الجلسة المُرجع غير صالح.'),
  };
};

export const normalizePrice = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw contractError('السعر المُرجع من الخادم غير صالح.', value);
  }
  return value;
};

export const normalizeBoolean = (value: unknown, message: string): boolean => {
  if (typeof value !== 'boolean') throw contractError(message, value);
  return value;
};

const optionalNumber = (record: RecordValue, key: string, message: string): number | undefined => {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) throw contractError(message, { key, value });
  return value;
};

export const normalizeInstructor = (value: unknown): Instructor | null => {
  if (value === null) return null;
  if (!isRecord(value)) throw contractError('المدرب المُرجع من الخادم غير صالح.', value);
  return {
    id: positiveInteger(value, 'id', 'معرّف المدرب المُرجع غير صالح.'),
    user_id: requiredString(value, 'user_id', 'معرّف مستخدم المدرب المُرجع غير صالح.'),
    name: requiredString(value, 'name', 'اسم المدرب المُرجع غير صالح.'),
    slug: requiredString(value, 'slug', 'معرّف المدرب النصي المُرجع غير صالح.'),
    specialty: requiredString(value, 'specialty', 'تخصص المدرب المُرجع غير صالح.'),
    bio: requiredString(value, 'bio', 'نبذة المدرب المُرجعة غير صالحة.'),
    avatar_url: nullableString(value, 'avatar_url', 'رابط صورة المدرب المُرجع غير صالح.'),
    intro_video_url: optionalString(value, 'intro_video_url', 'فيديو المدرب المُرجع غير صالح.'),
    teaching_philosophy: optionalString(value, 'teaching_philosophy', 'فلسفة التدريس المُرجعة غير صالحة.'),
    expertise_areas: optionalStringArray(value, 'expertise_areas', 'مجالات خبرة المدرب المُرجعة غير صالحة.'),
    rate_per_session: optionalNumber(value, 'rate_per_session', 'سعر جلسة المدرب المُرجع غير صالح.'),
    deleted_at: nullableString(value, 'deleted_at', 'تاريخ حذف المدرب المُرجع غير صالح.'),
  };
};

export const normalizeBookingPackage = (value: unknown): { name: string } | null => {
  if (value === null) return null;
  if (!isRecord(value)) throw contractError('الباقة المُرجعة من الخادم غير صالحة.', value);
  return { name: requiredString(value, 'name', 'اسم الباقة المُرجعة من الخادم غير صالح.') };
};
