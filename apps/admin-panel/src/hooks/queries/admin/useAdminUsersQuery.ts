import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { childProfileKeys, publisherKeys, userKeys, userService } from '@alrehla/api';
import type { ChildProfile, UserProfile, UserWithParent } from '@alrehla/types';
import { toAdminUserRows } from '@alrehla/api/adapters/admin-user-row';

export type { UserWithParent };

export const transformUsersWithRelations = (
  users: UserProfile[],
  children: ChildProfile[],
  parentsMap: Map<string, { name: string; email: string }>,
): UserWithParent[] => toAdminUserRows(users, children, parentsMap);

export interface UseAdminUsersOptions {
  page: number;
  pageSize: number;
  search: string;
  roleFilter: string;
}

/** Compatibility hook for pages not yet migrated to Resource Core. */
export const useAdminUsers = (options: UseAdminUsersOptions) => useQuery({
  queryKey: userKeys.list(options),
  queryFn: () => userService.getAdminUsersWithRelations(options),
  placeholderData: keepPreviousData,
  staleTime: 5_000,
});

export const useAdminAllChildProfiles = () => useQuery({
  queryKey: childProfileKeys.lists(),
  queryFn: () => userService.getAllChildProfiles(),
  staleTime: 1000 * 60 * 5,
});

export const useAllPublishers = () => useQuery({
  queryKey: publisherKeys.lists(),
  queryFn: () => userService.getAllPublishers(),
  staleTime: 1000 * 60 * 5,
});

export const usePublisherProfile = (userId: string | undefined) => useQuery({
  queryKey: publisherKeys.detail(userId ?? ''),
  queryFn: () => userId ? userService.getPublisherProfile(userId) : null,
  enabled: Boolean(userId),
});
