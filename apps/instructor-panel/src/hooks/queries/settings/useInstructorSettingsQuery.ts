import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { bookingService } from '../../../services/bookingService';
import { usePackagesQuery } from '../instructor/usePackagesQuery';

const fetchSetting = async (key: string) => {
    const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
    if (error || !data || (data as any).value === undefined || (data as any).value === null) {
        return null;
    }
    return (data as any).value;
};

export const useAdminCWSettings = () => {
    const packagesQuery = usePackagesQuery();
    const settingsQuery = useQuery({
        queryKey: ['adminCWSettings'],
        queryFn: async () => {
            const [standaloneServices, comparisonItems] = await Promise.all([
                bookingService.getAllStandaloneServices(),
                bookingService.getAllComparisonItems(),
            ]);
            return { services: [], standaloneServices, comparisonItems };
        },
        staleTime: 1000 * 60 * 5,
    });

    return {
        ...settingsQuery,
        data: settingsQuery.data
            ? { ...settingsQuery.data, packages: packagesQuery.data ?? [] }
            : undefined,
        isLoading: settingsQuery.isLoading || packagesQuery.isLoading,
        isFetching: settingsQuery.isFetching || packagesQuery.isFetching,
        error: settingsQuery.error ?? packagesQuery.error,
    };
};

export const useAdminPricingSettings = () => useQuery({
    queryKey: ['adminPricingSettings'],
    queryFn: () => fetchSetting('pricing_config'),
});
