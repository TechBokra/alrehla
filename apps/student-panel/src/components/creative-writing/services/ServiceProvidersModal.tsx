"use client";

import React from 'react';
import Modal from '@alrehla/ui/modal';
import { Button } from '@alrehla/ui/button';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import type { StandaloneService, Instructor } from '../../../lib/database.types';
import PageLoader from '@alrehla/ui/page-loader';
import Image from '@alrehla/ui/next-image';

interface ServiceProvidersModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: StandaloneService | null;
    onSelect: (service: StandaloneService, instructor: Instructor) => void;
}

const ProviderCard: React.FC<{ instructor: Instructor, price: number, onSelect: () => void }> = ({ instructor, price, onSelect }) => (
    <div className="p-4 border rounded-lg flex items-center justify-between gap-4 bg-background">
        <div className="flex items-center gap-3">
            <Image src={instructor.avatar_url || '/images/male-avatar.png'} alt={instructor.name} className="w-12 h-12 rounded-full"/>
            <div>
                <p className="font-bold">{instructor.name}</p>
                <p className="text-xs text-muted-foreground">{instructor.specialty}</p>
            </div>
        </div>
        <div className="text-center">
            <p className="font-bold text-lg text-primary">{price} ج.م</p>
            <Button size="sm" onClick={onSelect}>اختر</Button>
        </div>
    </div>
);

export const ServiceProvidersModal: React.FC<ServiceProvidersModalProps> = ({ isOpen, onClose, service, onSelect }) => {
    const { data, isLoading } = usePublicData();
    
    if (!service) return null;

    const providers = (data?.instructors || []).filter(
        (i: Instructor) => i.service_rates && i.service_rates[service.id]
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`مقدمو خدمة: ${service.name}`}
            size="2xl"
        >
            {isLoading ? <PageLoader /> : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                    {providers.length > 0 ? providers.map((instructor: Instructor) => {
                        const price = instructor.service_rates?.[service.id] ?? service.price;
                        return (
                            <ProviderCard 
                                key={instructor.id}
                                instructor={instructor}
                                price={price}
                                onSelect={() => onSelect(service, instructor)}
                            />
                        )
                    }) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="font-semibold">لا يوجد مدربون يقدمون هذه الخدمة حاليًا.</p>
                            <p className="text-sm mt-1">يرجى المحاولة مرة أخرى لاحقًا.</p>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};