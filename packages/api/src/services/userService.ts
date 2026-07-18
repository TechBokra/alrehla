
import { supabase, supabaseAuthClient, getTemporaryClient, getCurrentAppProfileId } from '../lib/supabaseClient';
import { reportingService } from './reportingService';
import type { UserProfile, ChildProfile, UserRole, PublisherProfile } from '@alrehla/types';

export interface CreateUserPayload {
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    address?: string;
    password?: string;
}

export interface UpdateUserPayload {
    id: string;
    name?: string;
    email?: string;
    role?: UserRole;
    phone?: string;
    address?: string;
    governorate?: string;
    city?: string;
    country?: string;
    timezone?: string;
    currency?: string;
    password?: string;
}

export interface GetUsersOptions {
    page?: number;
    pageSize?: number;
    search?: string;
    roleFilter?: string;
}

const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
        const normalizedEmail = email.toLowerCase().trim();
        const { data } = await supabase
            .from('profiles')
            .select('id')
            .ilike('email', normalizedEmail)
            .maybeSingle();
        return !!data;
    } catch (e) {
        return false;
    }
};

export const userService = {
    // تم تحديث الدالة لدعم Pagination والبحث
    async getAllUsers(options: GetUsersOptions = {}) {
        const { page = 1, pageSize = 50, search = '', roleFilter = 'all' } = options;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        try {
            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' });

            // تطبيق البحث
            if (search) {
                query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
            }

            // تطبيق فلتر الرتبة
            if (roleFilter && roleFilter !== 'all') {
                // التعامل مع فئات الرتب
                if (roleFilter === 'staff') {
                    query = query.in('role', ['super_admin', 'general_supervisor', 'instructor', 'content_editor', 'support_agent', 'enha_lak_supervisor', 'creative_writing_supervisor']);
                } else if (roleFilter === 'customers') {
                     query = query.in('role', ['user', 'parent']);
                } else {
                    query = query.eq('role', roleFilter);
                }
            }

            // الترتيب والتقسيم
            query = query
                .order('created_at', { ascending: false })
                .range(from, to);

            const { data, error, count } = await query;

            if (error) {
                console.warn("getAllUsers failed:", error.message);
                return { users: [], count: 0 };
            }

            return { users: (data || []) as UserProfile[], count: count || 0 };
        } catch (e) {
            console.error("Critical error fetching users:", e);
            return { users: [], count: 0 };
        }
    },

    async isEmailTaken(email: string): Promise<boolean> {
        return checkEmailExists(email);
    },

    async createUser(payload: CreateUserPayload) {
        const { name, email, role, phone, address, password } = payload;
        const normalizedEmail = email.toLowerCase().trim();

        const taken = await checkEmailExists(normalizedEmail);
        if (taken) {
            throw new Error(`البريد الإلكتروني ${normalizedEmail} مسجل بالفعل لمستخدم آخر.`);
        }
        
        const { data: authData, error: authError } = await supabaseAuthClient.auth.signUp({
            email: normalizedEmail,
            password: password || '123456',
            options: {
                data: { name, role }
            }
        });

        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error("فشل إنشاء حساب المستخدم.");

        const userId = authData.user.id;

        const { data: profile, error: pError } = await (supabase.from('profiles') as any)
            .upsert([{
                id: userId,
                name,
                email: normalizedEmail,
                role,
                phone,
                address,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (pError) {
             console.error("Profile creation error (ignored if auth succeeded):", pError);
        }

        // Auto-create related profiles based on role
        if (role === 'instructor') {
             try {
                const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000);
                await (supabase.from('instructors') as any).insert([{
                    user_id: userId,
                    name: name,
                    slug: slug,
                    specialty: 'مدرب جديد',
                    bio: 'يرجى تحديث السيرة الذاتية.',
                    rate_per_session: 150,
                    schedule_status: 'approved',
                    profile_update_status: 'approved'
                }]);
             } catch (e) { console.warn("Failed to create instructor record", e); }
        } else if (role === 'publisher') {
             try {
                const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000);
                await (supabase.from('publisher_profiles') as any).insert([{
                    user_id: userId,
                    store_name: name,
                    slug: slug,
                    description: 'يرجى تحديث وصف دار النشر.',
                }]);
             } catch (e) { console.warn("Failed to create publisher record", e); }
        }

        await reportingService.logAction('CREATE_USER', userId, `مستخدم: ${name}`, `إنشاء حساب جديد برتبة: ${role}`);
        return (profile || { id: userId, name, email, role }) as UserProfile;
    },

    async createAndLinkStudentAccount(payload: { name: string, email: string, password?: string, childProfileId: number }) {
        const normalizedEmail = payload.email.toLowerCase().trim();
        const currentUserId = await getCurrentAppProfileId();
        if (!currentUserId) throw new Error("يجب تسجيل الدخول كولي أمر أولاً.");

        const tempSupabase = getTemporaryClient();

        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email: normalizedEmail,
            password: payload.password || '123456',
            options: { data: { name: payload.name, role: 'student' } }
        });

        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error("فشل إنشاء حساب الطالب في النظام.");

        const studentUserId = authData.user.id;

        await (tempSupabase.from('profiles') as any).insert([{
            id: studentUserId,
            name: payload.name,
            email: normalizedEmail,
            role: 'student',
            created_at: new Date().toISOString()
        }]);

        const { error: linkError } = await (supabase.from('child_profiles') as any)
            .update({ student_user_id: studentUserId })
            .eq('id', payload.childProfileId);
        
        if (linkError) throw new Error(`فشل ربط الحساب بملف الطفل: ${linkError.message}`);

        const { data: profileData } = await supabase.from('profiles').select('role').eq('id', currentUserId).single();
        const parentProfile = profileData as { role: string } | null;
        
        if (parentProfile && parentProfile.role === 'user') {
            await (supabase.from('profiles') as any).update({ role: 'parent' }).eq('id', currentUserId);
        }

        return { success: true, studentId: studentUserId };
    },

    async linkStudentToChildProfile(payload: { studentUserId: string, childProfileId: number }) {
        const { error } = await (supabase.from('child_profiles') as any)
            .update({ student_user_id: payload.studentUserId })
            .eq('id', payload.childProfileId);
        
        if (error) throw new Error(error.message);
        return { success: true };
    },

    async unlinkStudentFromChildProfile(childProfileId: number) {
        const { error } = await (supabase.from('child_profiles') as any).update({ student_user_id: null }).eq('id', childProfileId);
        if (error) throw new Error(error.message);
        return { success: true };
    },

    async createChildProfile(payload: Partial<ChildProfile>) {
        const ownerId = payload.user_id || await getCurrentAppProfileId();
        if (!ownerId) throw new Error("جلسة غير صالحة");

        const { data, error } = await (supabase.from('child_profiles') as any)
            .insert([{ ...payload, user_id: ownerId }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        
        const { data: profileData } = await supabase.from('profiles').select('role').eq('id', ownerId).single();
        const parentProfile = profileData as { role: string } | null;

        if (parentProfile && parentProfile.role === 'user') {
             await (supabase.from('profiles') as any).update({ role: 'parent' }).eq('id', ownerId);
        }

        return data as ChildProfile;
    },

    async updateChildProfile(payload: Partial<ChildProfile> & { id: number }) {
        const { id, ...updates } = payload;
        const { data, error } = await (supabase.from('child_profiles') as any).update(updates).eq('id', id).select().single();
        if (error) throw new Error(error.message);
        return data as ChildProfile;
    },

    async deleteChildProfile(childId: number) {
        const { error } = await supabase.from('child_profiles').delete().eq('id', childId);
        if (error) throw new Error(error.message);
        return { success: true };
    },

    async getAllChildProfiles(userIds?: string[]) {
        try {
            let query = supabase.from('child_profiles').select('*');
            if (userIds && userIds.length > 0) {
                query = query.in('user_id', userIds);
            }
            const { data } = await query;
            return (data || []) as ChildProfile[];
        } catch { return []; }
    },

    async updateUser(payload: UpdateUserPayload) {
        const { id, password, ...updates } = payload;
        const { data, error } = await (supabase.from('profiles') as any).update(updates).eq('id', id).select().single();
        if (error) throw new Error(error.message);

        if (password && password.trim() !== '') {
            const { data: { user: currentUser } } = await supabaseAuthClient.auth.getUser();
            if (currentUser && currentUser.id === id) {
                const { error: updateError } = await supabaseAuthClient.auth.updateUser({ password: password });
                if (updateError) throw new Error(`فشل تغيير كلمة المرور: ${updateError.message}`);
            } else {
                 // Fixed: using explicit reference instead of 'this'
                 await userService.resetStudentPassword({ studentUserId: id, newPassword: password });
            }
        }
        return data as UserProfile;
    },

    async updateUserPassword(payload: { userId: string, newPassword: string }) {
        const { data: { user: currentUser } } = await supabaseAuthClient.auth.getUser();
        if (currentUser && currentUser.id === payload.userId) {
             const { error } = await supabaseAuthClient.auth.updateUser({ password: payload.newPassword });
             if (error) throw new Error(error.message);
        } else {
             // Fixed: using explicit reference instead of 'this'
             return userService.resetStudentPassword({ studentUserId: payload.userId, newPassword: payload.newPassword });
        }
        return { success: true };
    },

    async resetStudentPassword(payload: { studentUserId: string; newPassword: string }) {
        const { error } = await (supabase.rpc as any)('reset_student_password', {
            target_student_id: payload.studentUserId,
            new_password: payload.newPassword
        });

        if (error) {
             console.error("Password reset RPC error:", error);
             if (error.message.includes('Not authorized')) {
                 throw new Error("غير مصرح لك بتغيير كلمة مرور هذا المستخدم.");
             }
             throw new Error("فشل تغيير كلمة المرور: " + error.message);
        }
        return { success: true };
    },

    async bulkDeleteUsers(userIds: string[]) {
        const { error } = await supabase.from('profiles').delete().in('id', userIds);
        if (error) throw new Error(error.message);
        return { success: true };
    },

    // --- PUBLISHER SPECIFIC METHODS ---
    async getPublisherProfile(userId: string) {
        const { data, error } = await supabase
            .from('publisher_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error("Error fetching publisher profile:", error);
        }
        return data as PublisherProfile | null;
    },

    async updatePublisherProfile(payload: Partial<PublisherProfile> & { user_id: string }) {
        // We use upsert to handle both insert and update based on user_id
        const { data, error } = await (supabase.from('publisher_profiles') as any)
            .upsert(payload, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as PublisherProfile;
    },
    
    // --- UTILITY: MERGE DUPLICATE CHILDREN (NEW) ---
    async mergeDuplicateChildren() {
        // 1. Fetch all child profiles
        const { data: allChildren, error } = await supabase.from('child_profiles').select('*').order('id', { ascending: true });
        
        if (error || !allChildren) {
            throw new Error("فشل جلب بيانات الأطفال.");
        }

        // 2. Group by Parent ID -> Name (Normalized)
        const groups: Record<string, ChildProfile[]> = {};
        
        allChildren.forEach((child: ChildProfile) => {
            if (!child.user_id) return;
            const normalizedName = child.name.trim().toLowerCase();
            const key = `${child.user_id}_${normalizedName}`;
            
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(child);
        });

        // 3. Process groups with duplicates
        let mergedCount = 0;
        let deletedCount = 0;

        for (const key in groups) {
            const childrenGroup = groups[key];
            
            if (childrenGroup.length > 1) {
                // Keep the first one (sorted by ID asc, so oldest created) as Master
                const master = childrenGroup[0];
                const duplicates = childrenGroup.slice(1);
                const duplicateIds = duplicates.map(d => d.id);

                // Transfer Records from Duplicates to Master
                const tablesToUpdate = [
                    'orders', 'bookings', 'subscriptions', 'service_orders', 
                    'child_badges', 'support_session_requests', 'scheduled_sessions'
                ];

                for (const table of tablesToUpdate) {
                    await (supabase.from(table) as any)
                        .update({ child_id: master.id })
                        .in('child_id', duplicateIds);
                }

                // Delete Duplicates
                await supabase.from('child_profiles').delete().in('id', duplicateIds);
                
                mergedCount++;
                deletedCount += duplicates.length;
            }
        }
        
        return { mergedCount, deletedCount };
    }
};
