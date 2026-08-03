export const dynamic = 'force-dynamic';

import CheckoutPage from '@/features/checkout';
import { requireMarketplaceAuth } from '@/lib/server/requireAuth';

export default async function Page() {
  await requireMarketplaceAuth('/checkout');
  return <CheckoutPage />;
}
