import type { ColumnDef } from '@tanstack/react-table';
import { useResource } from '@alrehla/admin-core/resource';
import { Select } from '@alrehla/ui/native-select';
import { ResourceSortableHeader } from '@alrehla/ui/components/resource';
import type { SupportTicket, TicketStatus } from '@alrehla/types';
import { SUPPORT_TICKET_STATUSES } from '../api/queries';
import { formatDate } from '../../../utils/helpers';

function SupportTicketStatusCell({ ticket }: { ticket: SupportTicket }) {
  const { actions, pending } = useResource<SupportTicket, never, TicketStatus, SupportTicket[]>();

  return (
    <Select
      value={ticket.status}
      disabled={pending.update}
      onChange={(event) => {
        const status = event.target.value;
        if (SUPPORT_TICKET_STATUSES.includes(status as TicketStatus)) {
          void actions.update(ticket, status as TicketStatus);
        }
      }}
    >
      {SUPPORT_TICKET_STATUSES.map((status) => (
        <option key={status} value={status}>{status}</option>
      ))}
    </Select>
  );
}

export const supportColumns: ColumnDef<SupportTicket, unknown>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <ResourceSortableHeader column={column} label="الاسم" />,
    cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
  },
  {
    accessorKey: 'subject',
    header: ({ column }) => <ResourceSortableHeader column={column} label="الموضوع" />,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => <ResourceSortableHeader column={column} label="التاريخ" />,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.created_at)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <ResourceSortableHeader column={column} label="الحالة" />,
    cell: ({ row }) => <SupportTicketStatusCell ticket={row.original} />,
  },
];
