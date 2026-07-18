"use client";

import React from 'react';
import { Feather, Globe2, Trophy, Search, Award } from 'lucide-react';
import type { Badge } from '../../lib/database.types';

interface BadgeDisplayProps {
    badge: Badge;
    size?: 'md' | 'lg';
}

const IconMap: { [key: string]: React.ReactNode } = {
    'Feather': <Feather className="w-full h-full" />,
    'Globe2': <Globe2 className="w-full h-full" />,
    'Trophy': <Trophy className="w-full h-full" />,
    'Search': <Search className="w-full h-full" />,
    'default': <Award className="w-full h-full" />,
};

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badge, size = 'md' }) => {
    const sizeClasses = size === 'md' ? 'w-16 h-16 p-3' : 'w-20 h-20 p-4';
    
    return (
        <div className="relative group flex flex-col items-center">
            <div className={`bg-yellow-100 text-yellow-500 rounded-full border-4 border-yellow-200 ${sizeClasses}`}>
                {IconMap[badge.icon_name] || IconMap.default}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 text-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <p className="font-bold">{badge.name}</p>
                <p className="mt-1">{badge.description}</p>
                <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
                    <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
                </svg>
            </div>
        </div>
    );
};

export default BadgeDisplay;