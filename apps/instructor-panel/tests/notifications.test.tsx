import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));
const authMock = vi.hoisted(() => ({ userId: 'user-a' as string | null }));
const addToastMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabaseClient', () => ({ supabase: supabaseMock }));
vi.mock('@clerk/nextjs', () => ({ useAuth: () => authMock }));
vi.mock('../src/contexts/ToastContext', () => ({
  useToast: () => ({ addToast: addToastMock }),
}));

import { AdminNavigationProvider } from '@alrehla/admin-core/navigation';
import { ResourceProvider, scopeResourceKey } from '@alrehla/admin-core/resource';
import type { Notification } from '@alrehla/types';
import { notificationKeys } from '../src/features/notifications/api/keys';
import {
  deleteNotification,
  filterNotifications,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../src/features/notifications/api/notifications';
import { useNotificationMutations } from '../src/features/notifications/api/hooks';
import { notificationResource } from '../src/features/notifications/resource/notification-resource';

const rows: Notification[] = [
  {
    id: 1,
    user_id: 'user-a',
    message: 'جلسة الحجز القادمة',
    link: '/schedule/1',
    type: 'booking',
    read: false,
    created_at: '2026-08-31T12:00:00.000Z',
  },
  {
    id: 2,
    user_id: 'user-a',
    message: 'تم تحديث الطلب',
    link: '/orders/2',
    type: 'order',
    read: true,
    created_at: '2026-08-30T12:00:00.000Z',
  },
  {
    id: 3,
    user_id: 'user-a',
    message: 'تنبيه عام',
    link: '#',
    type: 'admin_alert',
    read: false,
    created_at: '2026-08-29T12:00:00.000Z',
  },
];

function navigation() {
  return {
    pathname: '/notifications',
    searchParams: new URLSearchParams(),
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  };
}

afterEach(() => {
  supabaseMock.from.mockReset();
  addToastMock.mockReset();
  authMock.userId = 'user-a';
});

describe('Instructor Notifications architecture', () => {
  it('keeps a resource-relative hierarchical key and applies one global scope prefix', () => {
    expect(notificationKeys.all).toEqual(['userNotifications']);
    expect(notificationKeys.user('user-a')).toEqual(['userNotifications', 'user-a']);
    expect(notificationKeys.lists('user-a')).toEqual([
      'userNotifications',
      'user-a',
      'lists',
    ]);
    expect(notificationKeys.list('user-a', { tab: 'booking', search: 'جلسة' })).toEqual([
      'userNotifications',
      'user-a',
      'lists',
      { search: 'جلسة', tab: 'booking' },
    ]);

    const scoped = scopeResourceKey('global', notificationKeys.list('user-a'));
    expect(scoped).toEqual(['global', 'userNotifications', 'user-a', 'lists', {}]);
    expect(scoped.filter((part) => part === 'global')).toHaveLength(1);
    expect(scopeResourceKey('global', scoped)).toEqual(scoped);
    expect(scoped).not.toEqual(scopeResourceKey('global', notificationKeys.list('user-b')));
  });

  it('keeps User A and User B cache namespaces independent', async () => {
    const queryClient = new QueryClient();
    const keyA = scopeResourceKey('global', notificationKeys.list('user-a'));
    const keyB = scopeResourceKey('global', notificationKeys.list('user-b'));

    queryClient.setQueryData(keyA, rows);
    queryClient.setQueryData(keyB, rows.map((row) => ({ ...row, user_id: 'user-b' })));
    await queryClient.invalidateQueries({ queryKey: scopeResourceKey('global', notificationKeys.lists('user-a')) });

    expect(queryClient.getQueryState(keyA)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(keyB)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryData(keyB)).toEqual(
      rows.map((row) => ({ ...row, user_id: 'user-b' })),
    );
  });

  it('preserves the exact notification query predicates and descending ordering', async () => {
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    supabaseMock.from.mockReturnValue({ select });

    await expect(listNotifications('user-a')).resolves.toEqual(rows);
    expect(supabaseMock.from).toHaveBeenCalledWith('notifications');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-a');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('preserves all, unread, booking/session, and message/type search semantics', () => {
    expect(filterNotifications(rows)).toEqual(rows);
    expect(filterNotifications(rows, { tab: 'unread' })).toEqual([rows[0], rows[2]]);
    expect(filterNotifications(rows, { tab: 'booking' })).toEqual([rows[0]]);
    expect(filterNotifications(rows, { search: 'تحديث' })).toEqual([rows[1]]);
    expect(filterNotifications(rows, { search: 'ADMIN_ALERT' })).toEqual([rows[2]]);
    expect(filterNotifications(rows, { tab: 'booking', search: 'جلسة' })).toEqual([rows[0]]);
  });

  it('preserves mutation inputs and outcomes for read, mark-all, and delete', async () => {
    const updateReadEq = vi.fn().mockResolvedValue({ error: null });
    supabaseMock.from.mockReturnValueOnce({
      update: vi.fn(() => ({ eq: updateReadEq })),
    });
    await expect(markNotificationAsRead(1)).resolves.toEqual({ success: true });
    expect(updateReadEq).toHaveBeenCalledWith('id', 1);

    const updateAllEq = vi.fn().mockResolvedValue({ error: null });
    supabaseMock.from.mockReturnValueOnce({
      update: vi.fn(() => ({ eq: updateAllEq })),
    });
    await expect(markAllNotificationsAsRead('user-a')).resolves.toEqual({ success: true });
    expect(updateAllEq).toHaveBeenCalledWith('user_id', 'user-a');

    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    supabaseMock.from.mockReturnValueOnce({
      delete: vi.fn(() => ({ eq: deleteEq })),
    });
    await expect(deleteNotification(3)).resolves.toEqual({ success: true });
    expect(deleteEq).toHaveBeenCalledWith('id', 3);
  });

  it('uses Mutation Core with a current-user-only invalidation namespace', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    supabaseMock.from.mockReturnValue({
      update: vi.fn(() => ({ eq: updateEq })),
    });
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const keyA = scopeResourceKey('global', notificationKeys.list('user-a'));
    const keyB = scopeResourceKey('global', notificationKeys.list('user-b'));
    queryClient.setQueryData(keyA, rows);
    queryClient.setQueryData(keyB, rows.map((row) => ({ ...row, user_id: 'user-b' })));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useNotificationMutations(), { wrapper });

    await result.current.markNotificationAsRead.mutateAsync({ notificationId: 1 });
    await waitFor(() => expect(updateEq).toHaveBeenCalledWith('id', 1));

    expect(queryClient.getQueryState(keyA)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(keyB)?.isInvalidated).toBe(false);
    expect(addToastMock).not.toHaveBeenCalled();

    const updateAllEq = vi.fn().mockResolvedValue({ error: null });
    supabaseMock.from.mockReturnValueOnce({
      update: vi.fn(() => ({ eq: updateAllEq })),
    });
    await result.current.markAllNotificationsAsRead.mutateAsync();
    expect(updateAllEq).toHaveBeenCalledWith('user_id', 'user-a');
    expect(addToastMock).toHaveBeenCalledWith('تم تحديد الكل كمقروء', 'success');

    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    supabaseMock.from.mockReturnValueOnce({
      delete: vi.fn(() => ({ eq: deleteEq })),
    });
    await result.current.deleteNotification.mutateAsync({ notificationId: 3 });
    expect(deleteEq).toHaveBeenCalledWith('id', 3);
    expect(addToastMock).toHaveBeenCalledWith('تم حذف الإشعار', 'info');
  });

  it('declares Resource mutations with relative invalidation keys', () => {
    const update = notificationResource.mutations?.update;
    const remove = notificationResource.mutations?.delete;
    expect(update).toBeDefined();
    expect(remove).toBeDefined();
    if (update && typeof update.invalidateQueries === 'function') {
      expect(update.invalidateQueries({}, { record: rows[0], values: { action: 'read' } })).toEqual([
        notificationKeys.lists('user-a'),
      ]);
    }
    expect(remove?.getInput(rows[0])).toEqual({ notificationId: 1, userId: 'user-a' });
    if (remove && typeof remove.invalidateQueries === 'function') {
      expect(remove.invalidateQueries({}, { notificationId: 1, userId: 'user-a' })).toEqual([
        notificationKeys.lists('user-a'),
      ]);
    }
  });

  it('exposes the global Resource definition without an Admin authorization provider', () => {
    const nav = navigation();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    function Consumer() {
      return <span>{`${notificationResource.scope}:${notificationResource.metadata.name}`}</span>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AdminNavigationProvider navigation={nav} location={nav}>
          <ResourceProvider
            definition={notificationResource}
            executionContext={{ userId: 'user-a' }}
          >
            <Consumer />
          </ResourceProvider>
        </AdminNavigationProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText('global:instructor-notifications')).toBeTruthy();
  });

  it('normalizes resource results without changing rows or count', () => {
    const normalized = notificationResource.query?.normalize(rows);
    expect(normalized).toEqual({ rows, count: rows.length });
  });
});
