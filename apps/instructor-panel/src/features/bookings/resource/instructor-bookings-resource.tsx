'use client';

import type { ApiClient } from '@alrehla/api-client';
import { bookingKeys } from '@alrehla/api-client/query-keys';
import {
  listBookings,
  type BookingListResult,
  type BookingRecord,
  type BookingStatusInput,
} from '@alrehla/api-client/resources/bookings';
import {
  defineResource,
  normalizeResourceList,
} from '@alrehla/admin-core/resource';
import type {
  DataViewFilterValue,
  DataViewQueryState,
} from '@alrehla/admin-core';
import { StatusBadge } from '@alrehla/ui/status-badge';

const INSTRUCTOR_BOOKING_STATUSES = [
  'pending_payment',
  'pending_review',
  'confirmed',
  'completed',
] as const satisfies readonly BookingStatusInput[];

type InstructorBookingStatus = (typeof INSTRUCTOR_BOOKING_STATUSES)[number];

const isInstructorBookingStatus = (
  value: DataViewFilterValue | undefined,
): value is InstructorBookingStatus =>
  typeof value === 'string' &&
  (INSTRUCTOR_BOOKING_STATUSES as readonly string[]).includes(value);

const resolveInstructorId = (instructorId?: number | null): number | undefined =>
  typeof instructorId === 'number' &&
  Number.isSafeInteger(instructorId) &&
  instructorId > 0
    ? instructorId
    : undefined;

const resolveBookingStatuses = (
  state: DataViewQueryState,
): BookingStatusInput[] => {
  const selectedStatus = state.filters.status;
  return isInstructorBookingStatus(selectedStatus)
    ? [selectedStatus]
    : [...INSTRUCTOR_BOOKING_STATUSES];
};

function toBookingListParams(
  state: DataViewQueryState,
  instructorId: number | undefined,
) {
  return {
    page: state.pagination.pageIndex + 1,
    pageSize: state.pagination.pageSize,
    ...(state.search.trim() ? { search: state.search.trim() } : {}),
    statuses: resolveBookingStatuses(state),
    ...(instructorId === undefined ? {} : { instructorId }),
  };
}

const bookingColumns = [
  {
    accessorKey: 'package_name',
    header: 'الباقة',
  },
  {
    id: 'student',
    accessorFn: (row) => row.child_profiles?.name ?? '',
    header: 'الطالب',
  },
  {
    accessorKey: 'booking_date',
    header: 'تاريخ الحجز',
  },
  {
    accessorKey: 'booking_time',
    header: 'وقت الحجز',
  },
  {
    accessorKey: 'status',
    header: 'الحالة',
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  },
  {
    accessorKey: 'total',
    header: 'الإجمالي',
  },
];

export interface InstructorBookingsResourceOptions {
  /** Numeric instructors.id, resolved from the Instructor domain record. */
  instructorId?: number | null;
  client: ApiClient;
}

export function createInstructorBookingsResource({
  instructorId,
  client,
}: InstructorBookingsResourceOptions) {
  const validInstructorId = resolveInstructorId(instructorId);

  return defineResource<BookingRecord, never, never, BookingListResult>({
    scope: 'global',
    metadata: {
      name: 'instructor-bookings',
      label: 'الحجوزات',
      singularLabel: 'حجز',
      pluralLabel: 'الحجوزات',
      description: 'استعراض حجوزات الطلاب المرتبطة بهذا المدرّس.',
    },
    capabilities: {
      create: false,
      update: false,
      delete: false,
      import: false,
      export: false,
      selection: false,
      bulkActions: false,
    },
    query: {
      queryKey: ({ state }) =>
        bookingKeys.list(toBookingListParams(state, validInstructorId)),
      queryFn: ({ state, signal }) => {
        if (validInstructorId === undefined) return { rows: [], total: 0 };
        return listBookings(
          client,
          toBookingListParams(state, validInstructorId),
          { signal },
        );
      },
      normalize: (response) => normalizeResourceList(response.rows, response.total),
      enabled: () => validInstructorId !== undefined,
    },
    dataView: {
      columns: bookingColumns,
      getRowId: (booking) => booking.id,
      search: {
        enabled: true,
        placeholder: 'بحث في الحجوزات...',
        ariaLabel: 'بحث في الحجوزات',
        debounceMs: 300,
      },
      filters: [
        {
          id: 'status',
          label: 'الحالة',
          type: 'status',
          options: [
            { value: 'all', label: 'كل الحالات' },
            { value: 'pending_payment', label: 'بانتظار الدفع' },
            { value: 'pending_review', label: 'بانتظار المراجعة' },
            { value: 'confirmed', label: 'مؤكد' },
            { value: 'completed', label: 'مكتمل' },
          ],
        },
      ],
      checkbox: false,
      selection: { enabled: false },
      enableColumnOrdering: true,
      processingMode: 'server',
      pageSizeOptions: [20, 50, 100],
      urlState: {
        defaults: { page: 1, pageSize: 20 },
      },
    },
    emptyState: {
      title: 'لا توجد حجوزات',
      description: 'لا توجد حجوزات تطابق البحث أو الفلاتر الحالية.',
    },
  });
}

export { INSTRUCTOR_BOOKING_STATUSES };
