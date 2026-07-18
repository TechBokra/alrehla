"use client";


import React from 'react';
import { Package, User, Palette, Sparkles, Image as ImageIcon } from 'lucide-react';
import type { PersonalizedProduct } from '../../lib/database.types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@alrehla/ui/card';
import Image from '@alrehla/ui/next-image';

interface StoryGoal {
  key: string;
  title: string;
}

interface InteractivePreviewProps {
    formData: {
        childName: string;
        childTraits: string;
        storyValue: string;
        customGoal: string;
    };
    product: PersonalizedProduct | null;
    basePrice: number;
    addons: { key: string; title: string; price: number }[];
    totalPrice: number;
    shippingPrice: number;
    imagePreviewUrl: string | null;
    storyGoals: StoryGoal[];
}

const InteractivePreview: React.FC<InteractivePreviewProps> = ({ formData, product, basePrice, addons, totalPrice, shippingPrice, imagePreviewUrl, storyGoals }) => {
    const { childName } = formData;
    
    if (!product) {
        return null; 
    }
    
    const getGoalTitle = () => {
        // Only show goal if config is NOT none
        if (product.goal_config !== 'none') {
            const predefinedGoal = (storyGoals || []).find(v => v.key === formData.storyValue)?.title;
            return formData.storyValue === 'custom' ? formData.customGoal : predefinedGoal;
        }
        return null;
    };

    const goalTitle = getGoalTitle();
    const goalIcon = <Sparkles size={18}/>;
    const finalTotal = totalPrice + shippingPrice;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                   <Package className="text-primary" />
                   ملخص الطلب
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-base font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <User size={16} />
                        بطل القصة
                    </h3>
                    <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center gap-3">
                         <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                            {imagePreviewUrl ? (
                                <Image src={imagePreviewUrl} alt="Preview" className="h-full w-full" />
                            ) : (
                                <ImageIcon className="text-muted-foreground" size={40} />
                            )}
                        </div>
                        <p className="text-2xl font-bold text-primary text-center">
                            {childName || 'اسم الطفل'}
                        </p>
                    </div>
                </div>

                {/* Dynamic Text Fields Preview */}
                {product.text_fields?.map(field => field.required && formData[field.id] && (
                     <div key={field.id}>
                        <h3 className="text-base font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                            <Palette size={16} />
                            {field.label.replace('*','')}
                        </h3>
                        <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{formData[field.id]}</p>
                    </div>
                ))}
                
                {/* Goal Preview - Only if applicable */}
                {goalTitle && (
                    <div>
                        <h3 className="text-base font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                            {goalIcon}
                            الهدف من القصة
                        </h3>
                        <p className="text-md text-foreground font-semibold bg-muted/50 p-3 rounded-lg text-center">
                           {goalTitle}
                        </p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex-col items-stretch space-y-2 border-t pt-6">
                <div className="flex justify-between items-center text-muted-foreground text-sm">
                    <span>{product.title}</span>
                    <span className="font-semibold">{basePrice} ج.م</span>
                </div>
                {addons.map(addon => (
                    <div key={addon.key} className="flex justify-between items-center text-muted-foreground text-sm animate-fadeIn">
                        <span>+ {addon.title}</span>
                        <span className="font-semibold">{addon.price} ج.م</span>
                    </div>
                ))}
                 {shippingPrice > 0 && (
                    <div className="flex justify-between items-center text-muted-foreground text-sm animate-fadeIn">
                        <span>الشحن</span>
                        <span className="font-semibold">{shippingPrice} ج.م</span>
                    </div>
                )}
                <div className="border-t my-2"></div>
                <div className="flex justify-between items-center text-xl font-bold text-foreground">
                    <span>الإجمالي</span>
                    <span>{finalTotal} ج.م</span>
                </div>
            </CardFooter>
        </Card>
    );
};

export default React.memo(InteractivePreview);
