
import { OrderStatus, BookingStatus, UserRole } from '@alrehla/types';

export const ORDER_STATUSES: OrderStatus[] = [
    "بانتظار الدفع",
    "بانتظار المراجعة",
    "قيد التجهيز",
    "يحتاج مراجعة",
    "قيد التنفيذ",
    "تم الشحن",
    "تم التسليم",
    "مكتمل",
    "ملغي"
];

export const BOOKING_STATUSES: BookingStatus[] = [
    "بانتظار الدفع",
    "مؤكد",
    "مكتمل",
    "ملغي"
];

export const USER_ROLES: { value: UserRole; label: string }[] = [
    { value: 'user', label: 'مستخدم عادي' },
    { value: 'parent', label: 'ولي أمر' },
    { value: 'student', label: 'طالب' },
    { value: 'instructor', label: 'مدرب' },
    { value: 'publisher', label: 'دار نشر' },
    { value: 'super_admin', label: 'مدير النظام' },
    { value: 'general_supervisor', label: 'مشرف عام' },
    { value: 'enha_lak_supervisor', label: 'مشرف إنها لك' },
    { value: 'creative_writing_supervisor', label: 'مشرف بداية الرحلة' },
    { value: 'content_editor', label: 'محرر محتوى' },
    { value: 'support_agent', label: 'وكيل دعم' },
];

export const APP_CONSTANTS = {
    CURRENCY: 'ج.م',
    DEFAULT_AVATAR: 'https://i.ibb.co/2S4xT8w/male-avatar.png',
    TIMEZONE: 'Africa/Cairo',
    LOCALE: 'ar-EG'
};