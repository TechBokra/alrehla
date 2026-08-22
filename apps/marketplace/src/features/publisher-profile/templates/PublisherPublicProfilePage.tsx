import {
  BookOpen,
  Building2,
  Facebook,
  Globe,
  Instagram,
  Library,
  Twitter,
} from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@alrehla/ui/card';
import Image from '@alrehla/ui/next-image';
import type {
  PublicPublisherPageData,
  PublicPublisherProduct,
} from '../../../services/publicPublisherService';

type PublisherPublicProfilePageProps = {
  publisher: PublicPublisherPageData['publisher'];
  publisherProducts: PublicPublisherProduct[];
};

const trustedImageHosts = new Set([
  'i.ibb.co',
  'placehold.co',
  'res.cloudinary.com',
  'upload.wikimedia.org',
  'yt3.googleusercontent.com',
]);

const getSafeExternalUrl = (value: string | undefined) => {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

const getSafeImageUrl = (
  value: string | null | undefined,
  fallback: string,
) => {
  if (!value) return fallback;
  if (value.startsWith('/') && !value.startsWith('//')) return value;

  let resolvedValue = value;
  if (value.startsWith('{') && value.endsWith('}')) {
    try {
      const parsed = JSON.parse(value) as { url?: unknown };
      if (typeof parsed.url === 'string') {
        resolvedValue = parsed.url;
      }
    } catch {
      return fallback;
    }
  }

  try {
    const url = new URL(resolvedValue);
    const isTrustedSupabaseHost = url.hostname.endsWith('.supabase.co');
    return url.protocol === 'https:' &&
      (trustedImageHosts.has(url.hostname) || isTrustedSupabaseHost)
      ? url.toString()
      : fallback;
  } catch {
    return fallback;
  }
};

const PublisherProductCard = ({
  product,
}: {
  product: PublicPublisherProduct;
}) => (
  <Card className="flex h-full flex-col border border-gray-100 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
    <div className="relative h-56 w-full overflow-hidden bg-gray-50">
      <Image
        src={getSafeImageUrl(product.image_url, 'https://placehold.co/600x400')}
        alt={product.title}
        className="h-full w-full"
        objectFit="contain"
        width={600}
        height={400}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
      />
      {product.product_type === 'library_book' && (
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
          <Library size={10} /> مكتبة
        </div>
      )}
    </div>
    <CardHeader className="pb-2">
      <CardTitle className="line-clamp-1 text-lg">{product.title}</CardTitle>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-bold text-primary">
          {product.price_printed}
        </span>
        <span className="text-xs text-muted-foreground">ج.م</span>
      </div>
    </CardHeader>
    <CardContent className="flex-grow">
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {product.description}
      </p>
    </CardContent>
    <CardFooter className="pt-0">
      <Button
        href={product.product_type === 'library_book'
          ? `/enha-lak/library/${encodeURIComponent(product.key)}`
          : `/enha-lak/custom/${encodeURIComponent(product.key)}`}
        size="sm"
        className="w-full"
      >
        اطلب الآن
      </Button>
    </CardFooter>
  </Card>
);

const PublisherPublicProfilePage = ({
  publisher,
  publisherProducts,
}: PublisherPublicProfilePageProps) => {
  const website = getSafeExternalUrl(publisher.website);
  const facebook = getSafeExternalUrl(publisher.social_links?.facebook);
  const twitter = getSafeExternalUrl(publisher.social_links?.twitter);
  const instagram = getSafeExternalUrl(publisher.social_links?.instagram);
  const coverImage = getSafeImageUrl(
    publisher.cover_url,
    '/images/hero-banner.png',
  );
  const logoImage =
    publisher.logo_url?.includes('wikimedia.org') ||
    publisher.logo_url?.includes('googleusercontent.com')
      ? '/placeholder-image.jpeg'
      : getSafeImageUrl(publisher.logo_url, '/placeholder-image.jpeg');

  return (
    <div className="min-h-screen animate-fadeIn bg-gray-50/50">
      <div className="relative h-64 w-full overflow-hidden bg-gray-200 md:h-80">
        <Image
          src={coverImage}
          alt={`غلاف ${publisher.store_name}`}
          className="h-full w-full object-cover opacity-80"
          width={1920}
          height={640}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto -mt-20 mb-12 px-4">
        <div className="flex flex-col items-start gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:flex-row md:items-end md:p-8">
          <div className="-mt-16 h-32 w-32 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md md:-mt-20 md:h-40 md:w-40">
            <Image
              src={logoImage}
              alt={publisher.store_name}
              className="h-full w-full"
              objectFit="contain"
              width={320}
              height={320}
              sizes="(max-width: 768px) 128px, 160px"
            />
          </div>

          <div className="w-full flex-grow space-y-3">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-extrabold text-gray-900">
                  {publisher.store_name}
                  <span className="text-blue-500" title="دار نشر موثقة">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </h1>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 size={14} /> شريك معتمد في منصة الرحلة
                </p>
              </div>

              <div className="flex gap-3">
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    <Globe size={16} /> الموقع
                  </a>
                )}
                <div className="flex gap-2">
                  {facebook && (
                    <a
                      href={facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="فيسبوك"
                      className="rounded-lg bg-blue-50 p-2 text-blue-600 transition-colors hover:bg-blue-100"
                    >
                      <Facebook size={20} />
                    </a>
                  )}
                  {twitter && (
                    <a
                      href={twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="تويتر"
                      className="rounded-lg bg-sky-50 p-2 text-sky-500 transition-colors hover:bg-sky-100"
                    >
                      <Twitter size={20} />
                    </a>
                  )}
                  {instagram && (
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="إنستغرام"
                      className="rounded-lg bg-pink-50 p-2 text-pink-600 transition-colors hover:bg-pink-100"
                    >
                      <Instagram size={20} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {publisher.description && (
              <div className="mt-4 border-t pt-4">
                <h2 className="mb-2 text-sm font-bold text-gray-700">
                  عن الدار
                </h2>
                <p className="max-w-4xl text-sm leading-relaxed text-gray-600 md:text-base">
                  {publisher.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-3 border-b pb-4">
          <BookOpen className="text-primary" />
          <h2 className="text-2xl font-bold text-gray-800">
            إصدارات الدار ({publisherProducts.length})
          </h2>
        </div>

        {publisherProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {publisherProducts.map((product) => (
              <PublisherProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-white py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <BookOpen className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-700">
              لا توجد إصدارات حالياً
            </h3>
            <p className="text-muted-foreground">
              لم يتم إضافة منتجات لهذه الدار حتى الآن.
            </p>
            <Button href="/enha-lak/library" variant="link" className="mt-2">
              تصفح باقي المتجر
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublisherPublicProfilePage;
