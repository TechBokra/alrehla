import { useMemo } from 'react';
import { useInstructorProfileQuery } from './useInstructorProfileQuery';
import { useInstructorBookingsQuery } from './useInstructorBookingsQuery';
import { useInstructorSessionsQuery } from './useInstructorSessionsQuery';
import { usePackagesQuery } from './usePackagesQuery';
import {
  enrichInstructorBookings,
  getInstructorBookingIds,
  type InstructorEnrichedBooking,
} from './instructorCompositionHelpers';
import type { ScheduledSession } from '../../../lib/database.types';

export type EnrichedBooking = InstructorEnrichedBooking;

export interface DashboardSession extends ScheduledSession {
  child_name?: string;
  package_name?: string;
}

export const useInstructorOverview = () => {
  const profileQuery = useInstructorProfileQuery();
  const instructor = profileQuery.data ?? null;

  const bookingsQuery = useInstructorBookingsQuery(instructor?.id);
  const rawBookings = bookingsQuery.data ?? [];

  const bookingIds = useMemo(() => {
    return getInstructorBookingIds(rawBookings);
  }, [rawBookings]);

  const sessionsQuery = useInstructorSessionsQuery({
    instructorId: instructor?.id,
    bookingIds,
  });
  const rawSessions = sessionsQuery.data ?? [];

  const packagesQuery = usePackagesQuery();
  const packages = packagesQuery.data ?? [];

  const enrichedBookings = useMemo<EnrichedBooking[]>(() => {
    return enrichInstructorBookings(rawBookings, rawSessions, packages);
  }, [rawBookings, rawSessions, packages]);

  const allScheduledSessions = useMemo<DashboardSession[]>(() => {
    return enrichedBookings.flatMap(b =>
      (b.sessions || []).map(s => ({
        ...s,
        child_name: b.child_profiles?.name,
        package_name: b.package_name,
      }))
    );
  }, [enrichedBookings]);

  const upcomingSessionsCount = useMemo(() => {
    const now = new Date();
    return allScheduledSessions.filter(
      s => s.status === 'upcoming' && new Date(s.session_date) >= now
    ).length;
  }, [allScheduledSessions]);

  const activeJourneysCount = useMemo(() => {
    return enrichedBookings.filter(b => b.status === 'مؤكد').length;
  }, [enrichedBookings]);

  const introSessionsThisMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return enrichedBookings.filter(
      b =>
        b.package_name === 'الجلسة التعريفية' &&
        b.status === 'مكتمل' &&
        new Date(b.booking_date).getMonth() === currentMonth &&
        new Date(b.booking_date).getFullYear() === currentYear
    ).length;
  }, [enrichedBookings]);

  const introSessionGoalMet = introSessionsThisMonth >= 1;

  const isLoading =
    profileQuery.isLoading ||
    (Boolean(instructor) && bookingsQuery.isLoading) ||
    (Boolean(instructor && bookingIds.length > 0) && sessionsQuery.isLoading) ||
    packagesQuery.isLoading;

  const isFetching =
    profileQuery.isFetching ||
    bookingsQuery.isFetching ||
    sessionsQuery.isFetching ||
    packagesQuery.isFetching;

  const error =
    profileQuery.error ??
    bookingsQuery.error ??
    sessionsQuery.error ??
    packagesQuery.error ??
    null;

  return {
    instructor,
    bookings: enrichedBookings,
    allScheduledSessions,
    upcomingSessionsCount,
    activeJourneysCount,
    introSessionsThisMonth,
    introSessionGoalMet,
    isLoading,
    isFetching,
    error,
    // Compatible container for components expecting { data: { instructor, bookings, ... } }
    data: instructor
      ? {
          instructor,
          bookings: enrichedBookings,
          introSessionsThisMonth,
        }
      : null,
  };
};
