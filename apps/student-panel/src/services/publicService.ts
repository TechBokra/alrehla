import * as publicActions from '../actions/publicActions';

export const publicService = {
  getBlogPosts: publicActions.getBlogPosts,
  getPersonalizedProducts: publicActions.getPersonalizedProducts,
  getSubscriptionPlans: publicActions.getSubscriptionPlans,
  getCreativeWritingData: publicActions.getCreativeWritingData,
  getPublicSettings: publicActions.getPublicSettings,
  getAllPublicData: publicActions.getAllPublicData,
  getHomePageData: publicActions.getHomePageData,
};
