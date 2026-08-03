export const dynamic = 'force-dynamic';

import TrainingJourneyPage from '@/features/journey';
import { requireMarketplaceAuth } from '@/lib/server/requireAuth';

export default async function Page() {
  await requireMarketplaceAuth('/journey');
  return <TrainingJourneyPage />;
}
