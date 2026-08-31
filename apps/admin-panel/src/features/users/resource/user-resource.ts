'use client';

import { defineResource, normalizeResourceList } from '@alrehla/admin-core/resource';
import { accountKeys, childProfileKeys, userKeys } from '@alrehla/api';
import type { AdminUserRow } from '@alrehla/api/view-models/user';
import { bulkDeleteUsers } from '../../../actions/userActions';
import { userColumns } from '../columns/user-columns';
import { toUserRow } from '../adapters/user-row';
import { userListQuery, userListQueryKey } from '../api/queries';
import { USER_DATA_VIEW_FILTERS } from './user-filters';

export const userResource = defineResource<AdminUserRow, never, never, Awaited<ReturnType<typeof userListQuery>>>({
  scope: 'global',
  metadata: {
    name: 'users',
    label: 'المستخدمون',
    singularLabel: 'مستخدم',
    pluralLabel: 'المستخدمون',
    description: 'إدارة حسابات العملاء والطلاب والموظفين ودور النشر.',
  },
  capabilities: { create: true, update: true, delete: true, selection: true, bulkActions: true, export: false },
  authorization: {
    read: 'canManageUsers',
    create: 'canManageUsers',
    update: 'canManageUsers',
    delete: 'canManageUsers',
    bulkActions: 'canManageUsers',
  },
  query: {
    queryKey: ({ state }) => userListQueryKey(state),
    queryFn: ({ state }) => userListQuery(state),
    normalize: (response) => normalizeResourceList(response.rows.map(toUserRow), response.count, response.meta),
    staleTime: 5_000,
  },
  mutations: {
    delete: {
      mutationFn: (userId) => bulkDeleteUsers([userId]),
      mutationKey: ['admin', 'mutations', 'users', 'delete'],
      invalidate: [userKeys.lists(), childProfileKeys.lists(), accountKeys.all],
      successMessage: 'تم حذف المستخدم والبيانات المرتبطة به بنجاح.',
      errorMessage: 'فشل حذف المستخدم.',
      getInput: (row) => row.id,
      getLabel: (row) => `المستخدم "${row.name}"`,
    },
    deleteMany: {
      mutationFn: (userIds) => bulkDeleteUsers(userIds),
      mutationKey: ['admin', 'mutations', 'users', 'deleteMany'],
      invalidate: [userKeys.lists(), childProfileKeys.lists(), accountKeys.all],
      successMessage: 'تم حذف المستخدمين والبيانات المرتبطة بهم بنجاح.',
      errorMessage: 'فشل حذف المستخدمين.',
      getInput: (rows) => rows.map((row) => row.id),
      getInputFromIds: (ids) => ids,
    },
  },
  dataView: {
    columns: userColumns,
    getRowId: (row) => row.id,
    search: { placeholder: 'بحث بالاسم أو البريد الإلكتروني...', debounceMs: 500, ariaLabel: 'بحث في المستخدمين' },
    filters: USER_DATA_VIEW_FILTERS,
    selection: { enabled: true, mode: 'multiple', preserveAcrossPages: true },
    enableColumnOrdering: true,
    processingMode: 'server',
    pageSizeOptions: [5, 10, 20, 50],
    urlState: { defaults: { page: 1, pageSize: 10, filters: { roleFilter: 'parent' } }, persistenceKey: 'admin:data-view:users' },
  },
  forms: {
    create: { mode: 'page', href: () => '/users/new?type=customer' },
    update: { mode: 'page', href: ({ record }) => `/users/${record?.id ?? ''}` },
  },
  emptyState: { title: 'لا توجد حسابات', description: 'لا توجد حسابات تطابق البحث أو الفئة الحالية.' },
});
