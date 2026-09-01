'use client';

import type { ApiClient } from '@alrehla/api-client';
import { sessionKeys } from '@alrehla/api-client/query-keys';
import {
  listScheduledSessions,
} from '@alrehla/api-client/resources/bookings';
import { defineResource, normalizeResourceList } from '@alrehla/admin-core/resource';
import type { ScheduledSession } from '@alrehla/types';
import { StatusBadge } from '@alrehla/ui/status-badge';

const resolveInstructorId = (instructorId?: number | null): number | undefined =>
  typeof instructorId === 'number' &&
  Number.isSafeInteger(instructorId) &&
  instructorId > 0
    ? instructorId
    : undefined;

const normalizeBookingIds = (bookingIds?: readonly string[]): string[] => [
  ...new Set(
    (bookingIds ?? []).filter(
      (id) => typeof id === 'string' && id.trim().length > 0,
    ),
  ),
].sort();

const sessionColumns = [
  {
    accessorKey: 'session_date',
    header: 'تاريخ الجلسة',
  },
  {
    id: 'student',
    accessorFn: (row) => row.child_name ?? row.child_profiles?.name ?? '',
    header: 'الطالب',
  },
  {
    accessorKey: 'booking_id',
    header: 'الحجز',
  },
  {
    accessorKey: 'status',
    header: 'الحالة',
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  },
];

export interface InstructorSessionsResourceOptions {
  /** Numeric instructors.id, resolved from the Instructor domain record. */
  instructorId?: number | null;
  bookingIds?: readonly string[];
  client: ApiClient;
}

export function createInstructorSessionsResource({
  instructorId,
  bookingIds,
  client,
}: InstructorSessionsResourceOptions) {
  const validInstructorId = resolveInstructorId(instructorId);
  const normalizedBookingIds = normalizeBookingIds(bookingIds);

  return defineResource<ScheduledSession, never, never, ScheduledSession[]>({
    scope: 'global',
    metadata: {
      name: 'instructor-sessions',
      label: 'الجلسات',
      singularLabel: 'جلسة',
      pluralLabel: 'الجلسات',
      description: 'استعراض الجلسات المجدولة المرتبطة بحجوزات المدرّس.',
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
      queryKey: () =>
        sessionKeys.list({
          ...(validInstructorId === undefined ? {} : { instructorId: validInstructorId }),
          bookingIds: normalizedBookingIds,
        }),
      queryFn: ({ signal }) => {
        if (validInstructorId === undefined || normalizedBookingIds.length === 0) return [];
        return listScheduledSessions(
          client,
          {
            instructorId: validInstructorId,
            bookingIds: normalizedBookingIds,
          },
          { signal },
        );
      },
      normalize: (rows) => normalizeResourceList(rows, rows.length),
      enabled: () =>
        validInstructorId !== undefined && normalizedBookingIds.length > 0,
    },
    dataView: {
      columns: sessionColumns,
      getRowId: (session) => session.id,
      checkbox: false,
      selection: { enabled: false },
      processingMode: 'client',
      pageSizeOptions: [20, 50, 100],
      urlState: {
        defaults: { page: 1, pageSize: 20 },
      },
    },
    emptyState: {
      title: 'لا توجد جلسات',
      description: 'لا توجد جلسات مجدولة مرتبطة بالحجوزات الحالية.',
    },
  });
}

export { normalizeBookingIds };
