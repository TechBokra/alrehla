'use client';

import { defineResource, normalizeResourceList } from '@alrehla/admin-core/resource';
import { communicationService } from '../../../services/communicationService';
import type { SupportTicket, TicketStatus } from '@alrehla/types';
import { supportColumns } from '../columns/support-columns';
import { adminDashboardKeys } from '../../../hooks/queries/admin/keys';
import {
  supportKeys,
  supportListQuery,
  supportListQueryKey,
} from '../api/queries';

export const supportResource = defineResource<
  SupportTicket,
  never,
  TicketStatus,
  Awaited<ReturnType<typeof supportListQuery>>
>({
  scope: 'global',
  metadata: {
    name: 'support-tickets',
    label: 'رسائل الدعم',
    singularLabel: 'رسالة دعم',
    pluralLabel: 'رسائل الدعم',
    description: 'مراجعة رسائل الدعم الواردة ومتابعة حالتها.',
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
    read: 'canManageSupportTickets',
    update: 'canManageSupportTickets',
  },
  query: {
    queryKey: ({ state }) => supportListQueryKey(state),
    queryFn: ({ state }) => supportListQuery(state),
    normalize: (rows) => normalizeResourceList(rows, rows.length),
  },
  mutations: {
    update: {
      mutationKey: ['admin', 'mutations', 'support-tickets', 'status'],
      mutationFn: ({ record, values }) =>
        communicationService.updateSupportTicketStatus(record.id, values),
      getInput: ({ record, values }) => ({ record, values }),
      invalidate: [supportKeys.all, adminDashboardKeys.all],
      successMessage: 'تم تحديث حالة الرسالة.',
    },
  },
  dataView: {
    columns: supportColumns,
    getRowId: (ticket) => ticket.id,
    search: {
      placeholder: 'ابحث بالاسم أو الموضوع...',
      debounceMs: 300,
      ariaLabel: 'بحث في رسائل الدعم',
    },
    filters: [
      {
        id: 'status',
        label: 'كل الحالات',
        type: 'status',
        options: [
          { label: 'جديدة', value: 'جديدة' },
          { label: 'تمت المراجعة', value: 'تمت المراجعة' },
          { label: 'مغلقة', value: 'مغلقة' },
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
      allowedSortIds: ['name', 'subject', 'created_at', 'status'],
    },
  },
  emptyState: {
    title: 'لا توجد رسائل دعم',
    description: 'لا توجد رسائل تطابق البحث أو الفلاتر الحالية.',
  },
});

export { supportKeys };
