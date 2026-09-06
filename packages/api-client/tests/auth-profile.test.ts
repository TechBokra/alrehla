import { describe, expect, it } from 'vitest';
import {
  PROFILE_SELECT,
  getChildProfileById,
  getChildProfiles,
  getStudentProfileByProfileId,
  getProfile,
  toChildProfile,
  toUserProfile,
} from '../src/resources/auth/profile';
import { ApiError } from '../src/errors';
import { createTestClient, jsonResponse } from './helpers';

const profileId = '11111111-1111-4111-8111-111111111111';

const productionProfile = {
  id: profileId,
  clerk_user_id: 'user_123',
  email: 'parent@example.com',
  name: 'ولي الأمر',
  role: 'parent',
  phone: null,
  governorate: 'القاهرة',
  address: null,
  created_at: '2026-08-31T10:00:00.000Z',
  updated_at: '2026-09-01T10:00:00.000Z',
  country: 'EG',
  timezone: 'UTC',
  currency: 'EGP',
  city: 'Cairo',
};

const developmentSupersetProfile = {
  ...productionProfile,
  email_verified: true,
  avatar_url: 'https://example.com/avatar.png',
  account_type: 'parent',
  global_role: 'super_admin',
};

const validChild = {
  id: 3,
  user_id: profileId,
  student_user_id: '22222222-2222-4222-8222-222222222222',
  student_email: 'student@example.com',
  name: 'ليان',
  birth_date: '2015-04-10',
  gender: 'أنثى',
  avatar_url: null,
  interests: ['القراءة'],
  strengths: ['الخيال'],
  age: 11,
};

describe('Auth/Profile normalization', () => {
  it('normalizes the Production profiles contract without development-only columns', () => {
    expect(toUserProfile(productionProfile)).toMatchObject({
      id: profileId,
      email: 'parent@example.com',
      name: 'ولي الأمر',
      role: 'parent',
      governorate: 'القاهرة',
      country: 'EG',
      timezone: 'UTC',
      currency: 'EGP',
      city: 'Cairo',
    });
  });

  it('ignores development-only profile fields when a superset row is returned', () => {
    const profile = toUserProfile(developmentSupersetProfile);

    expect(profile).toMatchObject({
      id: profileId,
      role: 'parent',
    });
    expect(profile).not.toHaveProperty('account_type');
    expect(profile).not.toHaveProperty('global_role');
    expect(profile).not.toHaveProperty('email_verified');
    expect(profile).not.toHaveProperty('avatar_url');
  });

  it('handles nullable Production name and role with safe application fallbacks', () => {
    expect(toUserProfile({ ...productionProfile, name: null, role: null })).toMatchObject({
      name: 'parent',
      role: 'user',
    });

    expect(toUserProfile({ ...productionProfile, role: 'administrator' })).toMatchObject({
      role: 'user',
    });
  });

  it('still rejects missing required Production profile fields', () => {
    expect(() => toUserProfile({ ...productionProfile, email: undefined })).toThrowError(
      expect.objectContaining({ type: 'contract', code: 'API_CONTRACT_ERROR' }),
    );
    expect(() => toUserProfile({ ...productionProfile, created_at: undefined })).toThrowError(
      expect.objectContaining({ type: 'contract', code: 'API_CONTRACT_ERROR' }),
    );
  });

  it('uses an explicit Production-compatible projection for profile reads', async () => {
    const { client, requests } = createTestClient(() => jsonResponse(productionProfile));

    const profile = await getProfile(client, profileId);

    expect(profile).toMatchObject({ id: profileId, role: 'parent' });
    expect(requests).toHaveLength(1);

    const select = new URL(requests[0].url).searchParams.get('select');
    expect(select).toBe(PROFILE_SELECT);
    expect(select).not.toContain('*');
    expect(select).not.toContain('account_type');
    expect(select).not.toContain('global_role');
    expect(select).not.toContain('email_verified');
    expect(select).not.toContain('avatar_url');
  });

  it('normalizes a valid ChildProfile and rejects invalid gender or child ID', () => {
    expect(toChildProfile(validChild)).toMatchObject({
      id: 3,
      gender: 'أنثى',
      interests: ['القراءة'],
    });
    expect(() => toChildProfile({ ...validChild, gender: 'unknown' })).toThrowError(
      expect.objectContaining({ type: 'contract', code: 'API_CONTRACT_ERROR' }),
    );
    expect(() => toChildProfile({ ...validChild, id: 0 })).toThrowError(
      expect.objectContaining({ type: 'contract', code: 'API_CONTRACT_ERROR' }),
    );
    expect(() => toChildProfile({ ...validChild, id: '3' })).toThrowError(
      expect.objectContaining({ type: 'contract', code: 'API_CONTRACT_ERROR' }),
    );
  });

  it('normalizes a student lookup and its parent relationship', async () => {
    const { client, requests } = createTestClient((request) => {
      if (new URL(request.url).pathname.endsWith('/child_profiles')) return jsonResponse(validChild);
      return jsonResponse({ name: 'ولي الأمر' });
    });

    const child = await getStudentProfileByProfileId(client, validChild.student_user_id);

    expect(child).toMatchObject({ id: 3, parentName: 'ولي الأمر' });
    expect(requests).toHaveLength(2);
  });

  it('rejects invalid server contracts from profile and child queries', async () => {
    const invalidProfile = createTestClient(() => jsonResponse({ ...productionProfile, email: null }));
    await expect(getProfile(invalidProfile.client, profileId)).rejects.toMatchObject({
      type: 'contract',
      code: 'API_CONTRACT_ERROR',
    });

    const invalidChild = createTestClient(() => jsonResponse({ ...validChild, gender: 'invalid' }));
    await expect(getChildProfileById(invalidChild.client, 3)).rejects.toBeInstanceOf(ApiError);

    const invalidChildren = createTestClient(() => jsonResponse([
      validChild,
      { ...validChild, id: 4, gender: 'invalid' },
    ]));
    await expect(getChildProfiles(invalidChildren.client, profileId)).rejects.toMatchObject({
      type: 'contract',
      code: 'API_CONTRACT_ERROR',
    });
  });
});
