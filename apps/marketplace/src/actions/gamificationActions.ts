"use server";

import { gamificationService as apiGamificationService } from '@alrehla/api/services/gamificationService';
import type { UserRole } from '@alrehla/types';
import { awardBadgeSchema } from '../lib/server/actionSchemas';
import {
  MARKETPLACE_ROLES,
  actionError,
  isDatabaseAdmin,
  parseActionInput,
  revalidateMarketplaceTags,
  withMarketplaceAction,
  withPublicAction,
} from '../lib/server/actionSecurity';

const BADGE_AWARD_ROLES = [
  'instructor',
  ...MARKETPLACE_ROLES.databaseAdmins,
] as const satisfies readonly UserRole[];

export const getAllBadges = async () =>
  withPublicAction('gamification.getAllBadges', () =>
    apiGamificationService.getAllBadges(),
  );

export const awardBadge = async (payload: {
  childId: number;
  badgeId: number;
  instructorId: number;
}) => {
  const input = parseActionInput(awardBadgeSchema, payload) as {
    childId: number;
    badgeId: number;
    instructorId?: number;
  };

  return withMarketplaceAction(
    'gamification.awardBadge',
    async (context) => {
      const { data: badge, error: badgeError } = await context.supabase
        .from('badges')
        .select('id')
        .eq('id', input.badgeId)
        .maybeSingle();
      if (badgeError || !badge) {
        actionError('الشارة المحددة غير موجودة.');
      }

      let instructorId = input.instructorId;
      if (!isDatabaseAdmin(context.actor)) {
        const { data: instructor, error: instructorError } =
          await context.supabase
            .from('instructors')
            .select('id')
            .eq('user_id', context.actor.id)
            .maybeSingle();
        if (instructorError || !instructor) {
          actionError('ملف المدرب غير موجود.');
        }

        instructorId = (instructor as any).id;
        const { data: relatedBooking, error: bookingError } =
          await context.supabase
            .from('bookings')
            .select('id')
            .eq('child_id', input.childId)
            .eq('instructor_id', instructorId)
            .limit(1)
            .maybeSingle();

        if (bookingError || !relatedBooking) {
          actionError('لا يمكنك منح شارة لطفل غير مرتبط بحجوزاتك.');
        }
      }

      try {
        const result = await apiGamificationService.awardBadge({
          childId: input.childId,
          badgeId: input.badgeId,
          // The shared service currently ignores this field, but never receives
          // a browser-supplied instructor identity.
          instructorId: instructorId || 0,
        });
        revalidateMarketplaceTags(
          `marketplace:child:${input.childId}`,
          'marketplace:badges',
        );
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('duplicate') || message.includes('unique')) {
          actionError('تم منح هذه الشارة للطفل من قبل.');
        }
        throw error;
      }
    },
    BADGE_AWARD_ROLES,
  );
};
