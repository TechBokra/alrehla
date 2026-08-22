import React from 'react';
import { Check, Gift, Plus, Puzzle, Send, Truck } from 'lucide-react';
import type { PersonalizedProduct, SubscriptionPlan } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import { Card } from '@alrehla/ui/card';
import { cn } from '@alrehla/ui/lib/utils';

interface SubscriptionSummaryProps {
  selectedPlan: SubscriptionPlan | null;
  isSubmitting: boolean;
  onSubmit: () => void | Promise<void>;
  step: string;
  features?: string[];
  shippingCost?: number;
  addonsCost?: number;
  selectedAddons?: string[];
  addonProducts?: PersonalizedProduct[];
  governorate?: string;
}

const defaultFeatures = [
  'قصة مخصصة جديدة كل شهر.',
  'أنشطة تفاعلية وألعاب تعليمية.',
  'هدية إضافية مختارة بعناية.',
];

const SubscriptionSummary: React.FC<SubscriptionSummaryProps> = ({
  selectedPlan,
  isSubmitting,
  onSubmit,
  step,
  features,
  shippingCost = 0,
  addonsCost = 0,
  selectedAddons = [],
  addonProducts = [],
  governorate,
}) => {
  const isConfirmStep = step === 'delivery';
  const displayFeatures =
    features && features.length > 0 && features.every((feature) => feature.trim() !== '')
      ? features
      : defaultFeatures;
  const planPrice = selectedPlan?.price || 0;
  const finalTotal = planPrice + shippingCost + addonsCost;
  const months = selectedPlan?.duration_months || 1;

  return (
    <Card className="rounded-2xl border bg-white p-6 shadow-lg">
      <h3 className="mb-4 flex items-center gap-2 border-b pb-3 text-xl font-bold text-gray-800">
        <Gift /> ملخص الاشتراك
      </h3>

      <div className="space-y-4 text-sm">
        <h4 className="font-bold text-gray-700">ماذا سأحصل عليه شهرياً؟</h4>
        <ul className="space-y-2 pr-2 text-gray-600">
          {displayFeatures.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check size={16} className="mt-1 shrink-0 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {selectedPlan && (
          <div className="mt-6 space-y-3 border-t pt-4">
            <div className="flex items-center justify-between text-gray-600">
              <span>الباقة المختارة:</span>
              <div className="text-left">
                <span className="block font-bold text-gray-800">{selectedPlan.name}</span>
                <span className="text-xs text-muted-foreground">({months} أشهر)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>سعر الباقة:</span>
              <span>{planPrice} ج.م</span>
            </div>

            {selectedAddons.length > 0 && (
              <div className="space-y-2 border-t border-dashed py-2">
                <p className="flex items-center gap-1 text-xs font-bold text-purple-700">
                  <Puzzle size={12} /> إضافات (مع أول صندوق):
                </p>
                {selectedAddons.map((addonKey) => {
                  const product = addonProducts.find((candidate) => candidate.key === addonKey);
                  if (!product) return null;

                  return (
                    <div key={addonKey} className="flex items-center justify-between text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Plus size={10} /> {product.title}
                      </span>
                      <span>{product.price_printed} ج.م</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between border-t border-dashed pt-1 text-sm font-semibold text-purple-800">
                  <span>مجموع الإضافات:</span>
                  <span>{addonsCost} ج.م</span>
                </div>
              </div>
            )}

            {shippingCost > 0 ? (
              <div className="flex items-start justify-between rounded bg-green-50 p-2 text-sm text-green-700">
                <span className="mt-0.5 flex items-center gap-1">
                  <Truck size={14} /> الشحن ({governorate}):
                </span>
                <div className="text-left">
                  <span className="block font-bold">{shippingCost} ج.م</span>
                  {months > 1 && (
                    <span className="block text-[10px] opacity-80">
                      ({shippingCost / months} ج.م × {months} شهور)
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>الشحن:</span>
                <span>{isConfirmStep ? 'مجاني / غير محدد' : 'يُحسب عند التوصيل'}</span>
              </div>
            )}

            <div className="my-2 border-t border-dashed" />
            <div className="flex items-center justify-between text-xl font-extrabold text-primary">
              <span>الإجمالي:</span>
              <span>{finalTotal} ج.م</span>
            </div>
          </div>
        )}
      </div>

      <Button
        type="button"
        onClick={onSubmit}
        disabled={!isConfirmStep || isSubmitting}
        className={cn('mt-6 w-full', !isConfirmStep && 'cursor-not-allowed')}
        loading={isSubmitting}
        icon={<Send />}
        variant="success"
      >
        {isSubmitting ? 'جاري الإضافة...' : 'أضف للسلة وأكمل'}
      </Button>
    </Card>
  );
};

export default SubscriptionSummary;
