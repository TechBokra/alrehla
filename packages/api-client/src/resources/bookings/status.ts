import { ApiError } from '../../errors';
import type { DatabaseBookingStatus } from '@alrehla/types';

export type CanonicalBookingStatus =
  | 'pending_payment'
  | 'pending_review'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

/** Exhaustive mapping for the values persisted by the current database. */
export const databaseToCanonicalStatus: Record<DatabaseBookingStatus, CanonicalBookingStatus> = {
  'بانتظار الدفع': 'pending_payment',
  'بانتظار المراجعة': 'pending_review',
  'مؤكد': 'confirmed',
  'مكتمل': 'completed',
  'ملغي': 'cancelled',
};

/** Exhaustive mapping back to the existing database/RPC contract. */
export const canonicalToDatabaseStatus: Record<CanonicalBookingStatus, DatabaseBookingStatus> = {
  pending_payment: 'بانتظار الدفع',
  pending_review: 'بانتظار المراجعة',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export type BookingStatusInput = CanonicalBookingStatus;

const contractError = (value: unknown, direction: 'database' | 'canonical') =>
  new ApiError(
    direction === 'database'
      ? 'أعاد الخادم حالة حجز غير معروفة.'
      : 'حالة الحجز المطلوبة غير مدعومة.',
    {
      type: 'contract',
      code: 'BOOKING_STATUS_CONTRACT_ERROR',
      details: { value, direction },
    },
  );

export const toCanonicalBookingStatus = (value: unknown): CanonicalBookingStatus => {
  if (typeof value !== 'string') {
    throw contractError(value, 'database');
  }
  const status = (databaseToCanonicalStatus as Partial<Record<string, CanonicalBookingStatus>>)[value];
  if (!status) throw contractError(value, 'database');
  return status;
};

export const toDatabaseBookingStatus = (value: unknown): DatabaseBookingStatus => {
  if (typeof value !== 'string') throw contractError(value, 'canonical');
  const status = (canonicalToDatabaseStatus as Partial<Record<string, DatabaseBookingStatus>>)[value];
  if (!status) throw contractError(value, 'canonical');
  return status;
};
