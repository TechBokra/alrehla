import { useQuery } from '@tanstack/react-query';
import { publicService } from '../../../services/publicService';
import type {
    Instructor,
    BlogPost,
    PersonalizedProduct,
    CreativeWritingPackage,
    SiteContent,
    SocialLinks,
    SubscriptionPlan,
    StandaloneService,
    CommunicationSettings,
    PricingSettings,
    MaintenanceSettings,
    PublisherProfile
} from '../../../lib/database.types';

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

export const usePublicData = () => {
    return useQuery<PublicData>({
        queryKey: ['publicData'],
        queryFn: async () => {
            const data = await publicService.getAllPublicData();
            return data as PublicData;
        },
        staleTime: 60 * 1000, 
    });
};
