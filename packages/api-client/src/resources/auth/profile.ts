import type { ApiClient } from '../../clients';
import { ApiError, normalizeApiError } from '../../errors';
import { optionalResult, unwrapResult } from '../../shared';
import {
  ACCOUNT_TYPES,
  GLOBAL_ROLES,
  USER_ROLES,
  type ChildProfile,
  type UserProfile,
} from '@alrehla/types';
import type { Database } from '@alrehla/types';
import type { ClerkProfileInput } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const contractError = (message: string, details?: unknown): ApiError =>
  new ApiError(message, {
    type: 'contract',
    code: 'API_CONTRACT_ERROR',
    details,
  });

const requiredString = (record: Record<string, unknown>, key: string, message: string): string => {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) throw contractError(message, { key, value });
  return value;
};

const optionalString = (
  record: Record<string, unknown>,
  key: string,
  message: string,
): string | undefined => {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw contractError(message, { key, value });
  return value;
};

const nullableString = (
  record: Record<string, unknown>,
  key: string,
  message: string,
): string | null => {
  const value = record[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw contractError(message, { key, value });
  return value;
};

const optionalBoolean = (
  record: Record<string, unknown>,
  key: string,
  message: string,
): boolean | null => {
  const value = record[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'boolean') throw contractError(message, { key, value });
  return value;
};

const isUserRole = (value: unknown): value is UserProfile['role'] =>
  typeof value === 'string' && USER_ROLES.some((role) => role === value);

const isAccountType = (value: unknown): value is UserProfile['account_type'] =>
  typeof value === 'string' && ACCOUNT_TYPES.some((accountType) => accountType === value);

const isGlobalRole = (value: unknown): value is NonNullable<UserProfile['global_role']> =>
  typeof value === 'string' && GLOBAL_ROLES.some((globalRole) => globalRole === value);

const normalizeEmail = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim() || !value.includes('@')) {
    throw contractError('البريد الإلكتروني المُرسل إلى الخادم غير صالح.', value);
  }
  return value.trim().toLowerCase();
};

const requireIdentifier = (value: unknown, name: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw contractError(`المعرّف ${name} غير صالح.`, value);
  }
  return value;
};

const requirePositiveInteger = (value: unknown, name: string): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw contractError(`المعرّف ${name} غير صالح.`, value);
  }
  return value;
};

const optionalStringArray = (
  record: Record<string, unknown>,
  key: string,
): string[] | undefined => {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw contractError(`قيمة ${key} المُرجعة من الخادم غير صالحة.`, value);
  }
  return value;
};

const toUserProfile = (value: unknown): UserProfile => {
  if (!isRecord(value)) throw contractError('ملف المستخدم المُرجع من الخادم غير صالح.', value);

  const id = requiredString(value, 'id', 'معرّف ملف المستخدم المُرجع من الخادم غير صالح.');
  const email = requiredString(value, 'email', 'بريد ملف المستخدم المُرجع من الخادم غير صالح.');
  const name = requiredString(value, 'name', 'اسم ملف المستخدم المُرجع من الخادم غير صالح.');
  const roleValue = requiredString(value, 'role', 'دور ملف المستخدم المُرجع من الخادم غير صالح.');
  const createdAt = requiredString(value, 'created_at', 'تاريخ إنشاء ملف المستخدم غير صالح.');
  if (!isUserRole(roleValue)) throw contractError('دور ملف المستخدم المُرجع من الخادم غير معروف.', roleValue);

  const accountTypeValue = value.account_type;
  if (
    accountTypeValue !== undefined &&
    accountTypeValue !== null &&
    !isAccountType(accountTypeValue)
  ) {
    throw contractError('نوع حساب المستخدم المُرجع من الخادم غير معروف.', accountTypeValue);
  }
  const globalRoleValue = value.global_role;
  if (
    globalRoleValue !== undefined &&
    globalRoleValue !== null &&
    !isGlobalRole(globalRoleValue)
  ) {
    throw contractError('الدور العام للمستخدم المُرجع من الخادم غير معروف.', globalRoleValue);
  }

  const accountType = isAccountType(accountTypeValue) ? accountTypeValue : undefined;
  const globalRole = isGlobalRole(globalRoleValue) ? globalRoleValue : null;

  return {
    id,
    clerk_user_id: nullableString(value, 'clerk_user_id', 'معرّف Clerk المُرجع من الخادم غير صالح.'),
    email,
    email_verified: optionalBoolean(value, 'email_verified', 'حالة توثيق البريد المُرجعة من الخادم غير صالحة.'),
    name,
    role: roleValue,
    avatar_url: nullableString(value, 'avatar_url', 'رابط صورة المستخدم المُرجع من الخادم غير صالح.'),
    account_type: accountType,
    global_role: globalRole,
    phone: optionalString(value, 'phone', 'رقم هاتف المستخدم المُرجع من الخادم غير صالح.'),
    address: optionalString(value, 'address', 'عنوان المستخدم المُرجع من الخادم غير صالح.'),
    city: optionalString(value, 'city', 'مدينة المستخدم المُرجع من الخادم غير صالحة.'),
    country: optionalString(value, 'country', 'دولة المستخدم المُرجعة من الخادم غير صالحة.'),
    governorate: optionalString(value, 'governorate', 'محافظة المستخدم المُرجعة من الخادم غير صالحة.'),
    timezone: optionalString(value, 'timezone', 'منطقة المستخدم الزمنية المُرجعة من الخادم غير صالحة.'),
    currency: optionalString(value, 'currency', 'عملة المستخدم المُرجعة من الخادم غير صالحة.'),
    created_at: createdAt,
  };
};

