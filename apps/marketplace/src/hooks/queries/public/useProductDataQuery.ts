
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import {
    mockPrices,
    mockSiteBranding,
    mockShippingCosts
} from '../../../data/mockData';

export const usePrices = (enabled = true) => useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
        const { data } = await supabase.from('public_settings').select('value').eq('key', 'prices').single();
        return (data as any)?.value || null;
    },
    staleTime: Infinity,
    enabled,
});

export const useSiteBranding = (enabled = true) => useQuery({
    queryKey: ['siteBranding'],
    queryFn: async () => {
        const { data } = await supabase.from('public_settings').select('value').eq('key', 'branding').single();
        return (data as any)?.value || null;
    },
    staleTime: 1000 * 60 * 10,
    enabled,
});

export const useShippingCosts = (enabled = true) => useQuery({
    queryKey: ['shippingCosts'],
    queryFn: async () => {
        const { data } = await supabase.from('public_settings').select('value').eq('key', 'shipping_costs').single();
        return (data as any)?.value || null;
    },
    staleTime: Infinity,
    enabled,
});
