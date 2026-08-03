export const dynamic = 'force-dynamic';

import CartPage from '@/features/cart';
import { requireMarketplaceAuth } from '@/lib/server/requireAuth';

export default async function Page() {
  await requireMarketplaceAuth('/cart');
  return <CartPage />;
}
