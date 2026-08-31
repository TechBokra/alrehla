import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createDataViewState, type DataViewState } from '@alrehla/admin-core/data-view';
import {
  scopeResourceKey,
  type ResourceMutationExecutionContext,
} from '@alrehla/admin-core/resource';
import type {
  JoinRequest,
  SupportTicket,
} from '@alrehla/types';
import {
  filterSupportTickets,
  supportKeys,
  supportListParams,
  supportListQuery,
} from '../src/features/support/api/queries';
import { supportResource } from '../src/features/support/resource/support-resource';
import {
  filterJoinRequests,
  joinRequestKeys,
  joinRequestListParams,
  joinRequestListQuery,
} from '../src/features/join-requests/api/queries';
import { joinRequestResource } from '../src/features/join-requests/resource/join-request-resource';
import { adminDashboardKeys } from '../src/hooks/queries/admin/keys';

const serviceMocks = vi.hoisted(() => ({
  getAllSupportTickets: vi.fn(),
  updateSupportTicketStatus: vi.fn(),
  getAllJoinRequests: vi.fn(),
  updateJoinRequestStatus: vi.fn(),
}));

vi.mock('../src/services/communicationService', () => ({
  communicationService: serviceMocks,
}));

const supportRows: SupportTicket[] = [
  {
    id: 'support-1',
    name: 'ليلى',
    email: 'layla@example.com',
    subject: 'مشكلة في الحساب',
    message: 'أحتاج مساعدة',
    status: 'جديدة',
    created_at: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 'support-2',
    name: 'سامي',
    email: 'sami@example.com',
    subject: 'استفسار عام',
    message: 'استفسار',
    status: 'مغلقة',
    created_at: '2026-08-21T10:00:00.000Z',
  },
];

const joinRows: JoinRequest[] = [
  {
    id: 'join-1',
    name: 'نور',
    email: 'noor@example.com',
    phone: '01000000000',
    role: 'كاتب',
    message: 'أرغب في الانضمام',
    status: 'جديد',
    created_at: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 'join-2',
    name: 'عمر',
    email: 'omar@example.com',
    phone: '01100000000',
    role: 'محرر',
    message: 'خبرة في التحرير',
    status: 'مقبول',
    created_at: '2026-08-21T10:00:00.000Z',
  },
];

function state(partial: Partial<DataViewState> = {}) {
  return createDataViewState({
    pagination: { pageIndex: 0, pageSize: 1000 },
    ...partial,
  });
}

function mutationContext(): ResourceMutationExecutionContext {
  return {
    client: new QueryClient(),
    mutationKey: [],
    meta: undefined,
    signal: new AbortController().signal,
  };
}

