import 'server-only';

import { z } from 'zod';

export const resourceIdSchema = z.string().trim().min(1).max(128);
export const numericIdSchema = z.coerce.number().int().positive();
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
  .transform((value) => value.slice(0, 5));

const requiredText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || undefined);
const finiteMoney = z.coerce.number().finite().min(0).max(10_000_000);
const internalLinkSchema = z
  .string()
  .trim()
  .min(1)
  .max(1000)
  .refine((value) => value.startsWith('/') && !value.startsWith('//'));

const jsonRecordSchema = z.record(z.unknown()).superRefine((value, context) => {
  try {
    if (JSON.stringify(value).length > 100_000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Payload is too large',
      });
    }
  } catch {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Payload must be serializable',
    });
  }
});

export const listOptionsSchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10_000).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    search: optionalText(120),
    statusFilter: optionalText(80),
    roleFilter: optionalText(80),
  })
  .strip();

export const createUserSchema = z
  .object({
    name: requiredText(120),
    email: emailSchema,
    role: z.enum([
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
    ]),
    phone: optionalText(32),
    address: optionalText(500),
    clerkUserId: resourceIdSchema,
  })
  .strip();

export const managedStudentAccountSchema = z
  .object({
    name: requiredText(120),
    email: emailSchema,
    password: z.string().min(12).max(128),
    childProfileId: numericIdSchema,
  })
  .strict();

export const resetStudentPasswordSchema = z
  .object({
    studentUserId: resourceIdSchema,
    newPassword: z.string().min(12).max(128),
  })
  .strict();

export const linkStudentSchema = z
  .object({
    studentUserId: resourceIdSchema,
    childProfileId: numericIdSchema,
  })
  .strict();

const childProfileFields = {
  name: requiredText(120),
  birth_date: dateSchema,
  gender: z.enum(['ذكر', 'أنثى']),
  avatar_url: z.string().trim().max(5000).nullable().optional(),
  interests: z.array(requiredText(80)).max(30).nullable().optional(),
  strengths: z.array(requiredText(80)).max(30).nullable().optional(),
};

export const createChildProfileSchema = z
  .object({
    ...childProfileFields,
  })
  .strip();

export const updateChildProfileSchema = z
  .object({
    id: numericIdSchema,
    name: requiredText(120).optional(),
    birth_date: dateSchema.optional(),
    gender: z.enum(['ذكر', 'أنثى']).optional(),
    avatar_url: z.string().trim().max(5000).nullable().optional(),
    interests: z.array(requiredText(80)).max(30).nullable().optional(),
    strengths: z.array(requiredText(80)).max(30).nullable().optional(),
  })
  .strip();

export const updateCurrentUserSchema = z
  .object({
    id: resourceIdSchema.optional(),
    name: requiredText(120).optional(),
    phone: z.string().trim().max(32).optional(),
    address: z.string().trim().max(500).optional(),
    governorate: z.string().trim().max(120).optional(),
    city: z.string().trim().max(120).optional(),
    country: z.string().trim().max(120).optional(),
    timezone: z.string().trim().max(80).optional(),
    currency: z.string().trim().regex(/^[A-Z]{3}$/).optional(),
  })
  .strict()
  .refine(
    (value) =>
      Object.keys(value).some((key) => key !== 'id' && value[key as keyof typeof value] !== undefined),
    'At least one field is required',
  );

export const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(12).max(128),
  })
  .strict();

export const idListSchema = z.array(resourceIdSchema).min(1).max(100);

export const publisherProfileSchema = z
  .object({
    user_id: resourceIdSchema.optional(),
    store_name: requiredText(160),
    slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    logo_url: z.string().trim().url().max(2048).nullable().optional(),
    cover_url: z.string().trim().url().max(2048).nullable().optional(),
    description: requiredText(5000),
    website: z.string().trim().url().max(2048).optional().or(z.literal('')),
    social_links: z
      .object({
        facebook: z.string().trim().url().max(2048).optional().or(z.literal('')),
        instagram: z.string().trim().url().max(2048).optional().or(z.literal('')),
        twitter: z.string().trim().url().max(2048).optional().or(z.literal('')),
      })
      .strip()
      .optional(),
  })
  .strip();

