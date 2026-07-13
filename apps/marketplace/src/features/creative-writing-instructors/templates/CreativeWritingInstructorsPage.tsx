"use client";

import React from 'react';
import { Link } from '@/lib/router-compat';
import { Loader2 } from 'lucide-react';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import type { Instructor } from '../../../lib/database.types';
import Image from '../../../components/ui/Image';

const SkeletonInstructorCard: React.FC = () => (
    <div className="bg-white rounded-2xl p-6 text-center border flex flex-col items-center shadow-lg animate-pulse">
        <div className="w-24 h-24 rounded-full bg-gray-200 mb-4"></div>
        <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-40 bg-gray-200 rounded mb-4"></div>
        <div className="h-10 w-full bg-gray-200 rounded-full mt-auto"></div>
    </div>
);

const InstructorCard: React.FC<{ instructor: Instructor }> = ({ instructor }) => {
    return (
        <div className="bg-white rounded-2xl p-6 text-center border flex flex-col items-center transform hover:-translate-y-2 transition-transform duration-300 shadow-lg">
            <Image 
                src={instructor.avatar_url || '/images/male-avatar.png'} 
                alt={instructor.name} 
                className="w-24 h-24 mb-4 rounded-full object-cover ring-4 ring-blue-100 shadow-md"
            />
            <h3 className="text-xl font-bold text-gray-800">{instructor.name}</h3>
            <p className="text-blue-600 font-semibold mb-4 flex-grow text-sm">{instructor.specialty}</p>
            <Link 
                to={`/instructor/${instructor.slug}`}
                className="mt-auto w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-700 transition-colors"
            >
                عرض الملف الشخصي
            </Link>
        </div>
    );
};

const CreativeWritingInstructorsPage: React.FC = () => {
    const { data, isLoading, error } = usePublicData();
    const instructors = data?.instructors || [];
    const content = data?.siteContent?.creativeWritingPage.instructors;

    return (
         <div className="bg-gray-50 py-16 sm:py-20 animate-fadeIn">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-600">{content?.heroTitle}</h1>
                    <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600">
                        {content?.heroSubtitle}
                    </p>
                </div>

                {error ? (
                    <div className="text-center text-red-500 text-lg bg-red-50 p-6 rounded-lg">{error.message}</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => <SkeletonInstructorCard key={index} />)
                        ) : (
                            instructors.map(instructor => (
                               <InstructorCard key={instructor.id} instructor={instructor} />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreativeWritingInstructorsPage;
