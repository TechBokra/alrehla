'use client';

export type CloudinaryAsset = {
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  version: number;
  resource_type: 'image';
  signature: string;
};

export type MarketplaceUploadPurpose = 'child-profile';

type UploadAuthorization = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  uploadPreset: string;
  signature: string;
};

type CloudinaryUploadResponse = {
  secure_url?: unknown;
  public_id?: unknown;
  width?: unknown;
  height?: unknown;
  format?: unknown;
  bytes?: unknown;
  version?: unknown;
  resource_type?: unknown;
  signature?: unknown;
};

export const MAX_MARKETPLACE_IMAGE_BYTES = 10 * 1024 * 1024;
export const MARKETPLACE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const ALLOWED_FORMATS = 'jpg,jpeg,png,webp';
const ALLOWED_FORMAT_SET = new Set(ALLOWED_FORMATS.split(','));
const UPLOAD_PRESET_PATTERN = /^[a-z0-9_-]{1,100}$/i;
const CHILD_PROFILE_FOLDER_PATTERN =
  /^alrehla\/child-profiles\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validateMarketplaceImage = (file: File): void => {
  if (!MARKETPLACE_IMAGE_MIME_TYPES.some((mimeType) => mimeType === file.type)) {
    throw new Error('نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP.');
  }

  if (file.size <= 0) {
    throw new Error('ملف الصورة فارغ.');
  }

  if (file.size > MAX_MARKETPLACE_IMAGE_BYTES) {
    throw new Error('حجم الصورة يجب ألا يتجاوز 10 ميجابايت.');
  }
};

const isUploadAuthorization = (value: unknown): value is UploadAuthorization => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<UploadAuthorization>;
  return (
    typeof candidate.cloudName === 'string' &&
    /^[a-z0-9_-]+$/i.test(candidate.cloudName) &&
    typeof candidate.apiKey === 'string' &&
    candidate.apiKey.length > 0 &&
    typeof candidate.timestamp === 'number' &&
    Number.isSafeInteger(candidate.timestamp) &&
    typeof candidate.folder === 'string' &&
    CHILD_PROFILE_FOLDER_PATTERN.test(candidate.folder) &&
    candidate.allowedFormats === ALLOWED_FORMATS &&
    typeof candidate.uploadPreset === 'string' &&
    UPLOAD_PRESET_PATTERN.test(candidate.uploadPreset) &&
    typeof candidate.signature === 'string' &&
    /^[0-9a-f]{40}$/i.test(candidate.signature)
  );
};

const requestUploadAuthorization = async (
  purpose: MarketplaceUploadPurpose,
): Promise<UploadAuthorization> => {
  const response = await fetch('/api/cloudinary/signature', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ purpose }),
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok || !isUploadAuthorization(payload)) {
    throw new Error('تعذر تفويض رفع الصورة. حاول مرة أخرى.');
  }

  return payload;
};

const uploadImage = async (
  file: File,
  purpose: MarketplaceUploadPurpose,
): Promise<CloudinaryAsset> => {
  validateMarketplaceImage(file);

  const authorization = await requestUploadAuthorization(purpose);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', authorization.apiKey);
  formData.append('timestamp', String(authorization.timestamp));
  formData.append('folder', authorization.folder);
  formData.append('allowed_formats', authorization.allowedFormats);
  formData.append('upload_preset', authorization.uploadPreset);
  formData.append('signature', authorization.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(authorization.cloudName)}/image/upload`,
    {
      method: 'POST',
      body: formData,
    },
  );
  const payload: CloudinaryUploadResponse | null = await response
    .json()
    .catch(() => null);

  if (
    !response.ok ||
    !payload ||
    typeof payload.secure_url !== 'string' ||
    !payload.secure_url.startsWith('https://') ||
    typeof payload.public_id !== 'string' ||
    !payload.public_id.startsWith(`${authorization.folder}/`) ||
    payload.resource_type !== 'image' ||
    typeof payload.format !== 'string' ||
    !ALLOWED_FORMAT_SET.has(payload.format) ||
    typeof payload.bytes !== 'number' ||
    !Number.isSafeInteger(payload.bytes) ||
    payload.bytes <= 0 ||
    payload.bytes > MAX_MARKETPLACE_IMAGE_BYTES ||
    typeof payload.version !== 'number' ||
    !Number.isSafeInteger(payload.version) ||
    payload.version <= 0 ||
    typeof payload.signature !== 'string' ||
    !/^[0-9a-f]{40}$/i.test(payload.signature) ||
    typeof payload.width !== 'number' ||
    !Number.isSafeInteger(payload.width) ||
    payload.width <= 0 ||
    typeof payload.height !== 'number' ||
    !Number.isSafeInteger(payload.height) ||
    payload.height <= 0
  ) {
    throw new Error('فشل رفع الصورة إلى خدمة الصور. حاول مرة أخرى.');
  }

  return {
    url: payload.secure_url,
    public_id: payload.public_id,
    width: payload.width,
    height: payload.height,
    format: payload.format,
    bytes: payload.bytes,
    version: payload.version,
    resource_type: payload.resource_type,
    signature: payload.signature,
  };
};

export const marketplaceCloudinaryUploadService = {
  uploadImage,
};
