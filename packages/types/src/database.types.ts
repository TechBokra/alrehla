
export type UserRole = 'user' | 'parent' | 'student' | 'instructor' | 'super_admin' | 'general_supervisor' | 'enha_lak_supervisor' | 'creative_writing_supervisor' | 'content_editor' | 'support_agent' | 'publisher';

export const USER_ROLES = [
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
] as const;

export const ACCOUNT_TYPES = ['parent', 'student'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const GLOBAL_ROLES = ['super_admin', 'support_admin'] as const;
export type GlobalRole = (typeof GLOBAL_ROLES)[number];

export const ORGANIZATION_ROLES = [
    'org:general_supervisor',
    'org:instructor',
    'org:publisher',
] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export interface UserProfile {
    id: string;
    clerk_user_id?: string | null;
    email: string;
    email_verified?: boolean | null;
    name: string;
    role: UserRole;
    avatar_url?: string | null;
    account_type?: AccountType;
    global_role?: GlobalRole | null;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    governorate?: string;
    timezone?: string;
    currency?: string;
    created_at: string;
}

/** Safe read model exposed by the public_profiles view. */
export interface PublicProfile {
    id: string;
    name: string;
}

export interface ChildProfile {
    id: number;
    user_id: string; // Parent ID
    student_user_id?: string | null; // Linked student account ID
    student_email?: string; // Virtual field for display
    name: string;
    birth_date: string;
    gender: 'ذكر' | 'أنثى';
    avatar_url: string | null;
    interests?: string[];
    strengths?: string[];
    age?: number; // Virtual/Calculated
    parentName?: string; // Virtual field for parent name
}

export interface ParentStudentLink {
    id: string;
    parent_profile_id: string;
    student_profile_id: string;
    relationship: string;
    can_view_progress: boolean;
    can_manage_enrollment: boolean;
    status: 'active' | 'disabled' | 'pending';
    created_at: string;
    updated_at: string;
}

export interface Instructor {
    id: number;
    user_id: string;
    name: string;
    slug: string;
    specialty: string;
    bio: string;
    avatar_url: string | null;
    intro_video_url?: string;
    teaching_philosophy?: string;
    expertise_areas?: string[];
    published_works?: PublishedWork[];
    rate_per_session?: number; // Base rate
    package_rates?: Record<string, number>; // Package ID -> Rate
    service_rates?: Record<string, number>; // Service ID -> Rate
    weekly_schedule?: WeeklySchedule;
    intro_availability?: AvailableSlots;
    availability?: AvailableSlots;
    schedule_status?: 'pending' | 'approved' | 'rejected';
    profile_update_status?: 'pending' | 'approved' | 'rejected';
    pending_profile_data?: any;
    deleted_at?: string | null;
}

// New Interface for Publisher Public Profile
export interface PublisherProfile {
    id: number;
    user_id: string;
    store_name: string;
    slug: string;
    logo_url: string | null;
    cover_url?: string | null;
    description: string;
    website?: string;
    social_links?: { facebook?: string; instagram?: string; twitter?: string };
    created_at?: string;
}

export interface PublishedWork {
    title: string;
    cover_url: string;
}

export interface WeeklySchedule {
    [day: string]: string[]; // 'monday': ['10:00', '11:00']
}

export interface AvailableSlots {
    [date: string]: string[]; // '2023-10-25': ['10:00']
}

export type ProductType = 'hero_story' | 'library_book' | 'subscription_box' | 'addon';

export interface PersonalizedProduct {
    id: number;
    key: string;
    title: string;
    product_type: ProductType; 
    description: string;
    image_url: string | null;
    features?: string[];
    sort_order: number;
    is_featured: boolean;
    is_addon: boolean;
    is_active?: boolean; 
    has_printed_version: boolean;
    price_printed: number | null;
    price_electronic: number | null;
    image_slots?: ImageSlotConfig[];
    text_fields?: TextFieldConfig[];
    goal_config: GoalConfig;
    story_goals?: StoryGoal[];
    component_keys?: string[];
    publisher_id?: string | null; 
    approval_status?: 'pending' | 'approved' | 'rejected'; // New Field
    deleted_at?: string | null;
    publisher?: { name: string }; // Virtual for join
}

export type GoalConfig = 'none' | 'predefined' | 'custom' | 'predefined_and_custom';

export interface ImageSlotConfig {
    id: string;
    label: string;
    required: boolean;
}

export interface TextFieldConfig {
    id: string;
    label: string;
    placeholder?: string;
    required: boolean;
    type: 'input' | 'textarea';
}

export interface StoryGoal {
    key: string;
    title: string;
}

export interface CreativeWritingPackage {
    id: number;
    name: string;
    sessions: string; // "4 sessions" or "4"
    price: number;
    description: string;
    detailed_description?: string;
    features: string[];
    target_age?: string;
    level?: string;
    icon_name?: string;
    popular?: boolean;
    comparison_values?: Record<string, boolean | string>;
}

export interface ComparisonItem {
    id: string;
    label: string;
    type: 'text' | 'boolean';
    sort_order: number;
}

export interface StandaloneService {
    id: number;
    name: string;
    price: number;
    description: string;
    category: string;
    icon_name: string;
    requires_file_upload: boolean;
    provider_type: 'company' | 'instructor';
}

export interface SubscriptionPlan {
    id: number;
    name: string;
    duration_months: number;
    price: number;
    price_per_month: number;
    savings_text?: string;
    is_best_value?: boolean;
    is_active?: boolean;
    deleted_at?: string | null;
}

export type OrderStatus = "بانتظار الدفع" | "بانتظار المراجعة" | "قيد التجهيز" | "يحتاج مراجعة" | "قيد التنفيذ" | "تم الشحن" | "تم التسليم" | "مكتمل" | "ملغي";

export interface Order {
    id: string;
    user_id: string;
    child_id: number;
    item_summary: string;
    total: number;
    shipping_cost: number;
    status: OrderStatus;
    details: any;
    admin_comment: string | null;
    receipt_url: string | null;
    order_date: string;
    created_at?: string;
    // New fields usually joined
    productKey?: string;
}

export interface OrderWithRelations extends Order {
    users: { name: string; email: string } | null;
    child_profiles: { name: string } | null;
}

export type BookingStatus = "بانتظار الدفع" | "مؤكد" | "مكتمل" | "ملغي" | "بانتظار المراجعة";

/** Values persisted by the current Booking database/RPC contract. */
export type DatabaseBookingStatus = BookingStatus;

export interface BookingAvailability {
    instructor_id: number;
    booking_date: string;
    booking_time: string;
    status: 'reserved' | string;
}

export interface BookingCreationResult {
    id: string;
    user_id: string;
    child_id: number;
    instructor_id: number;
    package_name: string;
    booking_date: string;
    booking_time: string;
    total: number;
    status: DatabaseBookingStatus;
    receipt_url: string | null;
    created_at: string;
}

export interface BookingConfirmationResult {
    id: string;
    status: DatabaseBookingStatus;
    session_count: number;
    idempotent: boolean;
}

export interface BookingStatusUpdateResult {
    id: string;
    status: DatabaseBookingStatus;
    released_future_sessions: number;
}

export interface SessionJoinAuthorizationResult {
    allowed: boolean;
    reason: 'allowed' | 'too_early' | 'expired' | 'booking_inactive' | 'session_closed';
    session_id: string;
    session_date: string;
    join_allowed_at: string;
    join_expires_at: string;
    domain: string | null;
    room_name: string | null;
}

export interface CreativeWritingBooking {
    id: string;
    user_id: string;
    child_id: number;
    instructor_id: number;
    package_name: string;
    booking_date: string; // ISO date
    booking_time: string; // HH:mm
    total: number;
    status: BookingStatus;
    receipt_url: string | null;
    progress_notes?: string;
    details?: any; // drafts etc
    created_at?: string;
    
    // Relations often used
    child_profiles?: { name: string; avatar_url?: string | null } | null;
    instructors?: { name: string; user_id?: string } | null;
    users?: { name: string; email: string } | null;
}

export type SessionStatus = 'upcoming' | 'completed' | 'missed';

export interface ScheduledSession {
    id: string;
    booking_id?: string | null;
    subscription_id?: string | null;
    child_id: number;
    instructor_id: number;
    session_date: string; // ISO
    status: SessionStatus;
    notes?: string; // Report notes
    
    // Virtuals from joins
    child_name?: string;
    instructor_name?: string;
    child_profiles?: { name: string } | null;
    instructors?: { name: string } | null;
    package_name?: string;
    type?: string;
    booking_status?: string;
}

export interface Subscription {
    id: string;
    user_id: string;
    child_id: number;
    plan_name: string;
    start_date: string;
    end_date: string;
    next_renewal_date?: string;
    status: 'active' | 'paused' | 'cancelled' | 'pending_payment' | 'pending_review';
    receipt_url: string | null;
    
    // Virtuals
    user_name?: string;
    child_name?: string;
}

export interface ServiceOrder {
    id: string;
    user_id: string;
    child_id: number;
    service_id: number;
    assigned_instructor_id: number | null;
    total: number;
    status: OrderStatus;
    details: any;
    created_at: string;
}

export interface ServiceOrderWithRelations extends ServiceOrder {
    users: { name: string; email: string } | null;
    child_profiles: { name: string } | null;
    instructors: { name: string } | null;
    standalone_services: { name: string } | null;
}

export interface InstructorPayout {
    id: string;
    instructor_id: number;
    amount: number;
    payout_date: string;
    details: string;
}

export interface PublisherPayout {
    id: string;
    publisher_id: string;
    amount: number;
    payout_date: string;
    details: string;
    created_at: string;
}

export interface BlogPost {
    id: number;
    slug: string;
    title: string;
    content: string;
    author_name: string;
    image_url: string | null;
    status: 'published' | 'draft';
    published_at: string | null;
    created_at: string;
    deleted_at?: string | null;
}

export interface SiteContent {
    portalPage: any;
    aboutPage: any;
    enhaLakPage: any;
    creativeWritingPage: any;
    supportPage: any;
    privacyPage: { title: string; content: string };
    termsPage: { title: string; content: string };
    footer: any;
}

export interface SiteBranding {
    logoUrl?: string;
    heroImageUrl?: string;
    aboutHeroImageUrl?: string;
    aboutPortalImageUrl?: string;
    joinUsImageUrl?: string;
    creativeWritingPortalImageUrl?: string;
    enhaLakPortalImageUrl?: string;
    aboutImageUrl?: string;
}

export interface SocialLinks {
    id: number;
    facebook_url: string;
    twitter_url: string;
    instagram_url: string;
}

export interface CommunicationSettings {
    support_email: string;
    join_us_email: string;
    whatsapp_number: string;
    whatsapp_default_message: string;
    instapay_url: string;
    instapay_qr_url: string;
    instapay_number: string;
}

export interface JitsiSettings {
    id: number;
    domain: string;
    room_prefix: string;
    join_minutes_before: number;
    expire_minutes_after: number;
    start_with_audio_muted: boolean;
    start_with_video_muted: boolean;
}

export interface PricingSettings {
    id: number;
    company_percentage: number;
    fixed_fee: number;
}

// إعدادات تسعير المكتبة (جديدة)
export interface LibraryPricingSettings {
    id: number;
    company_percentage: number; // نسبة المنصة من سعر الكتب
    fixed_fee: number; // رسوم ثابتة لكل كتاب
}

export interface MaintenanceSettings {
    isActive: boolean;
    message: string;
}

export type Prices = Record<string, number>;
export type ShippingCosts = Record<string, Record<string, number>>;

export interface SupportTicket {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: TicketStatus;
    created_at: string;
}
export type TicketStatus = "جديدة" | "تمت المراجعة" | "مغلقة";

export interface JoinRequest {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    message: string;
    portfolio_url?: string;
    status: RequestStatus;
    created_at: string;
}
export type RequestStatus = "جديد" | "تمت المراجعة" | "مقبول" | "مرفوض";

export interface SupportSessionRequest {
    id: string;
    instructor_id: number;
    child_id: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    requested_at: string;
    
    // Virtuals
    instructor_name?: string;
    child_name?: string;
}

export interface Badge {
    id: number;
    name: string;
    description: string;
    icon_name: string;
}

export interface ChildBadge {
    id: number;
    child_id: number;
    badge_id: number;
    earned_at: string;
}

export interface SessionMessage {
    id: string;
    booking_id: string;
    sender_id: string;
    sender_role: UserRole;
    message_text: string;
    created_at: string;
}

export interface SessionAttachment {
    id: string;
    booking_id: string;
    uploader_id: string;
    uploader_role: UserRole;
    file_name: string;
    file_url: string;
    created_at: string;
}

export interface AdditionalService {
    id: number;
    name: string;
    price: number;
    description: string;
}

export interface Notification {
    id: number;
    user_id: string;
    message: string;
    link: string;
    type: string;
    read: boolean;
    created_at: string;
}

export interface AuditLog {
    id: string;
    user_id: string | null;
    action: string;
    target_description: string;
    details: string;
    timestamp: string;
    user_name?: string; // Virtual
}

// Database helper type for Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface SiteSetting {
    key: string;
    value: Json;
    updated_at: string;
}

