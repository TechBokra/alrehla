import { createResourceKeys } from './factory';

export const instructorKeys = createResourceKeys('instructors');
export const bookingKeys = {
  ...createResourceKeys('bookings'),
  availability: () => ['bookings', 'availability'] as const,
  quote: (packageName: string, instructorId: number) =>
    ['bookings', 'quote', packageName, instructorId] as const,
  sessions: (bookingId?: string) =>
    bookingId === undefined
      ? (['bookings', 'sessions'] as const)
      : (['bookings', 'sessions', bookingId] as const),
};
export const sessionKeys = createResourceKeys('sessions');
