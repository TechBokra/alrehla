"use server";

import { financialService as apiFinancialService } from '@alrehla/api/services/financialService';
import { createPayoutSchema } from '../lib/server/actionSchemas';
import {
  MARKETPLACE_ROLES,
  actionError,
  parseActionInput,
  revalidateMarketplaceTags,
  withMarketplaceAction,
} from '../lib/server/actionSecurity';

export const createPayout = async (payload: {
  instructorId: number;
  amount: number;
  details: string;
}) => {
  const input = parseActionInput(createPayoutSchema, payload) as {
    instructorId: number;
    amount: number;
    details: string;
  };

  return withMarketplaceAction(
    'financial.createPayout',
    async (context) => {
      const { data: instructor, error } = await context.supabase
        .from('instructors')
        .select('id')
        .eq('id', input.instructorId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !instructor) {
        actionError('المدرب المحدد غير موجود أو غير متاح.');
      }

      const result = await apiFinancialService.createPayout(input);
      revalidateMarketplaceTags(
        `marketplace:instructor-financials:${input.instructorId}`,
        'marketplace:financials',
      );
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};
