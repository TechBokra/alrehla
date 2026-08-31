
import type {
    BlogPost,
    CommunicationSettings,
    CreativeWritingPackage,
    Instructor,
    MaintenanceSettings,
    PersonalizedProduct,
    PricingSettings,
    PublisherProfile,
    SiteContent,
    SocialLinks,
    StandaloneService,
    SubscriptionPlan
} from '@alrehla/types';
import { supabase } from '../lib/supabaseClient';

const PUBLIC_INSTRUCTOR_COLUMNS = [
    'id',
    'name',
    'slug',
    'specialty',
    'bio',
    'avatar_url',
    'service_rates',
    'package_rates',
    'weekly_schedule',
    'availability',
    'intro_availability',
    'teaching_philosophy',
    'expertise_areas',
    'intro_video_url',
    'published_works',
].join(',');

const PUBLIC_PACKAGE_COLUMNS = [
    'id',
    'name',
    'sessions',
    'price',
    'features',
    'description',
    'detailed_description',
    'target_age',
    'level',
    'icon_name',
    'popular',
    'includes_digital_portfolio',
    'includes_certificate',
    'includes_publication',
    'includes_extra_mentoring',
    'comparison_values',
].join(',');

const PUBLIC_SERVICE_COLUMNS =
    'id,name,price,description,category,icon_name,requires_file_upload,provider_type';
const PUBLIC_PLAN_COLUMNS =
    'id,name,duration_months,price,price_per_month,savings_text,is_best_value';
const PUBLIC_PUBLISHER_COLUMNS =
    'id,slug,store_name,logo_url,cover_url,description,website,social_links,created_at';
const PUBLIC_PRODUCT_COLUMNS = [
    'id',
    'key',
    'title',
    'product_type',
    'description',
    'image_url',
    'features',
    'sort_order',
    'is_featured',
    'is_addon',
    'is_active',
    'has_printed_version',
    'price_printed',
    'price_electronic',
    'image_slots',
    'text_fields',
    'goal_config',
    'story_goals',
    'component_keys',
    'publisher:public_profiles(name)',
].join(',');