// Interfaces for UI logic helpers
export interface UserWithParent extends UserProfile {
    activeStudentsCount?: number;
    totalChildrenCount?: number;
    isActuallyParent?: boolean;
    children?: ChildProfile[];
    parentName?: string;
    parentEmail?: string;
    relatedChildName?: string;
}

export type UserProfileWithRelations = UserWithParent;

export type EnrichedBooking = CreativeWritingBooking & {
    sessions: ScheduledSession[];
    packageDetails?: CreativeWritingPackage;
    instructorName: string;
    child_profiles: { name: string } | null;
}

export type EnrichedChildProfile = ChildProfile & {
    student_email?: string;
}

type DatabaseRelationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type DatabaseTable<
  Row extends object,
  Relationships extends DatabaseRelationship[] = [],
> = {
  Row: Row & Record<string, unknown>
  Insert: Partial<Row> & Record<string, unknown>
  Update: Partial<Row> & Record<string, unknown>
  Relationships: Relationships
}

type BookingRelationships = [
  {
    foreignKeyName: 'fk_bookings_child'
    columns: ['child_id']
    isOneToOne: true
    referencedRelation: 'child_profiles'
    referencedColumns: ['id']
  },
  {
    foreignKeyName: 'fk_bookings_instructor'
    columns: ['instructor_id']
    isOneToOne: true
    referencedRelation: 'instructors'
    referencedColumns: ['id']
  },
  {
    foreignKeyName: 'fk_bookings_user'
    columns: ['user_id']
    isOneToOne: true
    referencedRelation: 'profiles'
    referencedColumns: ['id']
  },
]

