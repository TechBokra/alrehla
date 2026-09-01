import type { DataViewQueryState } from '@alrehla/admin-core/data-view';
import { communicationService } from '../../../services/communicationService';
import type { SupportTicket, TicketStatus } from '@alrehla/types';

export interface SupportListParams {
  search?: string;
  status?: TicketStatus;
}

export const SUPPORT_TICKET_STATUSES = [
  'جديدة',
  'تمت المراجعة',
  'مغلقة',
] as const satisfies readonly TicketStatus[];

export const supportKeys = {
  all: ['adminSupportTickets'] as const,
  lists: () => [...supportKeys.all, 'lists'] as const,
  list: (params: SupportListParams = {}) => [
    ...supportKeys.lists(),
    {
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  ] as const,
  details: () => [...supportKeys.all, 'details'] as const,
  detail: (id: string) => [...supportKeys.details(), id] as const,
};

export function supportListParams(state: DataViewQueryState): SupportListParams {
  const status = state.filters.status;
  return {
    ...(state.search ? { search: state.search } : {}),
    ...(typeof status === 'string' && SUPPORT_TICKET_STATUSES.includes(status as TicketStatus)
      ? { status: status as TicketStatus }
      : {}),
  };
}

export function filterSupportTickets(
  rows: readonly SupportTicket[],
  params: SupportListParams,
): SupportTicket[] {
  const search = params.search?.toLowerCase() ?? '';
  return rows.filter((ticket) => {
    const matchesStatus = !params.status || ticket.status === params.status;
    const matchesSearch = !search || [ticket.name, ticket.subject]
      .some((value) => value.toLowerCase().includes(search));
    return matchesStatus && matchesSearch;
  });
}

export const supportListQueryKey = (state: DataViewQueryState) =>
  supportKeys.list(supportListParams(state));

export const supportListQuery = async (state: DataViewQueryState) => {
  const rows = await communicationService.getAllSupportTickets();
  return filterSupportTickets(rows, supportListParams(state));
};
