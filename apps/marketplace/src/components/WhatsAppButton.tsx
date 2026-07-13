"use client";

import React from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { usePublicSettings } from '../hooks/queries/public/usePublicDataQuery';

const WhatsAppButton: React.FC = () => {
    const { data, isLoading } = usePublicSettings();
    const comms = data?.communicationSettings;

    if (isLoading) {
        return (
             <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-gray-400 rounded-full text-white shadow-lg">
                <Loader2 className="animate-spin" />
            </div>
        );
    }
    
    if (!comms?.whatsapp_number) {
        return null;
    }

    const phoneNumber = comms.whatsapp_number;
    const message = encodeURIComponent(comms.whatsapp_default_message || "مرحباً");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 group flex items-center justify-center w-16 h-16 bg-green-500 rounded-full text-white shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-110"
            aria-label="تواصل معنا عبر واتساب"
        >
            <MessageCircle size={32} />
            <span className="absolute bottom-full mb-2 right-0 px-3 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                واتساب
            </span>
        </a>
    );
};

export default WhatsAppButton;