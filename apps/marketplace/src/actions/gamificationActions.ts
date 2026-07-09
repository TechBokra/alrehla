"use server";

import { gamificationService as apiGamificationService } from '@alrehla/api/services/gamificationService';

export const getAllBadges = async () => {
  return apiGamificationService.getAllBadges();
};

export const awardBadge = async (payload: { childId: number; badgeId: number; instructorId: number }) => {
  return apiGamificationService.awardBadge(payload);
};
