"use server";

import { settingsService as apiSettingsService } from '@alrehla/api/services/settingsService';

export const updateBranding = async (newBranding: any) => {
  return apiSettingsService.updateBranding(newBranding);
};

export const updatePrices = async (newPrices: any) => {
  return apiSettingsService.updatePrices(newPrices);
};

export const updateShippingCosts = async (newCosts: any) => {
  return apiSettingsService.updateShippingCosts(newCosts);
};

export const updateSocialLinks = async (links: any) => {
  return apiSettingsService.updateSocialLinks(links);
};

export const updateCommunicationSettings = async (settings: any) => {
  return apiSettingsService.updateCommunicationSettings(settings);
};

export const updatePricingSettings = async (settings: any) => {
  return apiSettingsService.updatePricingSettings(settings);
};

export const updateLibraryPricingSettings = async (settings: any) => {
  return apiSettingsService.updateLibraryPricingSettings(settings);
};

export const updateJitsiSettings = async (settings: any) => {
  return apiSettingsService.updateJitsiSettings(settings);
};

export const updateRolePermissions = async (permissions: any) => {
  return apiSettingsService.updateRolePermissions(permissions);
};

export const updateSystemConfig = async (config: any) => {
  return apiSettingsService.updateSystemConfig(config);
};

export const updateMaintenanceSettings = async (settings: any) => {
  return apiSettingsService.updateMaintenanceSettings(settings);
};

export const initializeDefaults = async () => {
  return apiSettingsService.initializeDefaults();
};
