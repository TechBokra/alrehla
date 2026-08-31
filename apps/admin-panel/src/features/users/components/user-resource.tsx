'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Link as LinkIcon, Plus, RefreshCw, Shield, User, Users, Baby, GraduationCap, ShoppingBag } from 'lucide-react';
import { useResource } from '@alrehla/admin-core/resource';
import { ResourceBulkActionBar, ResourceDataView, ResourceDeleteDialog, ResourceEmptyState, ResourceErrorState, ResourceFormHost, ResourcePage, ResourcePageHeader, ResourcePagination, ResourceSearch, ResourceToolbar } from '@alrehla/ui/components/resource';
import { Button } from '@alrehla/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@alrehla/ui/tabs';
import Dropdown from '@alrehla/ui/dropdown-wrapper';
import LinkStudentModal from '../../../components/admin/LinkStudentModal';
import type { AdminUserRow } from '@alrehla/api/view-models/user';
import { USER_TABS } from '../resource/user-filters';
import { normalizeUserRoleFilter } from '../api/queries';
import { useToast } from '../../../contexts/ToastContext';
import { userResource } from '../resource/user-resource';

function UserResourceBody() {
  const { dataView, definition } = useResource<AdminUserRow>();
  const router = useRouter();
  const [linkUser, setLinkUser] = React.useState<AdminUserRow | null>(null);
  const activeTab = normalizeUserRoleFilter(dataView.state.filters.roleFilter);
  const tabIcons = { parent: Baby, customers: ShoppingBag, student: GraduationCap, publisher: Building2, staff: Shield } as const;
  const refresh = () => dataView.onRetry();
  const addUserOptions = [
    { label: 'إضافة عميل / ولي أمر', action: () => router.push('/users/new?type=customer'), icon: <User size={16} /> },
    { label: 'إضافة دار نشر', action: () => router.push('/users/new?type=publisher'), icon: <Building2 size={16} /> },
    { label: 'إضافة موظف / إداري', action: () => router.push('/users/new?type=staff'), icon: <Shield size={16} /> },
  ];

  if (dataView.error) return <ResourceErrorState message={dataView.error.message} onRetry={refresh} />;

  return (
    <div className="animate-fadeIn space-y-6">
      <LinkStudentModal isOpen={Boolean(linkUser)} onClose={() => { setLinkUser(null); refresh(); }} user={linkUser} />
      <ResourcePageHeader title={definition.metadata.label} description={definition.metadata.description} icon={Users} actions={<div className="flex flex-wrap gap-2"><Button onClick={refresh} variant="ghost" icon={<RefreshCw className={dataView.isRefetching ? 'animate-spin' : ''} size={16} />}>تحديث البيانات</Button><Dropdown trigger={<span className="flex items-center gap-2"><Plus size={18} />إضافة مستخدم</span>} items={addUserOptions} /></div>} />
      <ResourceToolbar><ResourceSearch /><ResourceBulkActionBar<AdminUserRow> /></ResourceToolbar>
      <Tabs value={activeTab} onValueChange={(value) => dataView.onFilterChange('roleFilter', value)}>
        <TabsList className="w-full justify-start bg-muted/50 p-1 flex-wrap h-auto">
          {USER_TABS.map((tab) => { const Icon = tabIcons[tab.value]; return <TabsTrigger key={tab.value} value={tab.value} className="gap-2"><Icon size={16} />{tab.label}</TabsTrigger>; })}
        </TabsList>
      </Tabs>
      <ResourceDataView<AdminUserRow> emptyState={<ResourceEmptyState />} renderRowActions={(user) => user.role === 'student' ? <Button variant="ghost" size="icon" onClick={() => setLinkUser(user)} title={user.relatedChildName ? 'تعديل الربط' : 'ربط بولي أمر'} className={!user.relatedChildName ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : ''}><LinkIcon size={18} /></Button> : null} />
      <ResourcePagination />
      {dataView.loading && <p className="text-sm text-muted-foreground">جارٍ تحميل البيانات...</p>}
      <ResourceDeleteDialog />
      <ResourceFormHost />
    </div>
  );
}

export function UsersResourcePage() {
  const { addToast } = useToast();
  const notifier = React.useMemo(() => ({ success: (message: string) => addToast(message, 'success'), error: (message: string) => addToast(message, 'error') }), [addToast]);
  return <ResourcePage resource={userResource} notifier={notifier}><UserResourceBody /></ResourcePage>;
}

export default UsersResourcePage;