export const createOrderSchema = z
  .object({
    userId: resourceIdSchema.optional(),
    childId: numericIdSchema.nullable(),
    summary: requiredText(300),
    total: finiteMoney,
    shippingCost: finiteMoney,
    productKey: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/),
    details: jsonRecordSchema,
    receiptUrl: z.string().trim().url().max(5000).optional().or(z.literal('')),
  })
  .strip();

export const createSubscriptionSchema = z
  .object({
    userId: resourceIdSchema.optional(),
    childId: numericIdSchema,
    planName: requiredText(160),
    durationMonths: z.coerce.number().int().min(1).max(120).optional(),
  })
  .strip();

export const orderStatusSchema = z.enum([
  'بانتظار الدفع',
  'بانتظار المراجعة',
  'قيد التجهيز',
  'يحتاج مراجعة',
  'قيد التنفيذ',
  'تم الشحن',
  'تم التسليم',
  'مكتمل',
  'ملغي',
]);

export const subscriptionActionSchema = z.enum(['pause', 'reactivate', 'cancel']);
export const receiptTypeSchema = z.enum(['order', 'booking', 'subscription']);

export const receiptFileSchema = z
  .custom<File>(
    (value) =>
      Boolean(
        value &&
          typeof value === 'object' &&
          'arrayBuffer' in value &&
          typeof (value as File).arrayBuffer === 'function',
      ),
  )
  .refine((file) => file.size > 0 && file.size <= 10 * 1024 * 1024)
  .refine((file) => ['image/png', 'image/jpeg', 'application/pdf'].includes(file.type))
  .refine((file) => file.name.length <= 255);

export const checkoutUploadPurposeSchema = z.enum([
  'payment_receipt',
  'service_attachment',
  'custom_image',
]);

export const checkoutFileSchema = z
  .custom<File>(
    (value) =>
      Boolean(
        value &&
          typeof value === 'object' &&
          'arrayBuffer' in value &&
          typeof (value as File).arrayBuffer === 'function',
      ),
  )
  .refine((file) => file.size > 0 && file.size <= 10 * 1024 * 1024)
  .refine((file) => ['image/png', 'image/jpeg', 'application/pdf'].includes(file.type))
  .refine((file) => file.name.length <= 255);

export const checkoutUploadPathListSchema = z
  .array(z.string().trim().min(1).max(1000))
  .min(1)
  .max(50);

