export const dynamic = 'force-dynamic';

import ServiceOrderPage from '@/features/service-order';
import { requireMarketplaceAuth } from '@/lib/server/requireAuth';

export default async function Page() {
  await requireMarketplaceAuth('/creative-writing/services');
  return <ServiceOrderPage />;
}
