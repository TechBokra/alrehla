import { getEnhaLakSubscriptionData } from '@/services/enhaLakPublicService';
import SubscriptionPage from '@/features/enha-lak-subscription';

export const revalidate = 300;

export default async function Page() {
  const initialData = await getEnhaLakSubscriptionData();
  return <SubscriptionPage initialData={initialData} />;
}
