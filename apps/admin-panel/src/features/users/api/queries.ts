import type { DataViewState } from '@alrehla/admin-core/data-view';
import { userKeys, userService, type GetUsersOptions } from '@alrehla/api';

export type UserRoleFilter = 'parent' | 'customers' | 'student' | 'staff' | 'publisher' | 'all';

export const normalizeUserRoleFilter = (value: unknown): UserRoleFilter => {
  if (value === 'parents') return 'parent';
  if (value === 'customers' || value === 'student' || value === 'staff' || value === 'publisher' || value === 'all') return value;
  return 'parent';
};

export function userListParams(state: DataViewState): GetUsersOptions {
  const roleFilter = normalizeUserRoleFilter(state.filters.roleFilter);
  return {
    page: state.pagination.pageIndex + 1,
    pageSize: state.pagination.pageSize,
    search: state.search,
    roleFilter,
  };
}

export const userListQueryKey = (state: DataViewState) => userKeys.list(userListParams(state));
export const userListQuery = (state: DataViewState) => userService.getAdminUserList(userListParams(state));
