import 'server-only';

import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { actionError } from './actionSecurity';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 8192;
const MAX_IMAGE_PIXELS = 40_000_000;
const ALLOWED_FORMATS = 'jpg,jpeg,png,webp';
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const CLOUD_NAME_PATTERN = /^[a-z0-9_-]+$/i;
const API_KEY_PATTERN = /^[a-z0-9_-]+$/i;
const UPLOAD_PRESET_PATTERN = /^[a-z0-9_-]{1,100}$/i;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cloudinaryResponseSchema = z
  .object({
    secure_url: z.string().trim().url().max(2048),
    public_id: z.string().trim().min(1).max(500),
    width: z.number().int().positive().max(MAX_IMAGE_DIMENSION),
    height: z.number().int().positive().max(MAX_IMAGE_DIMENSION),
    format: z.enum(['jpg', 'jpeg', 'png', 'webp']),
    bytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
    version: z.number().int().positive(),
    resource_type: z.literal('image'),
    signature: z.string().regex(/^[0-9a-f]{40}$/i),
  })
  .passthrough()
  .refine((asset) => asset.width * asset.height <= MAX_IMAGE_PIXELS);

export type MarketplaceCloudinaryAsset = {
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: 'jpg' | 'jpeg' | 'png' | 'webp';
  bytes: number;
  version: number;
  resource_type: 'image';
  signature: string;
};

const getConfiguration = () => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const uploadPreset = process.env.CLOUDINARY_SIGNED_UPLOAD_PRESET?.trim();

  if (
    !cloudName ||
    !CLOUD_NAME_PATTERN.test(cloudName) ||
    !apiKey ||
    !API_KEY_PATTERN.test(apiKey) ||
    !apiSecret ||
    apiSecret.length < 8 ||
    /\s/.test(apiSecret) ||
    !uploadPreset ||
    !UPLOAD_PRESET_PATTERN.test(uploadPreset)
  ) {
    actionError('خدمة رفع الصور غير مهيأة بأمان.');
  }

  return { cloudName, apiKey, apiSecret, uploadPreset };
};

const verifyResponseSignature = (
  publicId: string,
  version: number,
  signature: string,
  apiSecret: string,
) => {
  const expected = createHash('sha1')
    .update(`public_id=${publicId}&version=${version}${apiSecret}`)
    .digest();
  const received = Buffer.from(signature.toLowerCase(), 'hex');
  return (
    received.length === expected.length &&
    timingSafeEqual(received, expected)
  );
};

const getCanonicalDeliveryUrl = (
  cloudName: string,
  publicId: string,
  version: number,
  format: string,
) => {
  const encodedPublicId = publicId
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/v${version}/${encodedPublicId}.${format}`;
};

export const uploadSignedContentImage = async (
  file: File,
  actorId: string,
): Promise<MarketplaceCloudinaryAsset> => {
  if (
    !UUID_PATTERN.test(actorId) ||
    file.size <= 0 ||
    file.size > MAX_IMAGE_BYTES ||
    !ALLOWED_MIME_TYPES.has(file.type)
  ) {
    actionError('ملف الصورة غير صالح للرفع.');
  }

  const configuration = getConfiguration();
  const folder = `alrehla/content/${actorId}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const parametersToSign = [
    `allowed_formats=${ALLOWED_FORMATS}`,
    `folder=${folder}`,
    `timestamp=${timestamp}`,
    `upload_preset=${configuration.uploadPreset}`,
  ].join('&');
  const requestSignature = createHash('sha1')
    .update(`${parametersToSign}${configuration.apiSecret}`, 'utf8')
    .digest('hex');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', configuration.apiKey);
  formData.append('allowed_formats', ALLOWED_FORMATS);
  formData.append('folder', folder);
  formData.append('timestamp', String(timestamp));
  formData.append('upload_preset', configuration.uploadPreset);
  formData.append('signature', requestSignature);

  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(configuration.cloudName)}/image/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );
  } catch {
    actionError('تعذر الاتصال بخدمة رفع الصور.');
  }

  const rawResponse: unknown = await response.json().catch(() => null);
  const parsed = cloudinaryResponseSchema.safeParse(rawResponse);
  if (!response.ok || !parsed.success) {
    actionError('رفضت خدمة الصور الملف المرفوع.');
  }

  const asset = parsed.data;
  const expectedPrefix = `${folder}/`;
  if (
    !asset.public_id.startsWith(expectedPrefix) ||
    asset.public_id.length <= expectedPrefix.length ||
    !/^[a-zA-Z0-9/_-]+$/.test(asset.public_id) ||
    asset.public_id.includes('..') ||
    !verifyResponseSignature(
      asset.public_id,
      asset.version,
      asset.signature,
      configuration.apiSecret,
    )
  ) {
    actionError('تعذر التحقق من استجابة رفع الصورة.');
  }

  return {
    url: getCanonicalDeliveryUrl(
      configuration.cloudName,
      asset.public_id,
      asset.version,
      asset.format,
    ),
    public_id: asset.public_id,
    width: asset.width,
    height: asset.height,
    format: asset.format,
    bytes: asset.bytes,
    version: asset.version,
    resource_type: asset.resource_type,
    signature: asset.signature,
  };
};
