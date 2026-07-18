"use client";


import React from 'react';
import { Gift, Check, Send, Truck, Puzzle, Plus } from 'lucide-react';
import type { SubscriptionPlan, PersonalizedProduct } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';

interface SubscriptionSummaryProps {
    selectedPlan: SubscriptionPlan | null;
    isSubmitting: boolean;
    onSubmit: () => void;
    step: string;
    features?: string[];
    shippingCost?: number;
    addonsCost?: number;
    selectedAddons?: string[];
    addonProducts?: PersonalizedProduct[];
    governorate?: string;
}

// Fallback features in case they are not loaded from the backend for some reason.
const defaultFeatures = [
    "قصة مخصصة جديدة كل شهر.",
    "أنشطة تفاعلية وألعاب تعليمية.",
    "هدية إضافية مختارة بعناية."
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
    governorate
}) => {
    
    const isConfirmStep = step === 'delivery';
    const displayFeatures = features && features.length > 0 && features.every(f => f.trim() !== '') ? features : defaultFeatures;
    
    // Calculate final total
    const planPrice = selectedPlan?.price || 0;
    const finalTotal = planPrice + shippingCost + addonsCost;
    const months = selectedPlan?.duration_months || 1;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border">
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b flex items-center gap-2">
                <Gift /> ملخص الاشتراك
            </h3>
            <div className="space-y-4 text-sm">
                <h4 className="font-bold text-gray-700">ماذا سأحصل عليه شهرياً؟</h4>
                <ul className="space-y-2 text-gray-600 pr-2">
                    {displayFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <Check size={16} className="text-green-500 mt-1 flex-shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            {selectedPlan && (
                 <div className="mt-6 pt-4 border-t space-y-3">
                    <div className="flex justify-between items-center text-gray-600">
                        <span>الباقة المختارة:</span>
                        <div className="text-left">
                             <span className="font-bold text-gray-800 block">{selectedPlan.name}</span>
                             <span className="text-xs text-muted-foreground">({months} أشهر)</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 text-sm">
                        <span>سعر الباقة:</span>
                        <span>{planPrice} ج.م</span>
                    </div>

                    {/* Addons Section */}
                    {selectedAddons.length > 0 && (
                        <div className="py-2 border-t border-dashed space-y-2">
                            <p className="text-xs font-bold text-purple-700 flex items-center gap-1">
                                <Puzzle size={12} /> إضافات (مع أول صندوق):
                            </p>
                            {selectedAddons.map(addonKey => {
                                const product = addonProducts.find(p => p.key === addonKey);
                                return product ? (
                                    <div key={addonKey} className="flex justify-between items-center text-xs text-gray-600">
                                        <span className="flex items-center gap-1"><Plus size={10} /> {product.title}</span>
                                        <span>{product.price_printed} ج.م</span>
                                    </div>
                                ) : null;
                            })}
                            <div className="flex justify-between items-center text-sm font-semibold text-purple-800 pt-1 border-t border-dashed">
                                <span>مجموع الإضافات:</span>
                                <span>{addonsCost} ج.م</span>
                            </div>
                        </div>
                    )}
                    
                    {shippingCost > 0 ? (
                        <div className="flex justify-between items-start text-green-700 text-sm bg-green-50 p-2 rounded">
                            <span className="flex items-center gap-1 mt-0.5"><Truck size={14}/> الشحن ({governorate}):</span>
                            <div className="text-left">
                                <span className="font-bold block">{shippingCost} ج.م</span>
                                {months > 1 && (
                                    <span className="text-[10px] block opacity-80">
                                        ({shippingCost / months} ج.م × {months} شهور)
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center text-muted-foreground text-sm">
                            <span>الشحن:</span>
                            <span>{isConfirmStep ? 'مجاني / غير محدد' : 'يُحسب عند التوصيل'}</span>
                        </div>
                    )}

                    <div className="border-t border-dashed my-2"></div>

                    <div className="flex justify-between items-center text-xl font-extrabold text-primary">
                        <span>الإجمالي:</span>
                        <span>{finalTotal} ج.م</span>
                    </div>
                </div>
            )}
             <Button 
                onClick={onSubmit}
                disabled={!isConfirmStep || isSubmitting}
                className="mt-6 w-full"
                loading={isSubmitting}
                icon={<Send />}
                variant="success"
            >
                {isSubmitting ? 'جاري الإضافة...' : 'أضف للسلة وأكمل'}
            </Button>
        </div>
    );
};

export default SubscriptionSummary;
