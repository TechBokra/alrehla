import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ApiClient } from '@alrehla/api-client';
import { bookingKeys, sessionKeys } from '@alrehla/api-client/query-keys';
import type { BookingListResult, BookingRecord } from '@alrehla/api-client/resources/bookings';
import { createDataViewState } from '@alrehla/admin-core';
import { describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  listBookings: vi.fn(),
  listScheduledSessions: vi.fn(),
}));

vi.mock('@alrehla/api-client/resources/bookings', async () => {
  const actual = await vi.importActual<typeof import('@alrehla/api-client/resources/bookings')>(
    '@alrehla/api-client/resources/bookings',
  );
  return {
    ...actual,
    listBookings: apiMocks.listBookings,
    listScheduledSessions: apiMocks.listScheduledSessions,
  };
});

import {
  createInstructorBookingsResource,
  INSTRUCTOR_BOOKING_STATUSES,
} from '../src/features/bookings';
import {
  createInstructorSessionsResource,
  normalizeBookingIds,
} from '../src/features/sessions';

const client = {} as ApiClient;

const state = createDataViewState({
  search: ' BKG ',
  filters: { status: 'all' },
  pagination: { pageIndex: 1, pageSize: 20 },
});

const booking = {
  id: 'booking-1',
  user_id: 'user-1',
  child_id: 3,
  instructor_id: 42,
  package_name: 'رحلة الكتابة',
  booking_date: '2026-09-01',
  booking_time: '10:30',
  total: 350,
  status: 'completed',
  databaseStatus: 'مكتمل',
  receipt_url: null,
} as BookingRecord;

describe('Instructor Resource factory identity contracts', () => {
  it('disables Bookings for unresolved or invalid instructor domain IDs', () => {
    for (const instructorId of [undefined, null, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      const resource = createInstructorBookingsResource({ instructorId, client });
      expect(resource.query?.enabled?.({ state })).toBe(false);
    }
  });

  it('uses the numeric instructors.id in the Bookings key and API params', async () => {
    const resource = createInstructorBookingsResource({ instructorId: 42, client });
    const expectedParams = {
      page: 2,
      pageSize: 20,
      search: 'BKG',
      statuses: [...INSTRUCTOR_BOOKING_STATUSES],
      instructorId: 42,
    };
    const expectedKey = bookingKeys.list(expectedParams);

    expect(resource.query?.enabled?.({ state })).toBe(true);
    expect(resource.query?.queryKey({ state })).toEqual(expectedKey);

    const result: BookingListResult = { rows: [booking], total: 7 };
    apiMocks.listBookings.mockResolvedValueOnce(result);
    await expect(resource.query?.queryFn({ state })).resolves.toEqual(result);
    expect(apiMocks.listBookings).toHaveBeenCalledWith(client, expectedParams, {
      signal: undefined,
    });
    expect(resource.query?.normalize(result)).toEqual({ rows: [booking], count: 7 });
  });

  it('excludes only cancelled bookings through the canonical server status set', () => {
    expect(INSTRUCTOR_BOOKING_STATUSES).toEqual([
      'pending_payment',
      'pending_review',
      'confirmed',
      'completed',
    ]);
    expect(INSTRUCTOR_BOOKING_STATUSES).not.toContain('cancelled');
  });

  it('does not add client-side cancelled filtering after API pagination', () => {
    const source = readFileSync(
      resolve(import.meta.dirname, '../src/features/bookings/resource/instructor-bookings-resource.tsx'),
      'utf8',
    );

    expect(source).not.toMatch(/rows\.filter\(|status\s*!==\s*['"]cancelled['"]/);
  });

  it('normalizes Session booking IDs once for both key and API params', async () => {
    expect(normalizeBookingIds(['B', 'A', 'A'])).toEqual(['A', 'B']);

    const resource = createInstructorSessionsResource({
      instructorId: 42,
      bookingIds: ['B', 'A', 'A'],
      client,
    });
    const expectedParams = { instructorId: 42, bookingIds: ['A', 'B'] };

    expect(resource.query?.enabled?.({ state })).toBe(true);
    expect(resource.query?.queryKey({ state })).toEqual(sessionKeys.list(expectedParams));

    const rows = [{ id: 'session-1' }] as never[];
    apiMocks.listScheduledSessions.mockResolvedValueOnce(rows);
    await expect(resource.query?.queryFn({ state })).resolves.toEqual(rows);
    expect(apiMocks.listScheduledSessions).toHaveBeenCalledWith(client, expectedParams, {
      signal: undefined,
    });
    expect(resource.query?.normalize(rows)).toEqual({ rows, count: rows.length });
  });

  it('disables Sessions without a valid instructor domain ID or booking IDs', () => {
    const missingInstructor = createInstructorSessionsResource({
      instructorId: null,
      bookingIds: ['A'],
      client,
    });
    const missingBookings = createInstructorSessionsResource({
      instructorId: 42,
      bookingIds: [],
      client,
    });

    expect(missingInstructor.query?.enabled?.({ state })).toBe(false);
    expect(missingBookings.query?.enabled?.({ state })).toBe(false);
  });

  it('keeps the new Resource modules inside shared package boundaries', () => {
    const resourceFiles = [
      resolve(import.meta.dirname, '../src/features/bookings/resource/instructor-bookings-resource.tsx'),
      resolve(import.meta.dirname, '../src/features/sessions/resource/instructor-sessions-resource.tsx'),
    ];
    const source = resourceFiles.map((file) => readFileSync(file, 'utf8')).join('\n');

    expect(source).not.toMatch(/@supabase\/supabase-js|@alrehla\/supabase|\.from\(/);
    expect(source).not.toMatch(/database\.types|@tanstack\/react-query|useQuery\(/);
    expect(source).not.toMatch(/registerGlobal|create.*QueryKey|InstructorScheduledSession/);
    expect(source).not.toMatch(/userId|profile\.id|ResourceExecutionContext/);
  });
});
