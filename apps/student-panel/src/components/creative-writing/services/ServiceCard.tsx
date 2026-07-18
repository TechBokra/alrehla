"use client";


import React from 'react';
import type { StandaloneService } from '../../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import { IconMap } from './IconMap';

interface ServiceCardProps {
    service: StandaloneService;
    minPrice: number;
    maxPrice: number;
    onViewProviders: () => void;
    onOrderNow: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, minPrice, maxPrice, onViewProviders, onOrderNow }) => {
    
    const renderPrice = () => {
        if (minPrice === maxPrice) {
            return (
                <>
                    {service.provider_type === 'company' ? 'السعر' : 'يبدأ من'}
                    <span className="text-2xl font-extrabold text-gray-800 mx-1">{minPrice}</span>
                    ج.م
                </>
            );
        }

        return (
            <>
                <span className="text-xl font-extrabold text-gray-800">{minPrice} - {maxPrice}</span>
                <span className="text-lg font-medium text-gray-600 ml-1">ج.م</span>
            </>
        );
    };
    
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border flex flex-col h-full transform hover:-translate-y-2 transition-transform duration-300">
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full text-blue-600">
                    {IconMap[service.icon_name] || IconMap.default}
                </div>
                <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
            </div>
            <p className="text-gray-600 text-sm flex-grow">{service.description}</p>
            <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-500">
                    {renderPrice()}
                </p>
                 {service.provider_type === 'instructor' ? (
                    <Button onClick={onViewProviders} size="sm">
                        عرض مقدمي الخدمة
                    </Button>
                ) : (
                    <Button onClick={onOrderNow} size="sm">
                        اطلب الآن
                    </Button>
                )}
            </div>
        </div>
    );
};
