export const dynamic = 'force-dynamic';

import TrainingJourneyPage from '@/features/journey';
import { authorizeJourneyAccess } from '@/actions/bookingActions';
import { requireMarketplaceAuth } from '@/lib/server/requireAuth';

export default async function Page({
  params,
}: {
  params: Promise<{ journeyId: string }>;
}) {
  const { journeyId } = await params;
  await requireMarketplaceAuth(`/journey/${journeyId}`);
  await authorizeJourneyAccess(journeyId);
  return <TrainingJourneyPage />;
}
