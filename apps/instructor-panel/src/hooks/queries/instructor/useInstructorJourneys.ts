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

export type JourneyEnrichedBooking = InstructorEnrichedBooking;

export const useInstructorJourneys = () => {
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

  const enrichedBookings = useMemo<JourneyEnrichedBooking[]>(() => {
    return enrichInstructorBookings(rawBookings, rawSessions, packages);
  }, [rawBookings, rawSessions, packages]);

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
    isLoading,
    isFetching,
    error,
    data: instructor
      ? {
          instructor,
          bookings: enrichedBookings,
        }
      : null,
  };
};
