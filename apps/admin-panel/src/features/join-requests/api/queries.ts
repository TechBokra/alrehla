import type { DataViewState } from '@alrehla/admin-core/data-view';
import { communicationService } from '../../../services/communicationService';
import type { JoinRequest, RequestStatus } from '@alrehla/types';

export interface JoinRequestListParams {
  search?: string;
  status?: RequestStatus;
}

export const JOIN_REQUEST_STATUSES = [
  'جديد',
  'تمت المراجعة',
  'مقبول',
  'مرفوض',
] as const satisfies readonly RequestStatus[];

export const joinRequestKeys = {
  all: ['adminJoinRequests'] as const,
  lists: () => [...joinRequestKeys.all, 'lists'] as const,
  list: (params: JoinRequestListParams = {}) => [
    ...joinRequestKeys.lists(),
    {
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  ] as const,
  details: () => [...joinRequestKeys.all, 'details'] as const,
  detail: (id: string) => [...joinRequestKeys.details(), id] as const,
};

export function joinRequestListParams(state: DataViewState): JoinRequestListParams {
  const status = state.filters.status;
  return {
    ...(state.search ? { search: state.search } : {}),
    ...(typeof status === 'string' && JOIN_REQUEST_STATUSES.includes(status as RequestStatus)
      ? { status: status as RequestStatus }
      : {}),
  };
}

export function filterJoinRequests(
  rows: readonly JoinRequest[],
  params: JoinRequestListParams,
): JoinRequest[] {
  const search = params.search?.toLowerCase() ?? '';
  return rows.filter((request) => {
    const matchesStatus = !params.status || request.status === params.status;
    const matchesSearch = !search || [request.name, request.role]
      .some((value) => value.toLowerCase().includes(search));
    return matchesStatus && matchesSearch;
  });
}

export const joinRequestListQueryKey = (state: DataViewState) =>
  joinRequestKeys.list(joinRequestListParams(state));

export const joinRequestListQuery = async (state: DataViewState) => {
  const rows = await communicationService.getAllJoinRequests();
  return filterJoinRequests(rows, joinRequestListParams(state));
};
