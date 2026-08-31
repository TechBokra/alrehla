'use client';

import * as React from 'react';
import { Eye, MessageSquare, RefreshCw } from 'lucide-react';
import { useAdminNavigation } from '@alrehla/admin-core/navigation';
import { useResource } from '@alrehla/admin-core/resource';
import {
  ResourceDataView,
  ResourceEmptyState,
  ResourceErrorState,
  ResourcePage,
  ResourcePageHeader,
  ResourcePagination,
  ResourceSearch,
  ResourceToolbar,
} from '@alrehla/ui/components/resource';
import { Button } from '@alrehla/ui/button';
import { useToast } from '../../../contexts/ToastContext';
import type { SupportTicket, TicketStatus } from '@alrehla/types';
import { supportResource } from '../resource/support-resource';

function SupportResourceBody() {
  const { dataView, definition } = useResource<SupportTicket, never, TicketStatus, SupportTicket[]>();
  const navigation = useAdminNavigation();

  if (dataView.error) {
    return <ResourceErrorState message={dataView.error.message} onRetry={dataView.onRetry} />;
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <ResourcePageHeader
        title={definition.metadata.label}
        description={definition.metadata.description}
        icon={MessageSquare}
        actions={(
          <Button
            onClick={dataView.onRetry}
            variant="outline"
            icon={<RefreshCw className={dataView.isRefetching ? 'animate-spin' : ''} size={16} />}
          >
            تحديث البيانات
          </Button>
        )}
      />
      <ResourceToolbar><ResourceSearch /></ResourceToolbar>
      <ResourceDataView<SupportTicket>
        emptyState={<ResourceEmptyState />}
        renderRowActions={(ticket) => (
          <Button
            variant="ghost"
            size="icon"
            title="عرض التفاصيل"
            aria-label="عرض تفاصيل رسالة الدعم"
            onClick={() => navigation.push(`/support/${ticket.id}`)}
          >
            <Eye size={18} />
          </Button>
        )}
      />
      <ResourcePagination />
    </div>
  );
}

export function SupportResourcePage() {
  const { addToast } = useToast();
  const notifier = React.useMemo(
    () => ({
      success: (message: string) => addToast(message, 'success'),
      error: (message: string) => addToast(`فشل: ${message}`, 'error'),
    }),
    [addToast],
  );

  return (
    <ResourcePage resource={supportResource} notifier={notifier}>
      <SupportResourceBody />
    </ResourcePage>
  );
}

export default SupportResourcePage;
