import type { ColumnDef } from '@tanstack/react-table';
import { useResource } from '@alrehla/admin-core/resource';
import { Select } from '@alrehla/ui/native-select';
import { ResourceSortableHeader } from '@alrehla/ui/components/resource';
import type { JoinRequest, RequestStatus } from '@alrehla/types';
import { JOIN_REQUEST_STATUSES } from '../api/queries';
import { formatDate } from '../../../utils/helpers';

function JoinRequestStatusCell({ request }: { request: JoinRequest }) {
  const { actions, pending } = useResource<JoinRequest, never, RequestStatus, JoinRequest[]>();

  return (
    <Select
      value={request.status}
      disabled={pending.update}
      onChange={(event) => {
        const status = event.target.value;
        if (JOIN_REQUEST_STATUSES.includes(status as RequestStatus)) {
          void actions.update(request, status as RequestStatus);
        }
      }}
    >
      {JOIN_REQUEST_STATUSES.map((status) => (
        <option key={status} value={status}>{status}</option>
      ))}
    </Select>
  );
}

export const joinRequestColumns: ColumnDef<JoinRequest, unknown>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <ResourceSortableHeader column={column} label="الاسم" />,
    cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <ResourceSortableHeader column={column} label="الدور المطلوب" />,
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
    cell: ({ row }) => <JoinRequestStatusCell request={row.original} />,
  },
];
