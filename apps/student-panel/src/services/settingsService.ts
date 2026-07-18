import * as settingsActions from '../actions/settingsActions';

export const settingsService = {
  updateBranding: settingsActions.updateBranding,
  updatePrices: settingsActions.updatePrices,
  updateShippingCosts: settingsActions.updateShippingCosts,
  updateSocialLinks: settingsActions.updateSocialLinks,
  updateCommunicationSettings: settingsActions.updateCommunicationSettings,
  updatePricingSettings: settingsActions.updatePricingSettings,
  updateLibraryPricingSettings: settingsActions.updateLibraryPricingSettings,
  updateJitsiSettings: settingsActions.updateJitsiSettings,
  updateRolePermissions: settingsActions.updateRolePermissions,
  updateSystemConfig: settingsActions.updateSystemConfig,
  updateMaintenanceSettings: settingsActions.updateMaintenanceSettings,
  initializeDefaults: settingsActions.initializeDefaults,
};