export const subscriptionPlanSchema = z
  .object({
    id: numericIdSchema.optional(),
    name: requiredText(160),
    duration_months: z.coerce.number().int().min(1).max(120),
    price: finiteMoney,
    price_per_month: finiteMoney,
    savings_text: optionalText(300),
    is_best_value: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .strip();

export const personalizedProductSchema = z
  .object({
    id: numericIdSchema.optional(),
    key: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/),
    title: requiredText(200),
    product_type: z.enum(['hero_story', 'library_book', 'subscription_box', 'addon']),
    description: requiredText(5000),
    image_url: z.string().trim().url().max(2048).nullable().optional(),
    features: z.array(requiredText(300)).max(50).optional(),
    sort_order: z.coerce.number().int().min(0).max(100_000),
    is_featured: z.boolean(),
    is_addon: z.boolean(),
    is_active: z.boolean().optional(),
    has_printed_version: z.boolean(),
    price_printed: finiteMoney.nullable().optional(),
    price_electronic: finiteMoney.nullable().optional(),
    image_slots: z
      .array(
        z
          .object({
            id: requiredText(80),
            label: requiredText(160),
            required: z.boolean(),
          })
          .strip(),
      )
      .max(30)
      .optional(),
    text_fields: z
      .array(
        z
          .object({
            id: requiredText(80),
            label: requiredText(160),
            placeholder: optionalText(300),
            required: z.boolean(),
            type: z.enum(['input', 'textarea']),
          })
          .strip(),
      )
      .max(30)
      .optional(),
    goal_config: z.enum(['none', 'predefined', 'custom', 'predefined_and_custom']),
    story_goals: z
      .array(
        z
          .object({
            key: requiredText(80),
            title: requiredText(200),
          })
          .strip(),
      )
      .max(50)
      .optional(),
    component_keys: z.array(requiredText(120)).max(50).optional(),
  })
  .strip();

export const createBookingSchema = z
  .object({
    userId: resourceIdSchema.optional(),
    payload: z
      .object({
        child: z.object({ id: numericIdSchema }).strip(),
        instructor: z.object({ id: numericIdSchema }).strip(),
        package: z.object({ name: requiredText(160) }).strip(),
        dateTime: z
          .object({
            date: dateSchema,
            time: timeSchema,
          })
          .strip(),
      })
      .strip(),
    receiptUrl: z.string().trim().url().max(5000).optional().or(z.literal('')),
  })
  .strip();

export const bookingStatusSchema = z.enum([
  'بانتظار الدفع',
  'مؤكد',
  'مكتمل',
  'ملغي',
  'بانتظار المراجعة',
]);

export const bookingTextSchema = requiredText(20_000);

export const creativeWritingPackageSchema = z
  .object({
    id: numericIdSchema.optional(),
    name: requiredText(160),
    sessions: requiredText(80),
    price: finiteMoney,
    description: requiredText(3000),
    detailed_description: optionalText(10_000),
    features: z.array(requiredText(300)).max(50),
    target_age: optionalText(80),
    level: optionalText(80),
    icon_name: optionalText(80),
    popular: z.boolean().optional(),
    comparison_values: z.record(z.union([z.boolean(), z.string().max(300)])).optional(),
    is_active: z.boolean().optional(),
  })
  .strip();

export const comparisonItemSchema = z
  .object({
    id: resourceIdSchema.optional(),
    label: requiredText(200),
    type: z.enum(['text', 'boolean']),
    sort_order: z.coerce.number().int().min(0).max(100_000),
  })
  .strip();

export const standaloneServiceSchema = z
  .object({
    id: numericIdSchema.optional(),
    name: requiredText(160),
    price: finiteMoney,
    description: requiredText(5000),
    category: requiredText(120),
    icon_name: requiredText(80),
    requires_file_upload: z.boolean(),
    provider_type: z.enum(['company', 'instructor']),
    is_active: z.boolean().optional(),
  })
  .strip();

export const rescheduleRequestSchema = z
  .object({
    sessionId: resourceIdSchema,
    oldDate: dateSchema,
    newDate: dateSchema,
    newTime: timeSchema,
    reason: requiredText(2000),
    instructorName: requiredText(160),
  })
  .strip();

export const scheduledSessionUpdateSchema = z
  .object({
    status: z.enum(['upcoming', 'completed', 'missed']).optional(),
    notes: z.string().trim().max(5000).optional(),
    session_date: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .refine((updates) => Object.values(updates).some((value) => value !== undefined));

export const sessionMessageSchema = z
  .object({
    bookingId: resourceIdSchema,
    senderId: resourceIdSchema.optional(),
    role: z.string().max(80).optional(),
    message: requiredText(4000),
  })
  .strip();

export const sessionAttachmentSchema = z
  .object({
    bookingId: resourceIdSchema,
    uploaderId: resourceIdSchema.optional(),
    role: z.string().max(80).optional(),
    file: receiptFileSchema,
  })
  .strip();

export const notificationSchema = z
  .object({
    userId: resourceIdSchema,
    message: requiredText(1000),
    link: internalLinkSchema,
    type: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  })
  .strict();

export const supportTicketSchema = z
  .object({
    name: requiredText(120),
    email: emailSchema,
    subject: requiredText(200),
    message: requiredText(5000),
  })
  .strict();

export const joinRequestSchema = z
  .object({
    name: requiredText(120),
    email: emailSchema,
    phone: z.string().trim().min(6).max(32).regex(/^[+\d()\s-]+$/),
    role: requiredText(80),
    message: requiredText(5000),
    portfolio_url: z
      .union([z.string().trim().url().max(2048), z.literal('')])
      .optional()
      .transform((value) => value || undefined),
  })
  .strict();

export const ticketStatusSchema = z.enum(['جديدة', 'تمت المراجعة', 'مغلقة']);
export const joinRequestStatusSchema = z.enum(['جديد', 'تمت المراجعة', 'مقبول', 'مرفوض']);

const httpsUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => value.startsWith('https://'));

const contentImageFileSchema = z
  .custom<File>(
    (value) =>
      Boolean(
        value &&
          typeof value === 'object' &&
          'arrayBuffer' in value &&
          typeof (value as File).arrayBuffer === 'function',
      ),
  )
  .refine((file) => file.size > 0 && file.size <= 10 * 1024 * 1024)
  .refine((file) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
  )
  .refine((file) => file.name.length <= 255);

const boundedJsonObjectSchema = z.record(z.unknown()).superRefine((value, context) => {
  try {
    if (Object.keys(value).length > 250 || JSON.stringify(value).length > 250_000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Content payload is too large',
      });
    }
  } catch {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Content payload must be serializable',
    });
  }
});

