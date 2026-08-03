export const dynamic = 'force-dynamic';

import { getPersonalizedProducts } from '@/actions/publicActions';
import OrderPage from '@/features/enha-lak-order';
import { requireMarketplaceAuth } from '@/lib/server/requireAuth';
import type { OrderData } from '@/hooks/queries/public/usePageDataQuery';

export default async function Page() {
  await requireMarketplaceAuth('/enha-lak/order');

  // Product configuration is public and serializable, so fetch it on the
  // server to avoid a client-side loading waterfall. If the public read is
  // temporarily unavailable, let the client query retry gracefully.
  let initialOrderData: OrderData | undefined;
  try {
    initialOrderData = {
      personalizedProducts: await getPersonalizedProducts(),
    };
  } catch {
    initialOrderData = undefined;
  }

  return <OrderPage initialOrderData={initialOrderData} />;
}
