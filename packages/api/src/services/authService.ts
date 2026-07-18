
import { supabase, supabaseAuthClient } from '../lib/supabaseClient';
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
    async login(email: string, password: string) {
        const normalizedEmail = normalizeEmail(email);

        const { data: authData, error: authError } = await supabaseAuthClient.auth.signInWithPassword({
            email: normalizedEmail,
            password,
        });

        if (authError) {
            console.error("Login Error:", authError);
            let errorMessage = "فشل تسجيل الدخول.";
            
            if (authError.message.includes("Invalid login credentials")) {
                errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
            } else if (authError.message.includes("Email not confirmed")) {
                errorMessage = "البريد الإلكتروني غير مفعل. يرجى التحقق من صندوق الوارد.";
            } else if (authError.message.includes("Too many requests")) {
                errorMessage = "تم تجاوز حد المحاولات المسموح به. يرجى الانتظار قليلاً.";
            }

            throw new Error(errorMessage);
        }

        const authUser = authData.user;
        if (!authUser) throw new Error("فشل التعرف على المستخدم.");

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

        if (error) {
            console.error("Database Error:", error);
            throw new Error("حدث خطأ في الاتصال بقاعدة البيانات.");
        }

        if (!profile) {
            throw new Error("عذراً، لم يتم العثور على ملف المستخدم المرتبط بهذا الحساب. يرجى التواصل مع الدعم الفني.");
        }

        return {
            user: profile as UserProfile,
            accessToken: authData.session?.access_token || '',
        };
    },

    async getCurrentUser() {
        const { data: { user: authUser }, error: authError } = await supabaseAuthClient.auth.getUser();
        if (!authUser || authError) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

        if (!profile) return null;

        return { user: profile as UserProfile };
    },

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

    async logout() {
        await supabaseAuthClient.auth.signOut();
        localStorage.removeItem('accessToken');
    },

    async register(email: string, password: string, name: string, role: UserRole) {
        const normalizedEmail = normalizeEmail(email);

        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (existingUser) {
            throw new Error("هذا البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد آخر أو تسجيل الدخول.");
        }

        const { data: authData, error: authError } = await supabaseAuthClient.auth.signUp({
            email: normalizedEmail,
            password,
            options: { data: { name, role } } 
        });
        
        if (authError) {
             let errorMessage = authError.message;
             if (errorMessage.includes("User already registered") || errorMessage.includes("already has been taken")) {
                 errorMessage = "هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر.";
             } else if (errorMessage.includes("Password should be at least")) {
                 errorMessage = "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
             }
             throw new Error(errorMessage);
        }
        
        if (authData.user) {
             const { error } = await (supabase.from('profiles') as any).insert({
                id: authData.user.id,
                email: normalizedEmail,
                name,
                role,
                created_at: new Date().toISOString()
            });
            if (error) console.error("Registration DB Error:", error);
            
            if (role === 'parent' || role === 'user') {
                 await (supabase.from('child_profiles') as any).insert({
                    user_id: authData.user.id,
                    name: 'طفلي الأول',
                    birth_date: new Date().toISOString().split('T')[0],
                    gender: 'ذكر'
                });
            }
        }
        
        return {
            user: { id: authData.user!.id, email: normalizedEmail, name, role, created_at: new Date().toISOString() } as UserProfile,
            accessToken: authData.session?.access_token || '',
        };
    },

    async getUserChildren(userId: string) {
        try {
            const { data } = await supabase.from('child_profiles').select('*').eq('user_id', userId);
            return (data || []) as ChildProfile[];
        } catch (e) {
            return [];
        }
    },

    async resetPasswordForEmail(email: string) {
        const redirectTo = `${window.location.protocol}//${window.location.host}`;
        
        const { error } = await supabaseAuthClient.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo,
        });

        if (error) {
            if (error.message.includes("Too many requests")) {
                throw new Error("لقد طلبت إعادة تعيين كلمة المرور عدة مرات. يرجى الانتظار قليلاً.");
            }
            throw new Error(error.message);
        }
        return { success: true };
    },

    async updatePassword(newPassword: string) {
        const { error } = await supabaseAuthClient.auth.updateUser({ password: newPassword });
        if (error) throw new Error("فشل تحديث كلمة المرور. حاول مرة أخرى.");
        return { success: true };
    }
};