type OrderRelationships = [
  {
    foreignKeyName: 'fk_orders_child'
    columns: ['child_id']
    isOneToOne: true
    referencedRelation: 'child_profiles'
    referencedColumns: ['id']
  },
  {
    foreignKeyName: 'fk_orders_user'
    columns: ['user_id']
    isOneToOne: true
    referencedRelation: 'profiles'
    referencedColumns: ['id']
  },
]

type ScheduledSessionRelationships = [
  {
    foreignKeyName: 'scheduled_sessions_booking_id_fkey'
    columns: ['booking_id']
    isOneToOne: true
    referencedRelation: 'bookings'
    referencedColumns: ['id']
  },
  {
    foreignKeyName: 'scheduled_sessions_child_id_fkey'
    columns: ['child_id']
    isOneToOne: true
    referencedRelation: 'child_profiles'
    referencedColumns: ['id']
  },
  {
    foreignKeyName: 'scheduled_sessions_instructor_id_fkey'
    columns: ['instructor_id']
    isOneToOne: true
    referencedRelation: 'instructors'
    referencedColumns: ['id']
  },
]

type EnsureClerkProfileArgs = {
  p_email: string
  p_name: string
}

type CalculateBookingPriceArgs = {
  p_package_name: string
  p_instructor_id: number
}

