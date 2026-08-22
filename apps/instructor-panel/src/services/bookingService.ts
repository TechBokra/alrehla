import { bookingService as sharedBookingService } from '@alrehla/api/services/bookingService';
import { supabase } from '../lib/supabaseClient';
import type {
    CreativeWritingBooking,
    CreativeWritingPackage,
    Instructor,
} from '../lib/database.types';

const instructorQueryError = (message: string) => {
    console.error(message);
    return new Error(message);
};

export const bookingService = {
    ...sharedBookingService,

    async getInstructorByUserId(userId: string) {
        const { data, error } = await supabase
            .from('instructors')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            throw instructorQueryError('تعذر تحميل ملف المدرب.');
        }

        return data as Instructor | null;
    },

    async getInstructorBookings(instructorId: number) {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, child_profiles:child_profiles!fk_bookings_child(id, name, avatar_url)')
            .eq('instructor_id', instructorId)
            .order('booking_date', { ascending: false });

        if (error) {
            throw instructorQueryError('تعذر تحميل حجوزات المدرب.');
        }

        return (data || []) as CreativeWritingBooking[];
    },

    async getAllPackages() {
        const { data, error } = await supabase
            .from('creative_writing_packages')
            .select('*')
            .order('price');

        if (error) {
            throw instructorQueryError('تعذر تحميل الباقات.');
        }

        return (data || []) as CreativeWritingPackage[];
    },
};
