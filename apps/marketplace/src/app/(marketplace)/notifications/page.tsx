export const dynamic = 'force-dynamic';

import NotificationsPage from '@/features/notifications';
import { requireMarketplaceAuth } from '@/lib/server/requireAuth';

export default async function Page() {
  await requireMarketplaceAuth('/notifications');
  return <NotificationsPage />;
}