const toChildProfile = (value: unknown): ChildProfile => {
  if (!isRecord(value)) throw contractError('ملف الطفل المُرجع من الخادم غير صالح.', value);

  const id = requirePositiveInteger(value.id, 'الطفل');
  const userId = requiredString(value, 'user_id', 'معرّف ولي أمر الطفل المُرجع من الخادم غير صالح.');
  const name = requiredString(value, 'name', 'اسم الطفل المُرجع من الخادم غير صالح.');
  const gender = value.gender;
  if (gender !== 'ذكر' && gender !== 'أنثى') throw contractError('نوع الطفل المُرجع من الخادم غير معروف.', gender);
  const birthDate = requiredString(value, 'birth_date', 'تاريخ ميلاد الطفل المُرجع من الخادم غير صالح.');
  const age = value.age;
  if (age !== undefined && age !== null && (typeof age !== 'number' || !Number.isFinite(age) || age < 0)) {
    throw contractError('عمر الطفل المُرجع من الخادم غير صالح.', age);
  }
  const normalizedAge = typeof age === 'number' ? age : undefined;

  return {
    id,
    user_id: userId,
    student_user_id: nullableString(value, 'student_user_id', 'معرّف الطالب المُرجع من الخادم غير صالح.'),
    student_email: optionalString(value, 'student_email', 'بريد الطالب المُرجع من الخادم غير صالح.'),
    name,
    birth_date: birthDate,
    gender,
    avatar_url: nullableString(value, 'avatar_url', 'رابط صورة الطفل المُرجع من الخادم غير صالح.'),
    interests: optionalStringArray(value, 'interests'),
    strengths: optionalStringArray(value, 'strengths'),
    age: normalizedAge,
    parentName: optionalString(value, 'parentName', 'اسم ولي الأمر المُرجع من الخادم غير صالح.'),
  };
};

const normalizeProfileIdResult = (value: unknown): string | null => {
  if (value === null) return null;
  return requireIdentifier(value, 'ملف المستخدم الحالي');
};

const normalizePublicProfile = (value: unknown): { name: string } | null => {
  if (value === null) return null;
  if (!isRecord(value)) throw contractError('ملف ولي الأمر المُرجع من الخادم غير صالح.', value);
  return {
    name: requiredString(value, 'name', 'اسم ولي الأمر المُرجع من الخادم غير صالح.'),
  };
};

export const ensureClerkProfile = async (
  client: ApiClient,
  input: ClerkProfileInput,
): Promise<UserProfile> => {
  const email = normalizeEmail(input.email);
  const name = typeof input.name === 'string' ? input.name.trim() || email.split('@')[0] : '';
  if (!name) throw contractError('اسم المستخدم المُرسل إلى الخادم غير صالح.', input.name);

  try {
    const args: Database['public']['Functions']['ensure_clerk_profile']['Args'] = {
      p_email: email,
      p_name: name,
    };
    const result = await client.rpc('ensure_clerk_profile', args);
    return toUserProfile(unwrapResult(result, 'تعذر مزامنة ملف المستخدم.'));
  } catch (error) {
    throw normalizeApiError(error, 'تعذر مزامنة ملف المستخدم.');
  }
};

