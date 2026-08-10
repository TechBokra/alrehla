import { getCanonicalUrl } from '@/services/publicBlogService';
import { getEnhaLakData } from '@/services/enhaLakPublicService';
import EnhaLakPage from '@/features/enha-lak';

export const revalidate = 300;

export default async function Page() {
  const data = await getEnhaLakData();
  const canonicalUrl = getCanonicalUrl('/enha-lak');

  return (
    <EnhaLakPage
      data={data}
      shareUrl={canonicalUrl?.toString() || '/enha-lak'}
    />
  );
}
