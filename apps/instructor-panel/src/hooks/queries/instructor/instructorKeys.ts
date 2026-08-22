export const instructorKeys = {
  all: ['instructor'] as const,

  profiles: () =>
    [...instructorKeys.all, 'profile'] as const,

  profile: (userId?: string) =>
    [...instructorKeys.profiles(), userId || ''] as const,

  bookings: () =>
    [...instructorKeys.all, 'bookings'] as const,

  bookingsByInstructor: (instructorId?: string | number) =>
    [...instructorKeys.bookings(), String(instructorId || '')] as const,

  sessions: () =>
    [...instructorKeys.all, 'sessions'] as const,

  sessionsByBookings: (instructorId: string | number, bookingIds: string[]) =>
    [
      ...instructorKeys.sessions(),
      String(instructorId),
      [...bookingIds].sort().join(','),
    ] as const,

  packages: () =>
    [...instructorKeys.all, 'packages'] as const,

  serviceOrders: () =>
    [...instructorKeys.all, 'service-orders'] as const,

  serviceOrdersByInstructor: (instructorId?: string | number) =>
    [...instructorKeys.serviceOrders(), String(instructorId || '')] as const,

  payouts: () =>
    [...instructorKeys.all, 'payouts'] as const,

  payoutsByInstructor: (instructorId?: string | number) =>
    [...instructorKeys.payouts(), String(instructorId || '')] as const,
};