describe('Support and Join Requests Resource Wave 1 contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.getAllSupportTickets.mockResolvedValue(supportRows);
    serviceMocks.getAllJoinRequests.mockResolvedValue(joinRows);
    serviceMocks.updateSupportTicketStatus.mockResolvedValue({ success: true });
    serviceMocks.updateJoinRequestStatus.mockResolvedValue({ success: true });
  });

  it('keeps canonical resource-relative key hierarchies and applies one global scope', () => {
    expect(supportKeys.all).toEqual(['adminSupportTickets']);
    expect(supportKeys.lists()).toEqual(['adminSupportTickets', 'lists']);
    expect(supportKeys.list({ search: 'ليلى', status: 'جديدة' })).toEqual([
      'adminSupportTickets',
      'lists',
      { search: 'ليلى', status: 'جديدة' },
    ]);
    expect(supportKeys.details()).toEqual(['adminSupportTickets', 'details']);
    expect(supportKeys.detail('support-1')).toEqual([
      'adminSupportTickets',
      'details',
      'support-1',
    ]);

    expect(joinRequestKeys.all).toEqual(['adminJoinRequests']);
    expect(joinRequestKeys.lists()).toEqual(['adminJoinRequests', 'lists']);
    expect(joinRequestKeys.list({ status: 'مقبول' })).toEqual([
      'adminJoinRequests',
      'lists',
      { status: 'مقبول' },
    ]);
    expect(joinRequestKeys.details()).toEqual(['adminJoinRequests', 'details']);
    expect(joinRequestKeys.detail('join-1')).toEqual([
      'adminJoinRequests',
      'details',
      'join-1',
    ]);

    expect(supportResource.scope).toBe('global');
    expect(joinRequestResource.scope).toBe('global');
    expect(scopeResourceKey('global', supportKeys.all)).toEqual([
      'global',
      'adminSupportTickets',
    ]);
    expect(scopeResourceKey('global', joinRequestKeys.all)).toEqual([
      'global',
      'adminJoinRequests',
    ]);
    expect(supportResource.query?.queryKey({ state: state() })).not.toContain('global');
    expect(joinRequestResource.query?.queryKey({ state: state() })).not.toContain('global');
  });

  it('preserves Support search/status semantics and service-backed querying', async () => {
    const all = await supportListQuery(state());
    expect(serviceMocks.getAllSupportTickets).toHaveBeenCalledOnce();
    expect(all).toEqual(supportRows);

    expect(filterSupportTickets(supportRows, { search: 'الحساب' })).toEqual([supportRows[0]]);
    expect(filterSupportTickets(supportRows, { search: 'layla@example.com' })).toEqual([]);
    expect(filterSupportTickets(supportRows, { status: 'مغلقة' })).toEqual([supportRows[1]]);
    expect(supportListParams(state({ search: 'سامي', filters: { status: 'مغلقة' } }))).toEqual({
      search: 'سامي',
      status: 'مغلقة',
    });
  });

  it('preserves Join Request search/status semantics and service-backed querying', async () => {
    const all = await joinRequestListQuery(state());
    expect(serviceMocks.getAllJoinRequests).toHaveBeenCalledOnce();
    expect(all).toEqual(joinRows);

    expect(filterJoinRequests(joinRows, { search: 'كاتب' })).toEqual([joinRows[0]]);
    expect(filterJoinRequests(joinRows, { search: 'noor@example.com' })).toEqual([]);
    expect(filterJoinRequests(joinRows, { status: 'مقبول' })).toEqual([joinRows[1]]);
    expect(joinRequestListParams(state({ search: 'عمر', filters: { status: 'مقبول' } }))).toEqual({
      search: 'عمر',
      status: 'مقبول',
    });
  });

  it('preserves descending created-date defaults and existing status values', () => {
    expect(supportResource.dataView.urlState?.defaults?.sorting).toEqual([
      { id: 'created_at', desc: true },
    ]);
    expect(joinRequestResource.dataView.urlState?.defaults?.sorting).toEqual([
      { id: 'created_at', desc: true },
    ]);
    expect(supportResource.dataView.filters?.[0].options?.map((option) => option.value)).toEqual([
      'جديدة',
      'تمت المراجعة',
      'مغلقة',
    ]);
    expect(joinRequestResource.dataView.filters?.[0].options?.map((option) => option.value)).toEqual([
      'جديد',
      'تمت المراجعة',
      'مقبول',
      'مرفوض',
    ]);
  });

  it('calls the existing Support mutation with the unchanged record/status payload', async () => {
    const update = supportResource.mutations?.update;
    if (!update) throw new Error('Support update mutation is not configured.');

    const input = update.getInput({ record: supportRows[0], values: 'تمت المراجعة' });
    await update.mutationFn(input, mutationContext());

    expect(serviceMocks.updateSupportTicketStatus).toHaveBeenCalledWith(
      'support-1',
      'تمت المراجعة',
    );
    expect(supportResource.mutations?.update?.successMessage).toBe('تم تحديث حالة الرسالة.');
  });

  it('calls the existing Join Request mutation with the unchanged record/status payload', async () => {
    const update = joinRequestResource.mutations?.update;
    if (!update) throw new Error('Join Request update mutation is not configured.');

    const input = update.getInput({ record: joinRows[0], values: 'تمت المراجعة' });
    await update.mutationFn(input, mutationContext());

    expect(serviceMocks.updateJoinRequestStatus).toHaveBeenCalledWith(
      'join-1',
      'تمت المراجعة',
    );
    expect(joinRequestResource.mutations?.update?.successMessage).toBe('تم تحديث حالة الطلب.');
  });

  it('targets only the resource compatibility root and existing dashboard namespace', () => {
    expect(supportResource.mutations?.update?.invalidate).toEqual([
      supportKeys.all,
      adminDashboardKeys.all,
    ]);
    expect(joinRequestResource.mutations?.update?.invalidate).toEqual([
      joinRequestKeys.all,
      adminDashboardKeys.all,
    ]);
    expect(scopeResourceKey('global', adminDashboardKeys.all)).toEqual([
      'global',
      'adminDashboard',
    ]);
    expect(scopeResourceKey('global', supportKeys.all)).not.toEqual(
      scopeResourceKey('global', joinRequestKeys.all),
    );
  });

  it('keeps the migrated resources fail-closed at the existing permission boundary', () => {
    expect(supportResource.authorization).toEqual({
      read: 'canManageSupportTickets',
      update: 'canManageSupportTickets',
    });
    expect(joinRequestResource.authorization).toEqual({
      read: 'canManageJoinRequests',
      update: 'canManageJoinRequests',
    });
  });
});
