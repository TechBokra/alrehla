export const dynamic = 'force-dynamic';

import { getPersonalizedProducts } from '@/actions/publicActions';
import OrderPage from '@/features/enha-lak-order';
import { requireMarketplaceAuth } from '@/lib/server/requireAuth';
import type { OrderData } from '@/hooks/queries/public/usePageDataQuery';

type CustomProductRouteProps = {
  params: Promise<{ productKey: string }>;
};

export default async function Page({ params }: CustomProductRouteProps) {
  const { productKey } = await params;
  await requireMarketplaceAuth(`/enha-lak/custom/${encodeURIComponent(productKey)}`);

  let initialOrderData: OrderData | undefined;
  try {
    initialOrderData = { personalizedProducts: await getPersonalizedProducts() };
  } catch {
    initialOrderData = undefined;
  }

  return <OrderPage productKey={decodeURIComponent(productKey)} expectedJourney="custom" initialOrderData={initialOrderData} />;
}