interface PublicData {
    instructors: Instructor[];
    publishers: PublisherProfile[];
    blogPosts: BlogPost[];
    personalizedProducts: PersonalizedProduct[];
    creativeWritingPackages: CreativeWritingPackage[];
    siteContent: SiteContent;
    socialLinks: SocialLinks;
    publicHolidays: string[];
    subscriptionPlans: SubscriptionPlan[];
    standaloneServices: StandaloneService[];
    communicationSettings: CommunicationSettings;
    pricingSettings: PricingSettings;
    maintenanceSettings: MaintenanceSettings;
}
export const publicService = {
    async getBlogPosts() {
        const now = new Date().toISOString();
        const { data } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('status', 'published')
            .lte('published_at', now)
            .is('deleted_at', null)
            .order('published_at', { ascending: false });
        return (data as BlogPost[])?.length > 0 ? (data as BlogPost[]) : [];
    },

    async getPersonalizedProducts() {
        const { data } = await supabase
            .from('personalized_products')
            .select(PUBLIC_PRODUCT_COLUMNS)
            .is('deleted_at', null)
            .eq('is_active', true)
            .eq('approval_status', 'approved')
            .order('sort_order')
            .overrideTypes<PersonalizedProduct[]>();
        
        return (data || [])
            .map(p => ({
                ...p,
                publisher: p.publisher ? p.publisher : { name: 'الرحلة' }
            }));
    },

    async getSubscriptionPlans() {
        const { data } = await supabase
            .from('subscription_plans')
            .select(PUBLIC_PLAN_COLUMNS)
            .is('deleted_at', null)
            .order('price');
        return (data as SubscriptionPlan[]) || [];
    },

    async getCreativeWritingData() {
        const [
            { data: instructors },
            { data: packages },
            { data: services },
            { data: settings }
        ] = await Promise.all([
            supabase.from('instructors').select(PUBLIC_INSTRUCTOR_COLUMNS).is('deleted_at', null).overrideTypes<Instructor[]>(),
            supabase.from('creative_writing_packages').select(PUBLIC_PACKAGE_COLUMNS).overrideTypes<CreativeWritingPackage[]>(),
            supabase.from('standalone_services').select(PUBLIC_SERVICE_COLUMNS),
            supabase.from('public_settings').select('key,value')
        ]);

        const getSetting = (key: string, defaultValue?: any) => {
            const item = (settings as any[])?.find(s => s.key === key);
            return item ? item.value : defaultValue || null;
        };

        return {
            instructors: (instructors as Instructor[]) || [],
            creativeWritingPackages: (packages as CreativeWritingPackage[]) || [],
            standaloneServices: (services as StandaloneService[]) || [],
            pricingSettings: getSetting('pricing_config', null),
            publicHolidays: []
        };
    },

    async getPublicSettings() {
        const { data: settingsData } = await supabase.from('public_settings').select('key,value');
        const getSetting = (key: string, defaultValue?: any) => {
            const item = (settingsData as any[])?.find(s => s.key === key);
            return item ? item.value : defaultValue || null;
        };

        return {
            siteContent: getSetting('global_content', null),
            siteBranding: getSetting('branding'),
            socialLinks: getSetting('social_links', null),
            communicationSettings: getSetting('communication_settings', null),
            pricingSettings: getSetting('pricing_config', null),
            maintenanceSettings: getSetting('maintenance_settings', null)
        };
    },

    async getHomePageData() {
        const now = new Date().toISOString();
        const [
            { data: settingsData },
            { data: blogPosts },
            { data: personalizedProducts },
            { data: publishers }
        ] = await Promise.all([
            supabase
                .from('public_settings')
                .select('key,value')
                .in('key', ['global_content', 'branding']),
            supabase
                .from('blog_posts')
                .select('id,slug,title,content,author_name,image_url,status,published_at,created_at,deleted_at')
                .eq('status', 'published')
                .lte('published_at', now)
                .is('deleted_at', null)
                .order('published_at', { ascending: false })
                .limit(3),
            supabase
                .from('personalized_products')
                .select('id,key,title,image_url,is_active,sort_order,deleted_at')
                .is('deleted_at', null)
                .in('key', ['custom_story', 'subscription_box'])
                .order('sort_order')
                .limit(6),
            supabase
                .from('publisher_profiles')
                .select('id,slug,store_name,logo_url')
                .limit(8)
        ]);

        const getSetting = (key: string, defaultValue?: any) => {
            const item = (settingsData as any[])?.find(s => s.key === key);
            return item ? item.value : defaultValue || null;
        };

        return {
            publishers: ((publishers as PublisherProfile[]) || []).slice(0, 8),
            blogPosts: (blogPosts as BlogPost[]) || [],
            personalizedProducts: ((personalizedProducts as PersonalizedProduct[]) || [])
                .filter(p => p.is_active !== false)
                .map(p => ({
                    ...p,
                    publisher: { name: 'الرحلة' }
                })),
            siteContent: getSetting('global_content', null),
            siteBranding: getSetting('branding')
        };
    },

    async getAllPublicData() {
        const [
            instructors,
            blogPosts,
            personalizedProducts,
            packages,
            plans,
            services,
            settingsData,
            badges,
            comparisonItems,
            publishers
        ] = await Promise.all([
            supabase
                .from('instructors')
                .select(PUBLIC_INSTRUCTOR_COLUMNS)
                .is('deleted_at', null)
                .overrideTypes<Instructor[]>()
                .then(r => r.data || []),
            this.getBlogPosts(),
            this.getPersonalizedProducts(),
            supabase
                .from('creative_writing_packages')
                .select(PUBLIC_PACKAGE_COLUMNS)
                .overrideTypes<CreativeWritingPackage[]>()
                .then(r => r.data || []),
            this.getSubscriptionPlans(),
            supabase
                .from('standalone_services')
                .select(PUBLIC_SERVICE_COLUMNS)
                .then(r => r.data || []),
            supabase.from('public_settings').select('key,value').then(r => r.data || []),
            supabase
                .from('badges')
                .select('id,name,description,icon_name')
                .then(r => r.data || []),
            supabase
                .from('comparison_items')
                .select('id,label,type,sort_order')
                .order('sort_order')
                .then(r => r.data || []),
            supabase
                .from('publisher_profiles')
                .select(PUBLIC_PUBLISHER_COLUMNS)
                .then(r => r.data || [])
        ]);

        const getSetting = (key: string, defaultValue?: any) => {
            const item = (settingsData as any[])?.find(s => s.key === key);
            return item ? item.value : defaultValue || null;
        };

        const displayPublishers = (publishers && publishers.length > 0) ? (publishers as PublisherProfile[]) : [];

        return {
            instructors,
            publishers: displayPublishers,
            blogPosts,
            personalizedProducts,
            creativeWritingPackages: packages,
            subscriptionPlans: plans,
            standaloneServices: services as StandaloneService[],
            badges: badges as any[],
            comparisonItems: comparisonItems as any[],
            
            siteContent: getSetting('global_content', null),
            siteBranding: getSetting('branding'),
            socialLinks: getSetting('social_links', null),
            communicationSettings: getSetting('communication_settings', null),
            pricingSettings: getSetting('pricing_config', null),
            maintenanceSettings: getSetting('maintenance_settings', null),
            
            publicHolidays: [], 
        };
    }
};
