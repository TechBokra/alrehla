import { useMemo } from 'react';
import { useInstructorProfileQuery } from './useInstructorProfileQuery';
import { useInstructorBookingsQuery } from './useInstructorBookingsQuery';
import { useInstructorServiceOrdersQuery } from './useInstructorServiceOrdersQuery';
import { useInstructorPayoutsQuery } from './useInstructorPayoutsQuery';
export interface InstructorFinancialItem {
  netAmount: number;
  type: string;
  date: string;
  created_at?: string | null;
  package_name?: string;
  child_profiles?: { name?: string } | null;
  [key: string]: any;
}

export interface InstructorFinancialSummary {
  totalEarned: number;
  totalPaid: number;
  outstanding: number;
  recentItems: InstructorFinancialItem[];
}

export const useInstructorFinancials = () => {
  const profileQuery = useInstructorProfileQuery();
  const instructor = profileQuery.data ?? null;

  const bookingsQuery = useInstructorBookingsQuery(instructor?.id);
  const bookings = bookingsQuery.data ?? [];

  const serviceOrdersQuery = useInstructorServiceOrdersQuery(instructor?.id);
  const serviceOrders = serviceOrdersQuery.data ?? [];

  const payoutsQuery = useInstructorPayoutsQuery(instructor?.id);
  const payouts = payoutsQuery.data ?? [];

  const financialSummary = useMemo<InstructorFinancialSummary>(() => {
    if (!instructor) {
      return {
        totalEarned: 0,
        totalPaid: 0,
        outstanding: 0,
        recentItems: [],
      };
    }

    const bookingEarnings = (bookings || [])
      .filter(b => b.status === 'مكتمل')
      .map(b => {
        const netAmount =
          instructor.package_rates?.[b.package_name] ||
          (instructor.rate_per_session || 0 * 1);
        return {
          ...b,
          netAmount,
          type: 'جلسة/باقة',
          date: b.booking_date,
        };
      });

    const serviceEarnings = (serviceOrders || [])
      .filter(o => o.status === 'مكتمل')
      .map(o => {
        const netAmount =
          instructor.service_rates?.[o.service_id] || o.total * 0.7;
        return {
          ...o,
          netAmount,
          type: 'خدمة',
          date: o.created_at,
          package_name: (o as any).service_name || 'خدمة',
        };
      });

    const totalEarned = [...bookingEarnings, ...serviceEarnings].reduce(
      (sum, item) => sum + item.netAmount,
      0
    );
    const totalPaid = (payouts || []).reduce((sum, p) => sum + p.amount, 0);
    const outstanding = totalEarned - totalPaid;

    return {
      totalEarned,
      totalPaid,
      outstanding,
      recentItems: [...bookingEarnings, ...serviceEarnings]
        .sort(
          (a, b) =>
            new Date(b.created_at || b.date).getTime() -
            new Date(a.created_at || a.date).getTime()
        )
        .slice(0, 10),
    };
  }, [bookings, serviceOrders, payouts, instructor]);

  const isLoading =
    profileQuery.isLoading ||
    (Boolean(instructor) && bookingsQuery.isLoading) ||
    (Boolean(instructor) && serviceOrdersQuery.isLoading) ||
    (Boolean(instructor) && payoutsQuery.isLoading);

  const isFetching =
    profileQuery.isFetching ||
    bookingsQuery.isFetching ||
    serviceOrdersQuery.isFetching ||
    payoutsQuery.isFetching;

  const error =
    profileQuery.error ??
    bookingsQuery.error ??
    serviceOrdersQuery.error ??
    payoutsQuery.error ??
    null;

  return {
    instructor,
    bookings,
    serviceOrders,
    payouts,
    financialSummary,
    isLoading,
    isFetching,
    error,
    data: instructor
      ? {
          instructor,
          bookings,
          serviceOrders,
          payouts,
        }
      : null,
  };
};
