"use server";

import { financialService as apiFinancialService } from '@alrehla/api/services/financialService';

export const createPayout = async (payload: { instructorId: number, amount: number, details: string }) => {
  return apiFinancialService.createPayout(payload);
};
