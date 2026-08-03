import { createHash } from 'node:crypto';

import {
  getCurrentAppProfileId,
  runWithSupabaseAccessTokenProvider,
} from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

enum UploadPurpose {
  ChildProfile = 'child-profile',
}

const UPLOAD_POLICIES: Record<UploadPurpose, { folderPrefix: string }> = {
  [UploadPurpose.ChildProfile]: {
    folderPrefix: 'alrehla/child-profiles',
  },
};

const ALLOWED_FORMATS = 'jpg,jpeg,png,webp';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLOUD_NAME_PATTERN = /^[a-z0-9_-]+$/i;
const API_KEY_PATTERN = /^[a-z0-9_-]+$/i;
const UPLOAD_PRESET_PATTERN = /^[a-z0-9_-]{1,100}$/i;
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  NextResponse.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });

const isUploadPurpose = (value: unknown): value is UploadPurpose =>
  typeof value === 'string' &&
  Object.prototype.hasOwnProperty.call(UPLOAD_POLICIES, value);

const getCloudinaryConfiguration = () => {
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
    return null;
  }

  return { cloudName, apiKey, apiSecret, uploadPreset };
};

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session.userId) {
      return jsonResponse({ error: 'Authentication required.' }, 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid request body.' }, 400);
    }

    const purpose =
      typeof body === 'object' && body !== null && 'purpose' in body
        ? body.purpose
        : null;

    if (!isUploadPurpose(purpose)) {
      return jsonResponse({ error: 'Unsupported upload purpose.' }, 400);
    }

    const configuration = getCloudinaryConfiguration();
    if (!configuration) {
      return jsonResponse({ error: 'Image upload is not configured.' }, 503);
    }

    const profileId = await runWithSupabaseAccessTokenProvider(
      async () => {
        const token = await session.getToken();
        if (!token) {
          throw new Error('Authenticated Supabase token is unavailable.');
        }
        return token;
      },
      getCurrentAppProfileId,
    );

    if (!profileId || !UUID_PATTERN.test(profileId)) {
      return jsonResponse({ error: 'Authenticated profile is unavailable.' }, 403);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `${UPLOAD_POLICIES[purpose].folderPrefix}/${profileId}`;
    const parametersToSign = [
      `allowed_formats=${ALLOWED_FORMATS}`,
      `folder=${folder}`,
      `timestamp=${timestamp}`,
      `upload_preset=${configuration.uploadPreset}`,
    ].join('&');
    const signature = createHash('sha1')
      .update(`${parametersToSign}${configuration.apiSecret}`, 'utf8')
      .digest('hex');

    return jsonResponse(
      {
        cloudName: configuration.cloudName,
        apiKey: configuration.apiKey,
        timestamp,
        folder,
        allowedFormats: ALLOWED_FORMATS,
        uploadPreset: configuration.uploadPreset,
        signature,
      },
      200,
    );
  } catch {
    return jsonResponse({ error: 'Unable to authorize image upload.' }, 500);
  }
}