export const siteContentSchema = z
  .object({
    portalPage: boundedJsonObjectSchema,
    aboutPage: boundedJsonObjectSchema,
    enhaLakPage: boundedJsonObjectSchema,
    creativeWritingPage: boundedJsonObjectSchema,
    supportPage: boundedJsonObjectSchema,
    privacyPage: z
      .object({
        title: requiredText(300),
        content: requiredText(100_000),
      })
      .strict(),
    termsPage: z
      .object({
        title: requiredText(300),
        content: requiredText(100_000),
      })
      .strict(),
    footer: boundedJsonObjectSchema,
  })
  .strict();

export const blogPostSchema = z
  .object({
    id: numericIdSchema.optional(),
    title: requiredText(300),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    content: requiredText(200_000),
    image_url: z.string().trim().max(5000).nullable().optional(),
    imageFile: contentImageFileSchema.optional(),
    author_name: requiredText(160),
    status: z.enum(['published', 'draft']),
    published_at: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strip();

export const contentUploadFileSchema = contentImageFileSchema;

export const numericIdListSchema = z
  .array(numericIdSchema)
  .min(1)
  .max(100)
  .transform((ids) => Array.from(new Set(ids)));

export const createPayoutSchema = z
  .object({
    instructorId: numericIdSchema,
    amount: z.coerce.number().finite().positive().max(10_000_000),
    details: requiredText(2000),
  })
  .strict();

export const awardBadgeSchema = z
  .object({
    childId: numericIdSchema,
    badgeId: numericIdSchema,
    instructorId: numericIdSchema.optional(),
  })
  .strip();

export const auditLogInputSchema = z
  .object({
    action: z.string().trim().min(1).max(100).regex(/^[A-Z0-9_:-]+$/),
    targetId: resourceIdSchema,
    targetDesc: requiredText(300),
    details: requiredText(2000),
  })
  .strict();

export const reportFiltersSchema = z
  .object({
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    actionType: optionalText(100),
    userId: z.union([resourceIdSchema, z.literal('all')]).optional(),
    status: optionalText(100),
  })
  .strip();

export const reportTypeSchema = z.enum(['orders', 'users', 'instructors']);

const cloudinaryReferenceSchema = z
  .object({
    url: httpsUrlSchema,
    public_id: z.string().trim().min(1).max(500),
    width: z.number().int().positive().max(20_000).optional(),
    height: z.number().int().positive().max(20_000).optional(),
    format: z.string().trim().min(1).max(20).optional(),
  })
  .strip();

const brandingImageSchema = z
  .union([httpsUrlSchema, cloudinaryReferenceSchema])
  .nullable()
  .optional();

export const brandingSchema = z
  .object({
    logoUrl: brandingImageSchema,
    heroImageUrl: brandingImageSchema,
    aboutHeroImageUrl: brandingImageSchema,
    aboutPortalImageUrl: brandingImageSchema,
    joinUsImageUrl: brandingImageSchema,
    creativeWritingPortalImageUrl: brandingImageSchema,
    enhaLakPortalImageUrl: brandingImageSchema,
    aboutImageUrl: brandingImageSchema,
  })
  .strict();

const priceRecordSchema = z
  .record(
    z.string().trim().min(1).max(120).regex(/^[\p{L}\p{N}_ -]+$/u),
    z.coerce.number().finite().min(0).max(10_000_000),
  )
  .refine((value) => Object.keys(value).length <= 250);

export const pricesSchema = priceRecordSchema;
export const shippingCostsSchema = z
  .record(
    z.string().trim().min(1).max(120),
    priceRecordSchema,
  )
  .refine((value) => Object.keys(value).length <= 100);

export const socialLinksSchema = z
  .object({
    id: numericIdSchema,
    facebook_url: httpsUrlSchema,
    twitter_url: httpsUrlSchema,
    instagram_url: httpsUrlSchema,
  })
  .strict();

export const communicationSettingsSchema = z
  .object({
    support_email: emailSchema,
    join_us_email: emailSchema,
    whatsapp_number: z.string().trim().min(6).max(32).regex(/^[+\d()\s-]+$/),
    whatsapp_default_message: requiredText(1000),
    instapay_url: httpsUrlSchema,
    instapay_qr_url: httpsUrlSchema,
    instapay_number: z.string().trim().min(6).max(64),
  })
  .strict();

export const pricingSettingsSchema = z
  .object({
    id: numericIdSchema,
    company_percentage: z.coerce.number().finite().min(0).max(10),
    fixed_fee: z.coerce.number().finite().min(0).max(1_000_000),
  })
  .strict();

export const jitsiSettingsSchema = z
  .object({
    id: numericIdSchema,
    domain: z
      .string()
      .trim()
      .min(1)
      .max(253)
      .regex(/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i),
    room_prefix: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/),
    join_minutes_before: z.coerce.number().int().min(0).max(1440),
    expire_minutes_after: z.coerce.number().int().min(1).max(10_080),
    start_with_audio_muted: z.boolean(),
    start_with_video_muted: z.boolean(),
  })
  .strict();

const permissionSchema = z
  .object({
    canViewDashboard: z.boolean(),
    canViewGlobalStats: z.boolean(),
    canViewContentStats: z.boolean(),
    canManageEnhaLakOrders: z.boolean(),
    canManageCreativeWritingBookings: z.boolean(),
    canManageEnhaLakProducts: z.boolean(),
    canManageCreativeWritingSettings: z.boolean(),
    canManageUsers: z.boolean(),
    canManageInstructors: z.boolean(),
    canManageInstructorUpdates: z.boolean(),
    canManageBlog: z.boolean(),
    canManageSiteContent: z.boolean(),
    canManageSupportTickets: z.boolean(),
    canManageJoinRequests: z.boolean(),
    canManageSettings: z.boolean(),
    canManageFinancials: z.boolean(),
    canViewAuditLog: z.boolean(),
    isInstructor: z.boolean(),
    canManageOwnSchedule: z.boolean(),
    canManageOwnProfile: z.boolean(),
    canViewOwnFinancials: z.boolean(),
    isPublisher: z.boolean(),
    canManageOwnProducts: z.boolean(),
  })
  .strict();

export const rolePermissionsSchema = z
  .record(
    z.enum([
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
    ]),
    permissionSchema,
  )
  .refine((value) => Object.keys(value).length <= 11);

export const systemConfigSchema = z
  .object({
    supabase: z
      .object({
        projectName: requiredText(120),
        projectId: z.string().trim().min(1).max(120).regex(/^[a-z0-9_-]+$/i),
        projectUrl: z.string().trim().url().max(2048).or(z.literal('')),
        anonKey: z.string().trim().max(4096).optional(),
      })
      .strict(),
    cloudinary: z
      .object({
        cloudName: z.string().trim().max(120),
        apiKey: z.string().trim().max(200),
        uploadPreset: z.string().trim().max(120),
      })
      .strict(),
    storage: z
      .object({
        bucketName: z.string().trim().min(1).max(120).regex(/^[a-z0-9_-]+$/i),
        allowedMimeTypes: z
          .array(z.enum(['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']))
          .min(1)
          .max(4),
      })
      .strict(),
    vercel: z
      .object({
        environment: z.enum(['development', 'preview', 'production']),
      })
      .strict(),
  })
  .strict();

export const maintenanceSettingsSchema = z
  .object({
    isActive: z.boolean(),
    message: requiredText(1000),
  })
  .strict();
