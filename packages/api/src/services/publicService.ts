
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
            .select('*, publisher:public_profiles(name)')
            .is('deleted_at', null)
            .order('sort_order');
        
        return (data as PersonalizedProduct[] || [])
            .filter(p => p.is_active !== false)
            .map(p => ({
                ...p,
                publisher: p.publisher ? p.publisher : { name: 'الرحلة' }
            }));
    },

    async getSubscriptionPlans() {
        const { data } = await supabase
            .from('subscription_plans')
            .select('*')
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
            supabase.from('instructors').select('*').is('deleted_at', null),
            supabase.from('creative_writing_packages').select('*'),
            supabase.from('standalone_services').select('*'),
            supabase.from('public_settings').select('*')
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
        const { data: settingsData } = await supabase.from('public_settings').select('*');
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
            supabase.from('instructors').select('*').is('deleted_at', null).then(r => r.data || []),
            this.getBlogPosts(),
            this.getPersonalizedProducts(),
            supabase.from('creative_writing_packages').select('*').then(r => r.data || []),
            this.getSubscriptionPlans(),
            supabase.from('standalone_services').select('*').then(r => r.data || []),
            supabase.from('public_settings').select('*').then(r => r.data || []),
            supabase.from('badges').select('*').then(r => r.data || []),
            supabase.from('comparison_items').select('*').order('sort_order').then(r => r.data || []),
            supabase.from('publisher_profiles').select('*').then(r => r.data || [])
        ]);

        const getSetting = (key: string, defaultValue?: any) => {
            const item = (settingsData as any[])?.find(s => s.key === key);
            return item ? item.value : defaultValue || null;
        };

        const displayPublishers = (publishers && publishers.length > 0) ? (publishers as PublisherProfile[]) : [];

        return {
            instructors: instructors as Instructor[],
            publishers: displayPublishers,
            blogPosts,
            personalizedProducts,
            creativeWritingPackages: packages as CreativeWritingPackage[],
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
