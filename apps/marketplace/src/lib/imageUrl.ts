const TRUSTED_IMAGE_HOSTS = new Set([
  'i.ibb.co',
  'placehold.co',
  'res.cloudinary.com',
  'upload.wikimedia.org',
  'yt3.googleusercontent.com',
]);

const isTrustedImageHost = (hostname: string) =>
  TRUSTED_IMAGE_HOSTS.has(hostname) ||
  hostname.endsWith('.supabase.co') ||
  hostname.endsWith('.googleusercontent.com') ||
  hostname.endsWith('.clerk.com') ||
  hostname.endsWith('.clerk.dev');

const extractCandidate = (value: unknown): string | undefined => {
  if (
    typeof value === 'object' &&
    value !== null &&
    'url' in value &&
    typeof value.url === 'string'
  ) {
    return value.url;
  }

  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return extractCandidate(parsed);
    } catch {
      return undefined;
    }
  }

  return trimmed;
};

/**
 * Resolves persisted image fields that may contain a URL, a Cloudinary asset
 * object, or the legacy JSON-encoded asset shape. Only local paths and trusted
 * HTTPS image hosts are returned.
 */
export const resolveStoredImageUrl = (
  value: unknown,
  fallback?: string,
): string | undefined => {
  const candidate = extractCandidate(value);
  if (!candidate || candidate.length > 5_000) return fallback;

  if (
    candidate.startsWith('/') &&
    !candidate.startsWith('//') &&
    /^\/[a-zA-Z0-9/_.%?=&-]*$/.test(candidate)
  ) {
    return candidate;
  }

  try {
    const url = new URL(candidate);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      !isTrustedImageHost(url.hostname)
    ) {
      return fallback;
    }
    return url.toString();
  } catch {
    return fallback;
  }
};
