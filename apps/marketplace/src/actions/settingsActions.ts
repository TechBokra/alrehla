"use server";

import { settingsService as apiSettingsService } from '@alrehla/api/services/settingsService';
import {
  brandingSchema,
  communicationSettingsSchema,
  jitsiSettingsSchema,
  maintenanceSettingsSchema,
  pricesSchema,
  pricingSettingsSchema,
  rolePermissionsSchema,
  shippingCostsSchema,
  socialLinksSchema,
  systemConfigSchema,
} from '../lib/server/actionSchemas';
import {
  MARKETPLACE_ROLES,
  parseActionInput,
  revalidateMarketplaceTags,
  withMarketplaceAction,
} from '../lib/server/actionSecurity';

const updateSetting = async <T>(
  actionName: string,
  cacheTag: string,
  operation: () => Promise<T>,
) =>
  withMarketplaceAction(
    actionName,
    async () => {
      const result = await operation();
      revalidateMarketplaceTags(cacheTag, 'marketplace:public-data');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );

export const updateBranding = async (newBranding: any) => {
  const input = parseActionInput(brandingSchema, newBranding);
  return updateSetting('settings.updateBranding', 'marketplace:branding', () =>
    apiSettingsService.updateBranding(input as any),
  );
};

export const updatePrices = async (newPrices: any) => {
  const input = parseActionInput(pricesSchema, newPrices);
  return updateSetting('settings.updatePrices', 'marketplace:prices', () =>
    apiSettingsService.updatePrices(input),
  );
};

export const updateShippingCosts = async (newCosts: any) => {
  const input = parseActionInput(shippingCostsSchema, newCosts);
  return updateSetting(
    'settings.updateShippingCosts',
    'marketplace:shipping-costs',
    () => apiSettingsService.updateShippingCosts(input),
  );
};

export const updateSocialLinks = async (links: any) => {
  const input = parseActionInput(socialLinksSchema, links);
  return updateSetting(
    'settings.updateSocialLinks',
    'marketplace:social-links',
    () => apiSettingsService.updateSocialLinks(input as any),
  );
};

export const updateCommunicationSettings = async (settings: any) => {
  const input = parseActionInput(communicationSettingsSchema, settings);
  return updateSetting(
    'settings.updateCommunicationSettings',
    'marketplace:communication-settings',
    () => apiSettingsService.updateCommunicationSettings(input as any),
  );
};

export const updatePricingSettings = async (settings: any) => {
  const input = parseActionInput(pricingSettingsSchema, settings);
  return updateSetting(
    'settings.updatePricingSettings',
    'marketplace:pricing-settings',
    () => apiSettingsService.updatePricingSettings(input as any),
  );
};

export const updateLibraryPricingSettings = async (settings: any) => {
  const input = parseActionInput(pricingSettingsSchema, settings);
  return updateSetting(
    'settings.updateLibraryPricingSettings',
    'marketplace:library-pricing-settings',
    () => apiSettingsService.updateLibraryPricingSettings(input as any),
  );
};

export const updateJitsiSettings = async (settings: any) => {
  const input = parseActionInput(jitsiSettingsSchema, settings);
  return updateSetting(
    'settings.updateJitsiSettings',
    'marketplace:jitsi-settings',
    () => apiSettingsService.updateJitsiSettings(input as any),
  );
};

export const updateRolePermissions = async (permissions: any) => {
  const input = parseActionInput(rolePermissionsSchema, permissions);
  return updateSetting(
    'settings.updateRolePermissions',
    'marketplace:role-permissions',
    () => apiSettingsService.updateRolePermissions(input),
  );
};

export const updateSystemConfig = async (config: any) => {
  const input = parseActionInput(systemConfigSchema, config);
  return updateSetting(
    'settings.updateSystemConfig',
    'marketplace:system-config',
    () => apiSettingsService.updateSystemConfig(input),
  );
};

export const updateMaintenanceSettings = async (settings: any) => {
  const input = parseActionInput(maintenanceSettingsSchema, settings);
  return updateSetting(
    'settings.updateMaintenanceSettings',
    'marketplace:maintenance-settings',
    () => apiSettingsService.updateMaintenanceSettings(input as any),
  );
};

export const initializeDefaults = async () =>
  updateSetting(
    'settings.initializeDefaults',
    'marketplace:settings',
    () => apiSettingsService.initializeDefaults(),
  );
