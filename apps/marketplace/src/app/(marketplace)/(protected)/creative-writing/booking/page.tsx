export const dynamic = 'force-dynamic';

import CreativeWritingBookingPage from '@/features/creative-writing-booking';
import { requireMarketplaceAuth } from '@/lib/server/requireAuth';

export default async function Page() {
  await requireMarketplaceAuth('/creative-writing/booking');
  return <CreativeWritingBookingPage />;
}
