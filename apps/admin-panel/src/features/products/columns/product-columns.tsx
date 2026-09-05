import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@eng-mohamedelsayed/admin-ui/components/feedback/status-badge';
import type { PersonalizedProduct } from '@alrehla/types';
import { formatCurrency } from '../../../utils/helpers';

function ProductStatusBadge({ status }: { status?: string | null }) {
  if (status === 'approved') {
    return <StatusBadge label="معتمد" variant="success" showIcon />;
  }
  if (status === 'rejected') {
    return <StatusBadge label="مرفوض" variant="danger" showIcon />;
  }
  if (status === 'pending') {
    return <StatusBadge label="بانتظار المراجعة" variant="warning" showIcon />;
  }
  return <StatusBadge label={status || 'غير محدد'} variant="neutral" />;
}

export const productColumns: ColumnDef<PersonalizedProduct, unknown>[] = [
  {
    accessorKey: 'title',
    header: 'المنتج',
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-3 min-w-[220px]">
          <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-muted border flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs text-muted-foreground">بدون صورة</span>
            )}
          </div>
          <div>
            <span className="font-semibold block text-sm">{product.title}</span>
            <span className="text-xs text-muted-foreground font-mono">{product.key}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: 'publisher',
    header: 'الناشر',
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.publisher?.name || (row.original.publisher_id ? 'دار نشر' : 'رحلة')}
      </span>
    ),
  },
  {
    id: 'price',
    header: 'الأسعار (مطبوع / إلكتروني)',
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="text-sm">
          <div>
            <span className="text-xs text-muted-foreground">مطبوع: </span>
            <span className="font-medium">
              {product.price_printed ? formatCurrency(product.price_printed) : 'غير متوفر'}
            </span>
          </div>
          {product.price_electronic ? (
            <div className="text-xs text-muted-foreground">
              إلكتروني: {formatCurrency(product.price_electronic)}
            </div>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: 'sort_order',
    header: 'الترتيب',
    cell: ({ row }) => (
      <span className="text-sm font-mono">{row.original.sort_order ?? 0}</span>
    ),
  },
  {
    accessorKey: 'approval_status',
    header: 'الحالة',
    cell: ({ row }) => <ProductStatusBadge status={row.original.approval_status} />,
  },
];
