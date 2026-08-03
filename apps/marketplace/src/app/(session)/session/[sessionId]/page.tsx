export const dynamic = 'force-dynamic';

import SessionPage from '@/features/session';
import { requireMarketplaceAuth } from '@/lib/server/requireAuth';

export default async function Page() {
  await requireMarketplaceAuth('/session');
  return <SessionPage />;
}
