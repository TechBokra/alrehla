import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { bookingService } from '../../../services/bookingService';

const fetchSetting = async (key: string) => {
    const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
    if (error || !data || (data as any).value === undefined || (data as any).value === null) {
        return null;
    }
    return (data as any).value;
};

export const useAdminCWSettings = () => useQuery({
    queryKey: ['adminCWSettings'],
    queryFn: async () => {
        const [packages, standaloneServices, comparisonItems] = await Promise.all([
            bookingService.getAllPackages(),
            bookingService.getAllStandaloneServices(),
            bookingService.getAllComparisonItems(),
        ]);
        return { packages, services: [], standaloneServices, comparisonItems };
    },
    staleTime: 1000 * 60 * 5 
});

export const useAdminPricingSettings = () => useQuery({
    queryKey: ['adminPricingSettings'],
    queryFn: () => fetchSetting('pricing_config'),
});
