"use server";

import { publicService as apiPublicService } from '@alrehla/api/services/publicService';

export const getBlogPosts = async () => {
  return apiPublicService.getBlogPosts();
};

export const getPersonalizedProducts = async () => {
  return apiPublicService.getPersonalizedProducts();
};

export const getSubscriptionPlans = async () => {
  return apiPublicService.getSubscriptionPlans();
};

export const getCreativeWritingData = async () => {
  return apiPublicService.getCreativeWritingData();
};

export const getPublicSettings = async () => {
  return apiPublicService.getPublicSettings();
};

export const getAllPublicData = async () => {
  return apiPublicService.getAllPublicData();
};

export const getHomePageData = async () => {
  return apiPublicService.getHomePageData();
};
