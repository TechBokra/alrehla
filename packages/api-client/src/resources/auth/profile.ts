import type { ApiClient } from '../../clients';
import { ApiError, normalizeApiError } from '../../errors';
import { optionalResult, unwrapResult } from '../../shared';
import type { ChildProfile, UserProfile } from '@alrehla/types';
import type { ClerkProfileInput } from './types';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const contractError = (message: string, details?: unknown): ApiError =>
  new ApiError(message, {
    type: 'contract',
    code: 'API_CONTRACT_ERROR',
    details,
  });

const stringValue = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
};

const toUserProfile = (value: unknown): UserProfile => {
  if (!isRecord(value)) throw contractError('ملف المستخدم المُرجع من الخادم غير صالح.', value);

  const id = stringValue(value, 'id');
  const email = stringValue(value, 'email');
  const name = stringValue(value, 'name');
  const role = stringValue(value, 'role');
  const createdAt = stringValue(value, 'created_at');
  if (!id || !email || !name || !role || !createdAt) {
    throw contractError('ملف المستخدم المُرجع من الخادم ناقص.', value);
  }

  return {
    id,
    clerk_user_id: typeof value.clerk_user_id === 'string' ? value.clerk_user_id : null,
    email,
    email_verified: typeof value.email_verified === 'boolean' ? value.email_verified : null,
    name,
    role: role as UserProfile['role'],
    avatar_url: typeof value.avatar_url === 'string' ? value.avatar_url : null,
    account_type: value.account_type === 'parent' || value.account_type === 'student'
      ? value.account_type
      : undefined,
    global_role: value.global_role === 'super_admin' || value.global_role === 'support_admin'
      ? value.global_role
      : null,
    phone: typeof value.phone === 'string' ? value.phone : undefined,
    address: typeof value.address === 'string' ? value.address : undefined,
    city: typeof value.city === 'string' ? value.city : undefined,
    country: typeof value.country === 'string' ? value.country : undefined,
    governorate: typeof value.governorate === 'string' ? value.governorate : undefined,
    timezone: typeof value.timezone === 'string' ? value.timezone : undefined,
    currency: typeof value.currency === 'string' ? value.currency : undefined,
    created_at: createdAt,
  };
};

const toChildProfile = (value: unknown): ChildProfile => {
  if (!isRecord(value)) throw contractError('ملف الطفل المُرجع من الخادم غير صالح.', value);

  const id = typeof value.id === 'number' ? value.id : Number(value.id);
  const userId = stringValue(value, 'user_id');
  const name = stringValue(value, 'name');
  if (!Number.isFinite(id) || !userId || !name) {
    throw contractError('ملف الطفل المُرجع من الخادم ناقص.', value);
  }

  return {
    id,
    user_id: userId,
    student_user_id: typeof value.student_user_id === 'string' ? value.student_user_id : null,
    student_email: typeof value.student_email === 'string' ? value.student_email : undefined,
    name,
    birth_date: typeof value.birth_date === 'string' ? value.birth_date : '',
    gender: value.gender === 'أنثى' ? 'أنثى' : 'ذكر',
    avatar_url: typeof value.avatar_url === 'string' ? value.avatar_url : null,
    interests: Array.isArray(value.interests)
      ? value.interests.filter((entry): entry is string => typeof entry === 'string')
      : undefined,
    strengths: Array.isArray(value.strengths)
      ? value.strengths.filter((entry): entry is string => typeof entry === 'string')
      : undefined,
    age: typeof value.age === 'number' ? value.age : undefined,
    parentName: typeof value.parentName === 'string' ? value.parentName : undefined,
  };
};

const firstRpcRow = (value: unknown): unknown =>
  Array.isArray(value) ? value[0] : value;

export const ensureClerkProfile = async (
  client: ApiClient,
  input: ClerkProfileInput,
): Promise<UserProfile> => {
  const email = normalizeEmail(input.email);
  const name = input.name.trim() || email.split('@')[0] || 'مستخدم الرحلة';

  try {
    const result = await client.rpc('ensure_clerk_profile', {
      p_email: email,
      p_name: name,
    });
    return toUserProfile(unwrapResult(result, 'تعذر مزامنة ملف المستخدم.'));
  } catch (error) {
    throw normalizeApiError(error, 'تعذر مزامنة ملف المستخدم.');
  }
};

export const getProfile = async (
  client: ApiClient,
  profileId: string,
): Promise<UserProfile | null> => {
  try {
    const result = await client.from('profiles').select('*').eq('id', profileId).maybeSingle();
    const profile = optionalResult(result, 'تعذر قراءة ملف المستخدم.');
    return profile ? toUserProfile(profile) : null;
  } catch (error) {
    throw normalizeApiError(error, 'تعذر قراءة ملف المستخدم.');
  }
};

export const getCurrentProfile = async (client: ApiClient): Promise<UserProfile | null> => {
  const result = await client.rpc('current_app_profile_id');
  const profileId = optionalResult(result, 'تعذر تحديد ملف المستخدم الحالي.');
  return typeof profileId === 'string' && profileId ? getProfile(client, profileId) : null;
};

export const getStudentProfileByProfileId = async (
  client: ApiClient,
  profileId: string,
): Promise<ChildProfile | null> => {
  const result = await client
    .from('child_profiles')
    .select('*')
    .eq('student_user_id', profileId)
    .maybeSingle();
  const child = optionalResult(result, 'تعذر قراءة ملف الطالب.');
  if (!child) return null;

  const normalized = toChildProfile(child);
  if (!normalized.user_id) return normalized;

  const parentResult = await client
    .from('public_profiles')
    .select('name')
    .eq('id', normalized.user_id)
    .maybeSingle();
  const parent = optionalResult(parentResult, 'تعذر قراءة ملف ولي الأمر.');
  const parentProfile = parent as { name?: unknown } | null;
  return {
    ...normalized,
    parentName:
      parentProfile && typeof parentProfile.name === 'string'
        ? parentProfile.name
        : undefined,
  };
};

export const getChildProfileById = async (
  client: ApiClient,
  childProfileId: number,
): Promise<ChildProfile | null> => {
  const result = await client.from('child_profiles').select('*').eq('id', childProfileId).maybeSingle();
  const child = optionalResult(result, 'تعذر قراءة ملف الطفل.');
  return child ? toChildProfile(child) : null;
};

export const getChildProfiles = async (
  client: ApiClient,
  parentProfileId: string,
): Promise<ChildProfile[]> => {
  const result = await client
    .from('child_profiles')
    .select('*')
    .eq('user_id', parentProfileId)
    .order('id', { ascending: true });
  const rows = unwrapResult(result, 'تعذر قراءة ملفات الأطفال.');
  if (!Array.isArray(rows)) throw contractError('قائمة ملفات الأطفال المُرجعة من الخادم غير صالحة.', rows);
  return rows.map(toChildProfile);
};

export const getChildProfilesByIds = async (
  client: ApiClient,
  childProfileIds: number[],
): Promise<ChildProfile[]> => {
  if (!childProfileIds.length) return [];
  const result = await client.from('child_profiles').select('*').in('id', childProfileIds);
  const rows = unwrapResult(result, 'تعذر قراءة ملفات الأطفال.');
  if (!Array.isArray(rows)) throw contractError('قائمة ملفات الأطفال المُرجعة من الخادم غير صالحة.', rows);
  return rows.map(toChildProfile);
};

export { toChildProfile, toUserProfile, contractError, firstRpcRow };
