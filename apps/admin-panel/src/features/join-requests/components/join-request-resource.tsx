'use client';

import * as React from 'react';
import { Eye, RefreshCw, UserPlus } from 'lucide-react';
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
import type { JoinRequest, RequestStatus } from '@alrehla/types';
import { joinRequestResource } from '../resource/join-request-resource';

function JoinRequestResourceBody() {
  const { dataView, definition } = useResource<JoinRequest, never, RequestStatus, JoinRequest[]>();
  const navigation = useAdminNavigation();

  if (dataView.error) {
    return <ResourceErrorState message={dataView.error.message} onRetry={dataView.onRetry} />;
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <ResourcePageHeader
        title={definition.metadata.label}
        description={definition.metadata.description}
        icon={UserPlus}
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
      <ResourceDataView<JoinRequest>
        emptyState={<ResourceEmptyState />}
        renderRowActions={(request) => (
          <Button
            variant="ghost"
            size="icon"
            title="عرض التفاصيل"
            aria-label="عرض تفاصيل طلب الانضمام"
            onClick={() => navigation.push(`/join-requests/${request.id}`)}
          >
            <Eye size={18} />
          </Button>
        )}
      />
      <ResourcePagination />
    </div>
  );
}

export function JoinRequestResourcePage() {
  const { addToast } = useToast();
  const notifier = React.useMemo(
    () => ({
      success: (message: string) => addToast(message, 'success'),
      error: (message: string) => addToast(`فشل: ${message}`, 'error'),
    }),
    [addToast],
  );

  return (
    <ResourcePage resource={joinRequestResource} notifier={notifier}>
      <JoinRequestResourceBody />
    </ResourcePage>
  );
}

export default JoinRequestResourcePage;
