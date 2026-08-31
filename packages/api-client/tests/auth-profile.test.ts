import { describe, expect, it } from 'vitest';
import {
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

const validProfile = {
  id: profileId,
  clerk_user_id: 'user_123',
  email: 'parent@example.com',
  email_verified: true,
  name: 'ولي الأمر',
  role: 'parent',
  avatar_url: null,
  account_type: 'parent',
  global_role: null,
  created_at: '2026-08-31T10:00:00.000Z',
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
  it('normalizes a valid UserProfile and preserves parent role fields', () => {
    expect(toUserProfile(validProfile)).toMatchObject({
      id: profileId,
      role: 'parent',
      account_type: 'parent',
      global_role: null,
    });
  });

  it('rejects an invalid role and missing required profile fields', () => {
    expect(() => toUserProfile({ ...validProfile, role: 'administrator' })).toThrowError(
      expect.objectContaining({ type: 'contract', code: 'API_CONTRACT_ERROR' }),
    );
    expect(() => toUserProfile({ ...validProfile, email: undefined })).toThrowError(
      expect.objectContaining({ type: 'contract', code: 'API_CONTRACT_ERROR' }),
    );
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
    const invalidProfile = createTestClient(() => jsonResponse({ ...validProfile, role: 'invalid' }));
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