export const getProfile = async (
  client: ApiClient,
  profileId: string,
): Promise<UserProfile | null> => {
  const normalizedProfileId = requireIdentifier(profileId, 'ملف المستخدم');
  try {
    const result = await client.from('profiles').select('*').eq('id', normalizedProfileId).maybeSingle();
    const profile = optionalResult(result, 'تعذر قراءة ملف المستخدم.');
    return profile ? toUserProfile(profile) : null;
  } catch (error) {
    throw normalizeApiError(error, 'تعذر قراءة ملف المستخدم.');
  }
};

export const getCurrentProfile = async (client: ApiClient): Promise<UserProfile | null> => {
  try {
    const result = await client.rpc('current_app_profile_id');
    const profileId = normalizeProfileIdResult(optionalResult(result, 'تعذر تحديد ملف المستخدم الحالي.'));
    return profileId ? getProfile(client, profileId) : null;
  } catch (error) {
    throw normalizeApiError(error, 'تعذر تحديد ملف المستخدم الحالي.');
  }
};

export const getStudentProfileByProfileId = async (
  client: ApiClient,
  profileId: string,
): Promise<ChildProfile | null> => {
  const normalizedProfileId = requireIdentifier(profileId, 'الطالب');
  try {
    const result = await client
      .from('child_profiles')
      .select('*')
      .eq('student_user_id', normalizedProfileId)
      .maybeSingle();
    const child = optionalResult(result, 'تعذر قراءة ملف الطالب.');
    if (!child) return null;

    const normalized = toChildProfile(child);
    const parentResult = await client
      .from('public_profiles')
      .select('name')
      .eq('id', normalized.user_id)
      .maybeSingle();
    const parent = optionalResult(parentResult, 'تعذر قراءة ملف ولي الأمر.');
    const parentProfile = normalizePublicProfile(parent);
    return {
      ...normalized,
      parentName: parentProfile?.name,
    };
  } catch (error) {
    throw normalizeApiError(error, 'تعذر قراءة ملف الطالب.');
  }
};

export const getChildProfileById = async (
  client: ApiClient,
  childProfileId: number,
): Promise<ChildProfile | null> => {
  const normalizedChildProfileId = requirePositiveInteger(childProfileId, 'الطفل');
  try {
    const result = await client.from('child_profiles').select('*').eq('id', normalizedChildProfileId).maybeSingle();
    const child = optionalResult(result, 'تعذر قراءة ملف الطفل.');
    return child ? toChildProfile(child) : null;
  } catch (error) {
    throw normalizeApiError(error, 'تعذر قراءة ملف الطفل.');
  }
};

export const getChildProfiles = async (
  client: ApiClient,
  parentProfileId: string,
): Promise<ChildProfile[]> => {
  const normalizedParentProfileId = requireIdentifier(parentProfileId, 'ولي الأمر');
  try {
    const result = await client
      .from('child_profiles')
      .select('*')
      .eq('user_id', normalizedParentProfileId)
      .order('id', { ascending: true });
    const rows = unwrapResult(result, 'تعذر قراءة ملفات الأطفال.');
    if (!Array.isArray(rows)) throw contractError('قائمة ملفات الأطفال المُرجعة من الخادم غير صالحة.', rows);
    return rows.map(toChildProfile);
  } catch (error) {
    throw normalizeApiError(error, 'تعذر قراءة ملفات الأطفال.');
  }
};

export const getChildProfilesByIds = async (
  client: ApiClient,
  childProfileIds: number[],
): Promise<ChildProfile[]> => {
  childProfileIds.forEach((childProfileId) => requirePositiveInteger(childProfileId, 'الطفل'));
  if (!childProfileIds.length) return [];
  try {
    const result = await client.from('child_profiles').select('*').in('id', childProfileIds);
    const rows = unwrapResult(result, 'تعذر قراءة ملفات الأطفال.');
    if (!Array.isArray(rows)) throw contractError('قائمة ملفات الأطفال المُرجعة من الخادم غير صالحة.', rows);
    return rows.map(toChildProfile);
  } catch (error) {
    throw normalizeApiError(error, 'تعذر قراءة ملفات الأطفال.');
  }
};

export { toChildProfile, toUserProfile, contractError };
