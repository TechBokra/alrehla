
import { supabase } from '../lib/supabaseClient';
import { 
    mockSocialLinks, 
    mockCommunicationSettings, 
    mockPricingSettings, 
    mockJitsiSettings, 
    mockSiteBranding, 
    mockSiteContent, 
    mockPrices, 
    mockShippingCosts, 
    mockMaintenanceSettings, 
    mockLibraryPricingSettings 
} from '@alrehla/config/mockData';
import { DEFAULT_CONFIG } from '../lib/config';
import type { 
    SocialLinks, 
    CommunicationSettings, 
    PricingSettings, 
    JitsiSettings, 
    SiteBranding, 
    Prices, 
    ShippingCosts, 
    MaintenanceSettings, 
    LibraryPricingSettings 
} from '@alrehla/types';

// Helper to fetch single setting safely
const fetchSetting = async (key: string, seedValue: any) => {
    const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
    
    // Auto-Seed logic removed; returning null when missing
    if (error || !data || (data as any).value === undefined || (data as any).value === null) {
        return null;
    }
    
    return (data as any).value;
};

export const settingsService = {
    // --- Branding ---
    async updateBranding(newBranding: Partial<SiteBranding>) {
        const currentVal = await fetchSetting('branding', mockSiteBranding);
        const updatedValue = { ...currentVal, ...newBranding };

        const { error } = await supabase
            .from('site_settings')
            .upsert({ 
                key: 'branding', 
                value: updatedValue,
                updated_at: new Date().toISOString()
            } as any);

        if (error) throw new Error(error.message);
        return updatedValue as SiteBranding;
    },

    // --- Prices ---
    async updatePrices(newPrices: Prices) {
        const { error } = await supabase
            .from('site_settings')
            .upsert({ 
                key: 'prices', 
                value: newPrices,
                updated_at: new Date().toISOString()
            } as any);

        if (error) throw new Error(error.message);
        return newPrices;
    },

    // --- Shipping ---
    async updateShippingCosts(newCosts: ShippingCosts) {
        const { error } = await supabase
            .from('site_settings')
            .upsert({ 
                key: 'shipping_costs', 
                value: newCosts,
                updated_at: new Date().toISOString()
            } as any);

        if (error) throw new Error(error.message);
        return newCosts;
    },

    // --- General Settings ---
    async updateSocialLinks(links: SocialLinks) {
        const { error } = await supabase
            .from('site_settings')
            .upsert({ key: 'social_links', value: links, updated_at: new Date().toISOString() } as any);
        
        if (error) throw new Error(error.message);
        return links;
    },

    async updateCommunicationSettings(settings: CommunicationSettings) {
        const { error } = await supabase
            .from('site_settings')
            .upsert({ key: 'communication_settings', value: settings, updated_at: new Date().toISOString() } as any);

        if (error) throw new Error(error.message);
        return settings;
    },

    async updatePricingSettings(settings: PricingSettings) {
        const { error } = await supabase
            .from('site_settings')
            .upsert({ key: 'pricing_config', value: settings, updated_at: new Date().toISOString() } as any);

        if (error) throw new Error(error.message);
        return settings;
    },

    async updateLibraryPricingSettings(settings: LibraryPricingSettings) {
        const { error } = await supabase
            .from('site_settings')
            .upsert({ key: 'library_pricing_config', value: settings, updated_at: new Date().toISOString() } as any);

        if (error) throw new Error(error.message);
        return settings;
    },

    async updateJitsiSettings(settings: JitsiSettings) {
        const { error } = await supabase
            .from('site_settings')
            .upsert({ key: 'jitsi_settings', value: settings, updated_at: new Date().toISOString() } as any);

        if (error) throw new Error(error.message);
        return settings;
    },

    async updateRolePermissions(permissions: any) {
        const { error } = await supabase
            .from('site_settings')
            .upsert({ key: 'role_permissions', value: permissions, updated_at: new Date().toISOString() } as any);

        if (error) throw new Error(error.message);
        return { success: true };
    },
    
    // --- System Config ---
    async updateSystemConfig(config: any) {
        const { error } = await supabase
            .from('site_settings')
            .upsert({ key: 'system_config', value: config, updated_at: new Date().toISOString() } as any);

        if (error) throw new Error(error.message);
        return config;
    },

    // --- Maintenance Settings ---
    async updateMaintenanceSettings(settings: MaintenanceSettings) {
        const { error } = await supabase
            .from('site_settings')
            .upsert({ key: 'maintenance_settings', value: settings, updated_at: new Date().toISOString() } as any);

        if (error) throw new Error(error.message);
        return settings;
    },

    // --- Database Initialization (Can be called manually too) ---
    async initializeDefaults() {
        const defaults = [
            { key: 'branding', value: mockSiteBranding },
            { key: 'social_links', value: mockSocialLinks },
            { key: 'communication_settings', value: mockCommunicationSettings },
            { key: 'pricing_config', value: mockPricingSettings },
            { key: 'library_pricing_config', value: mockLibraryPricingSettings },
            { key: 'jitsi_settings', value: mockJitsiSettings },
            { key: 'global_content', value: mockSiteContent },
            { key: 'prices', value: mockPrices },
            { key: 'shipping_costs', value: mockShippingCosts },
            { key: 'system_config', value: DEFAULT_CONFIG },
            { key: 'maintenance_settings', value: mockMaintenanceSettings }
        ];

        const promises = defaults.map(item => 
            supabase.from('site_settings').upsert({
                key: item.key,
                value: item.value,
                updated_at: new Date().toISOString()
            } as any)
        );

        const results = await Promise.all(promises);
        const errors = results.filter(r => r.error);
        
        if (errors.length > 0) {
            throw new Error(`Fails to seed ${errors.length} settings.`);
        }
        
        return { success: true };
    }
};
