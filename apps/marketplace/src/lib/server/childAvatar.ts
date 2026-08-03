import 'server-only';

import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { actionError } from './actionSecurity';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 8192;
const MAX_IMAGE_PIXELS = 40_000_000;
const CLOUD_NAME_PATTERN = /^[a-z0-9_-]+$/i;

const signedChildAvatarSchema = z
  .object({
    url: z.string().trim().url().max(2048),
    public_id: z.string().trim().min(1).max(500),
    width: z.number().int().positive().max(MAX_IMAGE_DIMENSION),
    height: z.number().int().positive().max(MAX_IMAGE_DIMENSION),
    format: z.enum(['jpg', 'jpeg', 'png', 'webp']),
    bytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
    version: z.number().int().positive(),
    resource_type: z.literal('image'),
    signature: z.string().regex(/^[0-9a-f]{40}$/i),
  })
  .strict()
  .refine((asset) => asset.width * asset.height <= MAX_IMAGE_PIXELS)
  .refine((asset) => {
    try {
      return new URL(asset.url).protocol === 'https:';
    } catch {
      return false;
    }
  });

const safelyParseAsset = (value: string) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    actionError('بيانات صورة الطفل غير صالحة.');
  }
};

const isValidPublicId = (publicId: string, actorId: string) => {
  const prefix = `alrehla/child-profiles/${actorId}/`;
  return (
    publicId.startsWith(prefix) &&
    publicId.length > prefix.length &&
    /^[a-zA-Z0-9/_-]+$/.test(publicId) &&
    !publicId.includes('..')
  );
};

const verifyCloudinaryResponseSignature = (
  publicId: string,
  version: number,
  signature: string,
) => {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) {
    actionError('تعذر التحقق من توقيع الصورة حالياً.');
  }

  const expected = createHash('sha1')
    .update(`public_id=${publicId}&version=${version}${secret}`)
    .digest();
  const received = Buffer.from(signature.toLowerCase(), 'hex');

  return received.length === expected.length && timingSafeEqual(expected, received);
};

const getCanonicalDeliveryUrl = (
  publicId: string,
  version: number,
  format: string,
) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName || !CLOUD_NAME_PATTERN.test(cloudName)) {
    actionError('تعذر التحقق من إعدادات خدمة الصور حالياً.');
  }

  const encodedPublicId = publicId
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/v${version}/${encodedPublicId}.${format}`;
};

export const normalizeSignedChildAvatar = (
  value: string | null | undefined,
  actorId: string,
): string | null => {
  if (value === null || value === undefined) return null;

  const parsed = signedChildAvatarSchema.safeParse(safelyParseAsset(value));
  if (!parsed.success) {
    actionError('بيانات صورة الطفل لا تطابق استجابة الرفع الموقعة.');
  }

  const asset = parsed.data;
  if (!isValidPublicId(asset.public_id, actorId)) {
    actionError('مسار صورة الطفل غير مصرح به.');
  }

  if (
    !verifyCloudinaryResponseSignature(
      asset.public_id,
      asset.version,
      asset.signature,
    )
  ) {
    actionError('تعذر التحقق من توقيع صورة الطفل.');
  }

  const canonicalUrl = getCanonicalDeliveryUrl(
    asset.public_id,
    asset.version,
    asset.format,
  );

  // Persist only the canonical delivery URL. The signature and response
  // metadata are verification inputs and must not leak into UI-facing fields.
  return canonicalUrl;
};
