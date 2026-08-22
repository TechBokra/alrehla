import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from './storageService';
import { communicationService } from './communicationService';
import { reportingService } from './reportingService';
import type { 
    CreativeWritingBooking, 
    CreativeWritingPackage, 
    StandaloneService, 
    ComparisonItem, 
    Instructor, 
    ScheduledSession, 
    BookingStatus, 
    UserRole 
} from '@alrehla/types';

export const bookingService = {
    async getAllBookings(options: { page?: number; pageSize?: number; search?: string; statusFilter?: string } = {}) {
        const { page = 1, pageSize = 10, search, statusFilter } = options;
        let query = supabase
            .from('bookings')
            .select('*, child_profiles:child_profiles!fk_bookings_child(name), instructors:instructors!fk_bookings_instructor(name, user_id), users:profiles!fk_bookings_user(email, name)', { count: 'exact' });

        if (statusFilter && statusFilter !== 'all') {
            if (statusFilter === 'active') {
                query = query.neq('status', 'ملغي').neq('status', 'مكتمل');
            } else if (statusFilter === 'archived') {
                query = query.or('status.eq.ملغي,status.eq.مكتمل');
            } else {
                query = query.eq('status', statusFilter);
            }
        }

        if (search) {
            query = query.or(`id.ilike.%${search}%,package_name.ilike.%${search}%`);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, count, error } = await query;
        if (error) {
            console.error("Error fetching bookings:", error);
            return { bookings: [], count: 0 };
        }
        return { bookings: (data || []) as CreativeWritingBooking[], count: count || 0 };
    },

    async createBooking(payload: any) {
        const { data, error } = await (supabase.rpc as any)('create_booking_secure', {
            p_user_id: payload.userId,
            p_child_id: payload.payload.child.id,
            p_instructor_id: payload.payload.instructor.id,
            p_package_name: payload.payload.package.name,
            p_booking_date: payload.payload.dateTime.date,
            p_booking_time: payload.payload.dateTime.time,
            p_receipt_url: payload.receiptUrl || null,
            p_expected_total: payload.payload.total,
        });

        if (error) throw new Error(error.message);
        return data;
    },

    async getBookingQuote(packageName: string, instructorId: number) {
        const { data, error } = await (supabase.rpc as any)('calculate_booking_price', {
            p_package_name: packageName,
            p_instructor_id: instructorId,
        });
        if (error) throw new Error(error.message);
        return Number(data);
    },

    async getBookingAvailability() {
        const { data, error } = await (supabase.rpc as any)('get_booking_availability_secure');
        if (error) {
            console.error("Error fetching availability:", error);
            return { bookings: [] };
        }
        return { bookings: data || [] };
    },

    async confirmBooking(bookingId: string) {
        const { data, error } = await (supabase.rpc as any)('confirm_booking_secure', {
            p_booking_id: bookingId,
        });
        if (error) throw new Error(error.message);
        return data;
    },

    async updateBookingStatus(bookingId: string, newStatus: BookingStatus) {
        if (newStatus === 'مؤكد') {
            return this.confirmBooking(bookingId);
        }

        const { data, error } = await (supabase.rpc as any)('update_booking_status_secure', {
            p_booking_id: bookingId,
            p_new_status: newStatus,
        });
        if (error) throw new Error(error.message);
        return data;
    },

    async updateBookingProgressNotes(bookingId: string, notes: string) {
        const { error } = await (supabase.from('bookings') as any)
            .update({ progress_notes: notes })
            .eq('id', bookingId);
        if (error) throw new Error(error.message);
        return { success: true };
    },

    async saveBookingDraft(bookingId: string, draft: string) {
        // Assuming 'details' jsonb column stores drafts or similar structure
        const { data: currentData } = await supabase.from('bookings').select('details').eq('id', bookingId).single();
        const currentDetails = (currentData as any)?.details || {};
        
        const { error } = await (supabase.from('bookings') as any)
            .update({ details: { ...currentDetails, draft } })
            .eq('id', bookingId);

        if (error) throw new Error(error.message);
        return { success: true };
    },

    async getAllInstructors() {
        const { data, error } = await supabase.from('instructors').select('*').is('deleted_at', null);
        if (error) return [];
        return data as Instructor[];
    },

    async getInstructorByUserId(userId: string) {
        const { data } = await supabase.from('instructors').select('*').eq('user_id', userId).maybeSingle();
        return data as Instructor | null;
    },

    async getInstructorBookings(instructorId: number) {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, child_profiles:child_profiles!fk_bookings_child(id, name, avatar_url)')
            .eq('instructor_id', instructorId)
            .order('booking_date', { ascending: false });
        
        if (error) return [];
        return data as CreativeWritingBooking[];
    },

    async getAllPackages() {
        const { data } = await supabase.from('creative_writing_packages').select('*').order('price');
        return (data || []) as CreativeWritingPackage[];
    },

    async getAllStandaloneServices() {
        const { data } = await supabase.from('standalone_services').select('*');
        return (data || []) as StandaloneService[];
    },

    async getAllComparisonItems() {
        const { data } = await supabase.from('comparison_items').select('*').order('sort_order');
        return (data || []) as ComparisonItem[];
    },

    async getAllScheduledSessions() {
        const { data } = await supabase.from('scheduled_sessions').select('*');
        return (data || []) as ScheduledSession[];
    },
    
    async updateScheduledSession(sessionId: string, updates: any) {
        const { error } = await (supabase.from('scheduled_sessions') as any)
            .update(updates)
            .eq('id', sessionId);
        if (error) throw new Error(error.message);
        return { success: true };
    },

    async getAllAttachments() {
        const { data } = await supabase.from('session_attachments').select('*');
        return data || [];
    },

    // --- Messaging & Attachments ---
    async sendSessionMessage(payload: { bookingId: string, senderId: string, role: UserRole, message: string }) {
        const { error } = await (supabase.from('session_messages') as any).insert([{
            booking_id: payload.bookingId,
            sender_id: payload.senderId,
            sender_role: payload.role,
            message_text: payload.message,
            created_at: new Date().toISOString()
        }]);
        if (error) throw new Error(error.message);
        return { success: true };
    },

    async uploadSessionAttachment(payload: { bookingId: string, uploaderId: string, role: UserRole, file: File }) {
        const url = await storageService.uploadFile(payload.file, 'receipts', `attachments/${payload.bookingId}`);
        const { error } = await (supabase.from('session_attachments') as any).insert([{
            booking_id: payload.bookingId,
            uploader_id: payload.uploaderId,
            uploader_role: payload.role,
            file_name: payload.file.name,
            file_url: url,
            created_at: new Date().toISOString()
        }]);
        if (error) throw new Error(error.message);
        return { success: true };
    },

    // --- Settings Mutations (Packages, Services, Comparison Items) ---
    async createPackage(payload: any) {
        const { id, ...data } = payload; // remove id if new (undefined)
        const { error } = await (supabase.from('creative_writing_packages') as any).insert([data]);
        if (error) throw new Error(error.message);
    },
    async updatePackage(payload: any) {
        const { id, ...data } = payload;
        const { error } = await (supabase.from('creative_writing_packages') as any).update(data).eq('id', id);
        if (error) throw new Error(error.message);
    },
    async deletePackage(id: number) {
        const { error } = await supabase.from('creative_writing_packages').delete().eq('id', id);
        if (error) throw new Error(error.message);
    },

    async createStandaloneService(payload: any) {
        const { id, ...data } = payload;
        const { error } = await (supabase.from('standalone_services') as any).insert([data]);
        if (error) throw new Error(error.message);
    },
    async updateStandaloneService(payload: any) {
        const { id, ...data } = payload;
        const { error } = await (supabase.from('standalone_services') as any).update(data).eq('id', id);
        if (error) throw new Error(error.message);
    },
    async deleteStandaloneService(id: number) {
        const { error } = await supabase.from('standalone_services').delete().eq('id', id);
        if (error) throw new Error(error.message);
    },

    async createComparisonItem(payload: any) {
         const { error } = await (supabase.from('comparison_items') as any).insert([payload]);
         if (error) throw new Error(error.message);
    },
    async updateComparisonItem(payload: any) {
         const { id, ...data } = payload;
         const { error } = await (supabase.from('comparison_items') as any).update(data).eq('id', id);
         if (error) throw new Error(error.message);
    },
    async deleteComparisonItem(id: string) {
         const { error } = await supabase.from('comparison_items').delete().eq('id', id);
         if (error) throw new Error(error.message);
    },

    // --- Reschedule Request ---
    async submitRescheduleRequest(payload: { sessionId: string; oldDate: string; newDate: string; newTime: string; reason: string; instructorName: string }) {
        const { sessionId, newDate, newTime, reason, instructorName } = payload;
        
        // 1. Fetch session details to get relations
        const { data: sessionData, error: sessionError } = await supabase
            .from('scheduled_sessions')
            .select('child_id, instructor_id')
            .eq('id', sessionId)
            .single();

        if (sessionError || !sessionData) throw new Error("الجلسة غير موجودة.");

        // 2. Format a structured string for the 'reason' field to be parsed by Admin UI
        // Format: RESCHEDULE|SID:{sessionId}|NEW:{newDate}T{newTime}|REASON:{reason}
        const structuredReason = `RESCHEDULE|SID:${sessionId}|NEW:${newDate}T${newTime}|REASON:${reason}`;

        // 3. Insert into support_session_requests table
        const { error } = await (supabase.from('support_session_requests') as any).insert([{
            instructor_id: (sessionData as any).instructor_id,
            child_id: (sessionData as any).child_id,
            reason: structuredReason,
            status: 'pending',
            requested_at: new Date().toISOString()
        }]);

        if (error) throw error;
                        
        // Notify Admins
        await communicationService.notifyAdmins(
            `طلب المدرب ${instructorName} تغيير موعد جلسة إلى ${newDate} ${newTime}`,
            `/admin/scheduled-sessions?tab=support`, 
            'schedule_change'
        );

        return { success: true };
    },

    async checkSlotAvailability(instructorId: number, date: string, time: string) {
        const dateStr = date.split('T')[0];

        const { data, error } = await (supabase.rpc as any)('is_booking_slot_available_secure', {
            p_instructor_id: instructorId,
            p_booking_date: dateStr,
            p_booking_time: time,
        });
        if (error) throw new Error(error.message);
        return data === true;
    },

    async authorizeSessionJoin(sessionId: string) {
        const { data, error } = await (supabase.rpc as any)('authorize_session_join_secure', {
            p_session_id: sessionId,
        });
        if (error) throw new Error(error.message);
        return data as {
            allowed: boolean;
            reason: 'allowed' | 'too_early' | 'expired' | 'booking_inactive' | 'session_closed';
            session_id: string;
            session_date: string;
            join_allowed_at: string;
            join_expires_at: string;
            domain: string | null;
            room_name: string | null;
        };
    }
};