type BookingSlotAvailabilityArgs = {
  p_instructor_id: number
  p_booking_date: string
  p_booking_time: string
}

type CreateBookingArgs = {
  p_user_id: string
  p_child_id: number
  p_instructor_id: number
  p_package_name: string
  p_booking_date: string
  p_booking_time: string
  p_receipt_url: string | null
  p_expected_total: number
}

type BookingIdArgs = {
  p_booking_id: string
}

type UpdateBookingStatusArgs = {
  p_booking_id: string
  p_new_status: DatabaseBookingStatus
}

type SessionIdArgs = {
  p_session_id: string
}

export interface Database {
  public: {
    Tables: {
      profiles: DatabaseTable<UserProfile>;
      public_profiles: DatabaseTable<PublicProfile>;
      public_settings: DatabaseTable<{ key: string; value: Json; }>;
      child_profiles: DatabaseTable<ChildProfile>;
      parent_student_links: DatabaseTable<ParentStudentLink>;
      instructors: DatabaseTable<Instructor>;
      publisher_profiles: DatabaseTable<PublisherProfile>;
      personalized_products: DatabaseTable<PersonalizedProduct>;
      orders: DatabaseTable<Order, OrderRelationships>;
      bookings: DatabaseTable<CreativeWritingBooking, BookingRelationships>;
      site_settings: DatabaseTable<SiteSetting>;
      audit_logs: DatabaseTable<AuditLog>;
      instructor_payouts: DatabaseTable<InstructorPayout>;
      publisher_payouts: DatabaseTable<PublisherPayout>;
      creative_writing_packages: DatabaseTable<CreativeWritingPackage>;
      standalone_services: DatabaseTable<StandaloneService>;
      subscription_plans: DatabaseTable<SubscriptionPlan>;
      subscriptions: DatabaseTable<Subscription>;
      service_orders: DatabaseTable<ServiceOrder>;
      scheduled_sessions: DatabaseTable<ScheduledSession, ScheduledSessionRelationships>;
      blog_posts: DatabaseTable<BlogPost>;
      support_tickets: DatabaseTable<SupportTicket>;
      join_requests: DatabaseTable<JoinRequest>;
      support_session_requests: DatabaseTable<SupportSessionRequest>;
      notifications: DatabaseTable<Notification>;
      badges: DatabaseTable<Badge>;
      child_badges: DatabaseTable<ChildBadge>;
      comparison_items: DatabaseTable<ComparisonItem>;
      session_messages: DatabaseTable<SessionMessage>;
      session_attachments: DatabaseTable<SessionAttachment>;
      [tableName: string]: DatabaseTable<object, DatabaseRelationship[]>;
    };
    Views: {};
    Functions: {
      current_app_profile_id: {
        Args: Record<string, never>
        Returns: string | null
      };
      reload_schema_cache: {
        Args: Record<string, never>
        Returns: null
      };
      ensure_clerk_profile: {
        Args: EnsureClerkProfileArgs
        Returns: UserProfile
      };
      calculate_booking_price: {
        Args: CalculateBookingPriceArgs
        Returns: number
      };
      is_booking_slot_available_secure: {
        Args: BookingSlotAvailabilityArgs
        Returns: boolean
      };
      get_booking_availability_secure: {
        Args: Record<string, never>
        Returns: BookingAvailability[]
      };
      create_booking_secure: {
        Args: CreateBookingArgs
        Returns: BookingCreationResult
      };
      confirm_booking_secure: {
        Args: BookingIdArgs
        Returns: BookingConfirmationResult
      };
      update_booking_status_secure: {
        Args: UpdateBookingStatusArgs
        Returns: BookingStatusUpdateResult
      };
      authorize_session_join_secure: {
        Args: SessionIdArgs
        Returns: SessionJoinAuthorizationResult
      };
    }
  }
}
