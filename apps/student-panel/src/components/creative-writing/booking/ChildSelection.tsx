"use client";


import React, { useState } from 'react';
import { Link } from '@/lib/router-compat';
import type { ChildProfile } from '../../../lib/database.types';
import { UserPlus } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import Image from '@alrehla/ui/next-image';

interface ChildSelectionProps {
    childProfiles: ChildProfile[];
    onSelect: (child: ChildProfile) => void;
}

const ChildSelection: React.FC<ChildSelectionProps> = ({ childProfiles, onSelect }) => {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const handleSelect = (child: ChildProfile) => {
        setSelectedId(child.id);
        onSelect(child);
    };

    if (childProfiles.length === 0) {
        return (
            <div className="text-center py-12">
                <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">لم تقم بإضافة أطفال بعد</h3>
                <p className="mt-1 text-sm text-gray-500">
                    يرجى إضافة ملف طفل أولاً من المركز العائلي لتتمكن من حجز باقة له.
                </p>
                <div className="mt-6">
                    <Button as={Link} to="/account" state={{ defaultTab: 'familyCenter' }}>
                        الذهاب إلى المركز العائلي
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">لمن هذا الحجز؟</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {childProfiles.map(child => (
                    <button
                        key={child.id}
                        onClick={() => handleSelect(child)}
                        className={`p-4 border-2 rounded-2xl text-center transition-all flex flex-col items-center gap-2 hover:shadow-lg hover:border-blue-500 ${selectedId === child.id ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-200'}`}
                    >
                        <Image src={child.avatar_url || '/images/male-avatar.png'} alt={child.name} className="w-20 h-20 rounded-full mx-auto mb-3" />
                        <h3 className="font-bold">{child.name}</h3>
                        <p className="text-xs text-gray-500">{child.age} سنوات</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ChildSelection;
