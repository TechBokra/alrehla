
import React from 'react';
import { Check } from 'lucide-react';
import type { PersonalizedProduct } from '../../lib/database.types';
import Image from '@alrehla/ui/next-image';

interface AddonsSectionProps {
    addonProducts: PersonalizedProduct[];
    selectedAddons: string[];
    onToggle: (key: string) => void;
    deliveryType?: 'printed' | 'electronic';
}

const AddonsSection: React.FC<AddonsSectionProps> = React.memo(({ addonProducts, selectedAddons, onToggle, deliveryType = 'printed' }) => {
    if (addonProducts.length === 0) return null;

    const getPrice = (product: PersonalizedProduct): number | null => {
        return deliveryType === 'electronic' ? product.price_electronic : product.price_printed;
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">إضافات للقصة (اختياري)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addonProducts.map(product => {
                    const isSelected = selectedAddons.includes(product.key);
                    const price = getPrice(product);
                    return (
                        <div 
                            key={product.key} 
                            onClick={() => onToggle(product.key)} 
                            className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                            <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full border-2 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                {isSelected && <Check size={16} className="text-white" />}
                            </div>
                            <Image src={product.image_url || '/images/favicon.png'} alt={product.title} className="w-12 h-12 rounded-md bg-gray-100" objectFit="contain" />
                            <div className="flex-grow">
                                <h4 className="font-bold text-gray-800">{product.title}</h4>
                                <p className="text-sm text-gray-500">{product.description}</p>
                            </div>
                            {price !== null && <span className="font-bold text-lg text-blue-600">{price} ج.م</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
AddonsSection.displayName = "AddonsSection";

export default AddonsSection;
