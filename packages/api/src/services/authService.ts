
import { supabase } from '../lib/supabaseClient';
import type { UserProfile, ChildProfile, UserRole } from '@alrehla/types';

const USER_ROLES: UserRole[] = [
    'user',
    'parent',
    'student',
    'instructor',
    'super_admin',
    'general_supervisor',
    'enha_lak_supervisor',
    'creative_writing_supervisor',
    'content_editor',
    'support_agent',
    'publisher',
];

const normalizeEmail = (email: string) => email.toLowerCase().trim();

const normalizeRole = (role: unknown, fallback: UserRole = 'user'): UserRole => {
    return typeof role === 'string' && USER_ROLES.includes(role as UserRole)
        ? (role as UserRole)
        : fallback;
};

export interface ClerkProfileInput {
    clerkUserId: string;
    email: string;
    name: string;
    role?: UserRole;
}

type SupabaseRpcError = {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
    status?: number;
};

const getClerkProfileSyncError = (error: SupabaseRpcError): Error => {
    const code = error.code || 'UNKNOWN';
    const message = error.message || '';

    console.error('Clerk profile sync RPC failed', {
        code,
        message,
        details: error.details,
        hint: error.hint,
        status: error.status,
    });

    if (
        code === 'PGRST202' ||
        code === '42883' ||
        message.includes('Could not find the function') ||
        message.includes('does not exist')
    ) {
        return new Error(
            'دالة مزامنة Clerk غير مثبتة أو لم تُحمّل بعد. شغّل ملف supabase/02_clerk_auth.sql ثم أعد تحميل مخطط Supabase.',
        );
    }

    if (
        code === 'PGRST301' ||
        error.status === 401 ||
        message.includes('Not authenticated') ||
        message.includes('JWT')
    ) {
        return new Error(
            'جلسة Clerk لم تصل إلى Supabase. تحقق من تفعيل Clerk ضمن Supabase Third-Party Auth ومن تطابق مفاتيح البيئة في هذا التطبيق.',
        );
    }

    if (message.includes('Clerk subject mismatch')) {
        return new Error(
            'هوية Clerk لا تطابق هوية جلسة Supabase. تحقق من أن التطبيقين يستخدمان Clerk instance وSupabase project نفسيهما.',
        );
    }

    if (message.includes('Clerk email mismatch') || message.includes('Invalid profile email')) {
        return new Error(
            'البريد القادم من Clerk لا يطابق بيانات جلسة Supabase. تحقق من إعداد مطالبات JWT في Clerk.',
        );
    }

    if (code === '23503') {
        return new Error(
            'جدول profiles ما زال مرتبطاً بجدول auth.users. شغّل أحدث ملف supabase/02_clerk_auth.sql لإزالة القيد القديم.',
        );
    }

    if (code === '23505' || message.includes('trusted account linking')) {
        return new Error(
            'يوجد ملف مستخدم بهذا البريد لكنه غير مرتبط بحساب Clerk الحالي. اربط الحساب من عملية إدارية موثوقة ثم أعد تسجيل الدخول.',
        );
    }

    return new Error(`تعذر مزامنة ملف Clerk مع Supabase. رمز الخطأ: ${code}.`);
};

export const authService = {
    async getOrCreateClerkUserProfile(input: ClerkProfileInput) {
        const normalizedEmail = normalizeEmail(input.email);
        const role = normalizeRole(input.role);
        const name = input.name?.trim() || normalizedEmail.split('@')[0] || 'مستخدم الرحلة';

        const { data, error } = await (supabase.rpc as any)('ensure_clerk_profile', {
            p_clerk_user_id: input.clerkUserId,
            p_email: normalizedEmail,
            p_name: name,
            p_role: role,
        });

        if (error) throw getClerkProfileSyncError(error);

        const profile = Array.isArray(data) ? data[0] : data;
        if (!profile?.id) {
            throw new Error('تمت المصادقة، لكن Supabase لم يُرجع ملف المستخدم بعد المزامنة.');
        }

        return profile as UserProfile;
    },

    async getUserProfileById(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) throw new Error('حدث خطأ في قراءة ملف المستخدم.');
        return (data || null) as UserProfile | null;
    },

    async getStudentProfile(userId: string) {
        try {
            const { data } = await supabase.from('child_profiles').select('*').eq('student_user_id', userId).maybeSingle();
            const child = data as any;
            
            if (!child) return null;
            
            let parentName = undefined;
            if (child.user_id) {
                const { data: parentData } = await supabase.from('public_profiles').select('name').eq('id', child.user_id).maybeSingle();
                const parent = parentData as any;
                if (parent) parentName = parent.name;
            }
            
            return { ...child, parentName } as ChildProfile;
        } catch (e) {
            return null;
        }
    },

    async getUserChildren(userId: string) {
        try {
            const { data } = await supabase.from('child_profiles').select('*').eq('user_id', userId);
            return (data || []) as ChildProfile[];
        } catch (e) {
            return [];
        }
    },
};
