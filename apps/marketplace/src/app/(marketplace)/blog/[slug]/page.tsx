import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPostPage from '@/features/blog-post';
import { resolveStoredImageUrl } from '@/lib/imageUrl';
import {
  getCanonicalUrl,
  getPublishedBlogPostBySlug,
} from '@/services/publicBlogService';

type BlogPostRouteProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

const getDescription = (content: string) => {
  const normalizedContent = content
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z][\w]+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalizedContent.length > 160
    ? `${normalizedContent.slice(0, 157)}...`
    : normalizedContent;
};

const getOpenGraphImage = (imageUrl: string | null) => {
  const resolvedImageUrl = resolveStoredImageUrl(imageUrl);
  if (!resolvedImageUrl) return undefined;

  try {
    const url = new URL(resolvedImageUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
};

export async function generateMetadata({
  params,
}: BlogPostRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    // Resolve the 404 before the route shell streams so missing articles keep
    // the correct HTTP status as well as the not-found UI.
    notFound();
  }

  const description = getDescription(post.content);
  const canonicalUrl = getCanonicalUrl(
    `/blog/${encodeURIComponent(post.slug)}`,
  );
  const openGraphImage = getOpenGraphImage(post.image_url);

  return {
    title: post.title,
    description,
    authors: [{ name: post.author_name }],
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      type: 'article',
      locale: 'ar_EG',
      title: post.title,
      description,
      authors: [post.author_name],
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      ...(openGraphImage ? { images: [{ url: openGraphImage }] } : {}),
    },
  };
}

export default async function Page({ params }: BlogPostRouteProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const canonicalUrl = getCanonicalUrl(
    `/blog/${encodeURIComponent(post.slug)}`,
  );

  return (
    <BlogPostPage
      post={post}
      pageUrl={canonicalUrl?.toString() ?? `/blog/${encodeURIComponent(post.slug)}`}
    />
  );
}
