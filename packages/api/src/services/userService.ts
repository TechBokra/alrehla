
import { supabase, getCurrentAppProfileId } from '../lib/supabaseClient';
import { reportingService } from './reportingService';
import type { UserProfile, ChildProfile, UserRole, PublisherProfile } from '@alrehla/types';

export interface CreateUserPayload {
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    address?: string;
    password?: string;
    clerkUserId?: string;
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
        const { name, email, role, phone, address, clerkUserId } = payload;
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedClerkUserId = clerkUserId?.trim();

        const taken = await checkEmailExists(normalizedEmail);
        if (taken) {
            throw new Error(`البريد الإلكتروني ${normalizedEmail} مسجل بالفعل لمستخدم آخر.`);
        }

        if (!normalizedClerkUserId) {
            throw new Error('Clerk هو مصدر الحسابات الآن. أنشئ المستخدم أو الدعوة في Clerk أولاً ثم اربط profile عبر clerkUserId.');
        }

        let { data: profile, error: pError } = await (supabase.rpc as any)(
            'create_profile_for_clerk_user',
            {
                p_clerk_user_id: normalizedClerkUserId,
                p_email: normalizedEmail,
                p_name: name,
                p_role: role,
            },
        );

        if (pError) throw new Error(pError.message);
        const userId = profile.id as string;

        if (phone || address) {
            const { data: updatedProfile, error: profileUpdateError } = await (supabase.from('profiles') as any)
                .update({ phone, address })
                .eq('id', userId)
                .select()
                .single();
            if (profileUpdateError) throw new Error(profileUpdateError.message);
            profile = updatedProfile;
        }

        if (role === 'instructor') {
             try {
                const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000);
                await (supabase.from('instructors') as any).insert([{
                    user_id: userId,
                    name,
                    slug,
                    specialty: 'مدرب جديد',
                    bio: 'يرجى تحديث السيرة الذاتية.',
                    rate_per_session: 150,
                    schedule_status: 'approved',
                    profile_update_status: 'approved'
                }]);
             } catch (e) { console.warn('Failed to create instructor record', e); }
        } else if (role === 'publisher') {
             try {
                const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000);
                await (supabase.from('publisher_profiles') as any).insert([{
                    user_id: userId,
                    store_name: name,
                    slug,
                    description: 'يرجى تحديث وصف دار النشر.',
                }]);
             } catch (e) { console.warn('Failed to create publisher record', e); }
        }

        await reportingService.logAction('CREATE_USER', userId, `مستخدم: ${name}`, `إنشاء ملف مرتبط بـ Clerk برتبة: ${role}`);
        return profile as UserProfile;
    },

    async createAndLinkStudentAccount(payload: { name: string, email: string, password?: string, childProfileId: number }) {
        throw new Error('إنشاء حساب الطالب يتم الآن عبر Clerk فقط. أنشئ حساب الطالب من لوحة الطالب أو Clerk ثم استخدم ربط الطالب بالملف.');
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
        
        return data as ChildProfile;
    },

    async updateChildProfile(payload: Partial<ChildProfile> & { id: number }) {
        const { id, ...updates } = payload;
        if (Object.keys(updates).length === 0) {
            const { data } = await supabase.from('child_profiles').select('*').eq('id', id).maybeSingle();
            return data as ChildProfile;
        }
        const { data, error } = await (supabase.from('child_profiles') as any).update(updates).eq('id', id).select().maybeSingle();
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
        const {
            id,
            password,
            role: _role,
            account_type: _accountType,
            global_role: _globalRole,
            clerk_user_id: _clerkUserId,
            email: _email,
            ...updates
        } = payload as UpdateUserPayload & Record<string, unknown>;
        if (Object.keys(updates).length === 0) {
            const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
            return data as UserProfile;
        }
        const { data, error } = await (supabase.from('profiles') as any).update(updates).eq('id', id).select().maybeSingle();
        if (error) throw new Error(error.message);
        if (password && password.trim() !== '') {
            throw new Error('تغيير كلمة المرور يتم عبر Clerk فقط، وليس عبر Supabase Auth.');
        }
        return data as UserProfile;
    },

    async updateUserPassword(payload: { userId: string, newPassword: string }) {
        throw new Error('تغيير كلمة المرور يتم عبر Clerk فقط. استخدم صفحة استعادة كلمة المرور أو User Profile في Clerk.');
    },

    async resetStudentPassword(payload: { studentUserId: string; newPassword: string }) {
        throw new Error('إعادة تعيين كلمة مرور الطالب تتم عبر Clerk فقط. استخدم Clerk Dashboard أو دع الطالب يستخدم صفحة الاستعادة.');
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
