import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublisherPublicProfilePage from '@/features/publisher-profile';
import { resolveStoredImageUrl } from '@/lib/imageUrl';
import { getCanonicalUrl } from '@/services/publicBlogService';
import { getPublicPublisherBySlug } from '@/services/publicPublisherService';

type PublisherRouteProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

const getDescription = (description: string) => {
  const normalizedDescription = description
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z][\w]+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalizedDescription.length > 160
    ? `${normalizedDescription.slice(0, 157)}...`
    : normalizedDescription;
};

const getOpenGraphImage = (imageUrl: string | null | undefined) => {
  const resolvedImageUrl = resolveStoredImageUrl(imageUrl);
  if (!resolvedImageUrl) return undefined;

  try {
    const url = new URL(resolvedImageUrl);
    return url.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
};

export async function generateMetadata({
  params,
}: PublisherRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicPublisherBySlug(slug);

  if (!data) {
    return {
      title: 'دار النشر غير موجودة',
      robots: { index: false, follow: false },
    };
  }

  const { publisher } = data;
  const description =
    getDescription(publisher.description) ||
    `تعرف على إصدارات ${publisher.store_name} المتاحة عبر منصة الرحلة.`;
  const canonicalUrl = getCanonicalUrl(
    `/publisher/${encodeURIComponent(publisher.slug)}`,
  );
  const openGraphImage = getOpenGraphImage(
    publisher.cover_url || publisher.logo_url,
  );

  return {
    title: publisher.store_name,
    description,
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      type: 'website',
      locale: 'ar_EG',
      title: publisher.store_name,
      description,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      ...(openGraphImage ? { images: [{ url: openGraphImage }] } : {}),
    },
  };
}

export default async function Page({ params }: PublisherRouteProps) {
  const { slug } = await params;
  const data = await getPublicPublisherBySlug(slug);

  if (!data) {
    notFound();
  }

  return (
    <PublisherPublicProfilePage
      publisher={data.publisher}
      publisherProducts={data.products}
    />
  );
}
