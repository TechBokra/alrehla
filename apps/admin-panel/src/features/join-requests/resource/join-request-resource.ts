'use client';

import { defineResource, normalizeResourceList } from '@alrehla/admin-core/resource';
import { communicationService } from '../../../services/communicationService';
import type { JoinRequest, RequestStatus } from '@alrehla/types';
import { joinRequestColumns } from '../columns/join-request-columns';
import { adminDashboardKeys } from '../../../hooks/queries/admin/keys';
import {
  joinRequestKeys,
  joinRequestListQuery,
  joinRequestListQueryKey,
} from '../api/queries';

export const joinRequestResource = defineResource<
  JoinRequest,
  never,
  RequestStatus,
  Awaited<ReturnType<typeof joinRequestListQuery>>
>({
  scope: 'global',
  metadata: {
    name: 'join-requests',
    label: 'طلبات الانضمام للفريق',
    singularLabel: 'طلب انضمام',
    pluralLabel: 'طلبات الانضمام',
    description: 'مراجعة طلبات الانضمام المقدمة من أعضاء الفريق المحتملين.',
  },
  capabilities: {
    create: false,
    update: true,
    delete: false,
    import: false,
    export: false,
    selection: false,
    bulkActions: false,
  },
  authorization: {
    read: 'canManageJoinRequests',
    update: 'canManageJoinRequests',
  },
  query: {
    queryKey: ({ state }) => joinRequestListQueryKey(state),
    queryFn: ({ state }) => joinRequestListQuery(state),
    normalize: (rows) => normalizeResourceList(rows, rows.length),
  },
  mutations: {
    update: {
      mutationKey: ['admin', 'mutations', 'join-requests', 'status'],
      mutationFn: ({ record, values }) =>
        communicationService.updateJoinRequestStatus(record.id, values),
      getInput: ({ record, values }) => ({ record, values }),
      invalidate: [joinRequestKeys.all, adminDashboardKeys.all],
      successMessage: 'تم تحديث حالة الطلب.',
    },
  },
  dataView: {
    columns: joinRequestColumns,
    getRowId: (request) => request.id,
    search: {
      placeholder: 'ابحث بالاسم أو الدور المطلوب...',
      debounceMs: 300,
      ariaLabel: 'بحث في طلبات الانضمام',
    },
    filters: [
      {
        id: 'status',
        label: 'كل الحالات',
        type: 'status',
        options: [
          { label: 'جديد', value: 'جديد' },
          { label: 'تمت المراجعة', value: 'تمت المراجعة' },
          { label: 'مقبول', value: 'مقبول' },
          { label: 'مرفوض', value: 'مرفوض' },
        ],
      },
    ],
    processingMode: 'client',
    pageSizeOptions: [1000],
    urlState: {
      defaults: {
        page: 1,
        pageSize: 1000,
        sorting: [{ id: 'created_at', desc: true }],
      },
      allowedSortIds: ['name', 'role', 'created_at', 'status'],
    },
  },
  emptyState: {
    title: 'لا توجد طلبات انضمام',
    description: 'لا توجد طلبات تطابق البحث أو الفلاتر الحالية.',
  },
});

export { joinRequestKeys };
