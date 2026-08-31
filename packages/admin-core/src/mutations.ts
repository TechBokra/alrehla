'use client';

import {
  useAppMutation,
  type AppMutationOptions,
} from '@alrehla/mutations';
import { adminMutationKeys } from './query-keys';
import type { AdminResourceId } from './types';

export interface AdminMutationOptions<TData, TVariables>
  extends AppMutationOptions<TData, TVariables> {
  resource?: AdminResourceId;
}

/**
 * Admin mutation boundary. It keeps mutation errors, notifications, and query
 * invalidation consistent while allowing each feature to keep its own action.
 */
export const useAdminMutation = <TData, TVariables = void>(
  options: AdminMutationOptions<TData, TVariables>,
) =>
  useAppMutation({
    ...options,
    mutationKey:
      options.mutationKey ||
      adminMutationKeys.resource(options.resource || 'dashboard'),
  });
