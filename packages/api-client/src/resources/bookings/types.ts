import type {
  BookingAvailability,
  ChildProfile,
  DatabaseBookingStatus,
  Json,
  Instructor,
  SessionJoinAuthorizationResult,
  ScheduledSession,
} from '@alrehla/types';
import type { ListResult } from '../../shared';
import type { ApiClient, RequestOptions } from '../../clients';
import type { BookingStatusInput, CanonicalBookingStatus } from './status';

export interface BookingRecord
  {
  id: string;
  user_id: string;
  child_id: number;
  instructor_id: number;
  package_name: string;
  booking_date: string;
  booking_time: string;
  total: number;
  status: CanonicalBookingStatus;
  databaseStatus: DatabaseBookingStatus;
  receipt_url: string | null;
  progress_notes?: string;
  details?: Json | null;
  created_at?: string;
  child_profiles?: (Partial<ChildProfile> & { name: string }) | null;
  instructors?: (Partial<Instructor> & { name: string }) | null;
  users?: { name: string; email: string } | null;
}

export interface ListBookingsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: BookingStatusInput | 'all' | 'active' | 'archived';
  statuses?: BookingStatusInput[];
  instructorId?: number;
  userId?: string;
  childProfileId?: number;
}

export interface CreateBookingInput {
  userId: string;
  childProfileId: number;
  instructorId: number;
  packageName: string;
  bookingDate: string;
  bookingTime: string;
  receiptUrl?: string | null;
  expectedTotal: number;
}

export interface BookingMutationResult {
  id: string;
  status: CanonicalBookingStatus;
  databaseStatus: DatabaseBookingStatus;
  user_id?: string;
  child_id?: number;
  instructor_id?: number;
  package_name?: string;
  booking_date?: string;
  booking_time?: string;
  total?: number;
  receipt_url?: string | null;
  created_at?: string;
  session_count?: number;
  idempotent?: boolean;
  released_future_sessions?: number;
}

export type BookingListResult = ListResult<BookingRecord>;

export interface ListScheduledSessionsParams {
  sessionId?: string;
  bookingId?: string;
  bookingIds?: string[];
  childProfileId?: number;
  instructorId?: number;
}

export interface BookingResource {
  listBookings(client: ApiClient, params?: ListBookingsParams, options?: RequestOptions): Promise<BookingListResult>;
  getBooking(client: ApiClient, bookingId: string, options?: RequestOptions): Promise<BookingRecord | null>;
  createBooking(client: ApiClient, input: CreateBookingInput, options?: RequestOptions): Promise<BookingMutationResult>;
  quoteBooking(client: ApiClient, packageName: string, instructorId: number, options?: RequestOptions): Promise<number>;
  getBookingAvailability(client: ApiClient, options?: RequestOptions): Promise<{ bookings: BookingAvailability[] }>;
  checkBookingSlotAvailability(client: ApiClient, instructorId: number, bookingDate: string, bookingTime: string, options?: RequestOptions): Promise<boolean>;
  confirmBooking(client: ApiClient, bookingId: string, options?: RequestOptions): Promise<BookingMutationResult>;
  updateBookingStatus(client: ApiClient, bookingId: string, status: BookingStatusInput, options?: RequestOptions): Promise<BookingMutationResult>;
  listScheduledSessions(client: ApiClient, params?: ListScheduledSessionsParams, options?: RequestOptions): Promise<ScheduledSession[]>;
  authorizeSessionJoin(client: ApiClient, sessionId: string, options?: RequestOptions): Promise<SessionJoinAuthorizationResult>;
  getBookingInstructor(client: ApiClient, instructorId: number, options?: RequestOptions): Promise<Instructor | null>;
  getBookingPackage(client: ApiClient, packageName: string, options?: RequestOptions): Promise<{ name: string } | null>;
}
