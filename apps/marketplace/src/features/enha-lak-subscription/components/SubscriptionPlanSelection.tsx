'use client';

import React from 'react';
import type { SubscriptionPlan } from '../../../lib/database.types';
import { Card } from '@alrehla/ui/card';
import { cn } from '@alrehla/ui/lib/utils';

interface SubscriptionPlanSelectionProps {
  plans: SubscriptionPlan[];
  selectedPlanId: number | null;
  onSelect: (planId: number) => void;
  error?: string;
}

const SubscriptionPlanSelection: React.FC<SubscriptionPlanSelectionProps> = ({
  plans,
  selectedPlanId,
  onSelect,
  error,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {plans.map((plan) => {
        const isSelected = selectedPlanId === plan.id;

        return (
          <Card
            as="button"
            type="button"
            key={plan.id}
            aria-pressed={isSelected}
            onClick={() => onSelect(plan.id)}
            className={cn(
              'h-auto cursor-pointer rounded-2xl border-2 p-6 text-right transition-all',
              isSelected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-gray-200 hover:border-primary/50',
            )}
          >
            {plan.is_best_value && (
              <span className="mb-2 inline-block rounded bg-yellow-400 px-2 py-1 text-xs font-bold text-yellow-900">
                الأفضل قيمة
              </span>
            )}
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <div className="my-4">
              <span className="text-3xl font-extrabold">{plan.price} ج.م</span>
              <p className="text-xs text-muted-foreground">
                ({plan.price_per_month} ج.م / شهر)
              </p>
            </div>
            <p className="text-sm text-gray-600">{plan.duration_months} أشهر من المرح والتعلم.</p>
            {plan.savings_text && (
              <p className="mt-2 text-sm font-bold text-green-600">{plan.savings_text}</p>
            )}
          </Card>
        );
      })}
    </div>
    {error && <p className="text-sm font-medium text-destructive">{error}</p>}
  </div>
);

export default React.memo(SubscriptionPlanSelection);
