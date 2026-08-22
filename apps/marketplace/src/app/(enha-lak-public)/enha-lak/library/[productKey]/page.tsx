import { notFound } from 'next/navigation';
import { getEnhaLakData, getEnhaLakProduct } from '@/services/enhaLakPublicService';
import LibraryStoryDetailsPage from '@/features/enha-lak-library/templates/LibraryStoryDetailsPage';

export const revalidate = 300;

export async function generateStaticParams() {
  const { personalizedProducts } = await getEnhaLakData();

  return personalizedProducts
    .filter((product) => product.product_type === 'library_book')
    .map((product) => ({ productKey: product.key }));
}

interface LibraryStoryRouteProps {
  params: Promise<{ productKey: string }>;
}

export default async function Page({ params }: LibraryStoryRouteProps) {
  const { productKey: rawProductKey } = await params;
  let productKey = rawProductKey;

  try {
    productKey = decodeURIComponent(rawProductKey);
  } catch {
    notFound();
  }

  const product = await getEnhaLakProduct(productKey);
  if (!product || product.product_type !== 'library_book') notFound();

  return <LibraryStoryDetailsPage product={product} />;
}
