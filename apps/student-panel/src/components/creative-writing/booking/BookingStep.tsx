"use client";

import React from 'react';
import { Check } from 'lucide-react';

interface BookingStepProps {
    title: string;
    stepNumber: number;
    isActive: boolean;
    isComplete: boolean;
}

const BookingStep: React.FC<BookingStepProps> = ({ title, stepNumber, isActive, isComplete }) => {
    const baseClasses = "w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg transition-all";
    const statusClasses = isComplete 
        ? "bg-green-500 text-white" 
        : isActive 
        ? "bg-blue-600 text-white ring-4 ring-blue-200" 
        : "bg-gray-200 text-gray-500";
    
    return (
        <div className="flex flex-col items-center text-center">
            <div className={`${baseClasses} ${statusClasses}`}>
                {isComplete ? <Check /> : stepNumber}
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-semibold ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {title}
            </p>
        </div>
    );
};

export default BookingStep;