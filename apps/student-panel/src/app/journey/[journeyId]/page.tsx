import { redirect } from 'next/navigation';
import { getMarketplaceUrl } from '@/lib/marketplaceUrl';

export default async function JourneyPage({
  params,
}: {
  params: Promise<{ journeyId: string }>;
}) {
  const { journeyId } = await params;
  redirect(getMarketplaceUrl(`/journey/${journeyId}`));
}
