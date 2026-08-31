import { supabase } from '../lib/supabaseClient';
import { storageService } from './storageService';
import { communicationService } from './communicationService';
import { reportingService } from './reportingService';
import type { 
    CreativeWritingPackage, 
    StandaloneService, 
    ComparisonItem, 
    Instructor, 
    UserRole 
} from '@alrehla/types';

export const bookingService = {
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

};
