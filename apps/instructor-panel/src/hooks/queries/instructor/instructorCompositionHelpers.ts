import type {
  CreativeWritingBooking,
  CreativeWritingPackage,
  ScheduledSession,
} from '../../../lib/database.types';

export interface InstructorEnrichedBooking extends CreativeWritingBooking {
  sessions: ScheduledSession[];
  packageDetails?: CreativeWritingPackage;
  child_profiles?: { id: number; name: string; avatar_url: string | null } | null;
}

export const getInstructorBookingIds = (bookings: CreativeWritingBooking[]) =>
  bookings.map((booking) => booking.id);

export const enrichInstructorBookings = (
  bookings: CreativeWritingBooking[],
  sessions: ScheduledSession[],
  packages: CreativeWritingPackage[],
): InstructorEnrichedBooking[] =>
  bookings.map((booking) => {
    const journeySessions = sessions.filter((session) => session.booking_id === booking.id);
    const packageDetails = packages.find((pkg) => pkg.name === booking.package_name);
    const child = (booking as any).child_profiles;

    return {
      ...booking,
      sessions: journeySessions,
      packageDetails,
      child_profiles: child
        ? { id: child.id, name: child.name, avatar_url: child.avatar_url }
        : null,
    };
  });
