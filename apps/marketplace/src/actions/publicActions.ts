"use server";

import { publicService as apiPublicService } from '@alrehla/api/services/publicService';
import { withPublicAction } from '../lib/server/actionSecurity';

export const getBlogPosts = async () => {
  return withPublicAction('public.getBlogPosts', () =>
    apiPublicService.getBlogPosts(),
  );
};

export const getPersonalizedProducts = async () => {
  return withPublicAction('public.getPersonalizedProducts', () =>
    apiPublicService.getPersonalizedProducts(),
  );
};

export const getSubscriptionPlans = async () => {
  return withPublicAction('public.getSubscriptionPlans', () =>
    apiPublicService.getSubscriptionPlans(),
  );
};

export const getCreativeWritingData = async () => {
  return withPublicAction('public.getCreativeWritingData', () =>
    apiPublicService.getCreativeWritingData(),
  );
};

export const getPublicSettings = async () => {
  return withPublicAction('public.getPublicSettings', () =>
    apiPublicService.getPublicSettings(),
  );
};

export const getAllPublicData = async () => {
  return withPublicAction('public.getAllPublicData', () =>
    apiPublicService.getAllPublicData(),
  );
};

export const getHomePageData = async () => {
  return withPublicAction('public.getHomePageData', () =>
    apiPublicService.getHomePageData(),
  );
};
