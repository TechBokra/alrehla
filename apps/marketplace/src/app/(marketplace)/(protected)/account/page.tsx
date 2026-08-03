export const dynamic = 'force-dynamic';

import AccountPage from '@/features/account';
import { requireMarketplaceAuth } from '@/lib/server/requireAuth';

export default async function Page() {
  await requireMarketplaceAuth('/account');
  return <AccountPage />;
}
