"use client";


import React, { useState } from 'react';
import type { Instructor, CreativeWritingPackage } from '../../../lib/database.types';
import { cn } from '../../../lib/utils';
import { calculateCustomerPrice } from '../../../utils/pricingCalculator';
import { Eye, UserCheck, PlayCircle, BookOpen, Quote } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import Modal from '@alrehla/ui/modal';
import Image from '@alrehla/ui/next-image';

interface InstructorSelectionProps {
    instructors: Instructor[];
    onSelect: (instructor: Instructor) => void;
    selectedPackage: CreativeWritingPackage | null;
    pricingConfig: any;
}

const InstructorSelection: React.FC<InstructorSelectionProps> = ({ instructors, onSelect, selectedPackage, pricingConfig }) => {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [viewedInstructor, setViewedInstructor] = useState<Instructor | null>(null);

    const handleSelect = (instructor: Instructor) => {
        setSelectedId(instructor.id);
        onSelect(instructor);
        setViewedInstructor(null); // Close modal if open
    };

    const getYoutubeId = (url: string | undefined) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <div className="animate-fadeIn">
            {/* Instructor Details Modal */}
            <Modal
                isOpen={!!viewedInstructor}
                onClose={() => setViewedInstructor(null)}
                title={viewedInstructor ? `الملف الشخصي: ${viewedInstructor.name}` : ''}
                size="xl"
                footer={
                    <div className="flex w-full gap-3">
                         <Button variant="ghost" onClick={() => setViewedInstructor(null)}>إغلاق</Button>
                         <Button 
                            onClick={() => viewedInstructor && handleSelect(viewedInstructor)} 
                            className="flex-1"
                            icon={<UserCheck size={18} />}
                        >
                            اختيار هذا المدرب
                        </Button>
                    </div>
                }
            >
                {viewedInstructor && (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-right border-b pb-6">
                            <Image 
                                src={viewedInstructor.avatar_url || '/images/male-avatar.png'} 
                                alt={viewedInstructor.name} 
                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md"
                            />
                            <div className="flex-1 space-y-2">
                                <h3 className="text-2xl font-bold text-gray-900">{viewedInstructor.name}</h3>
                                <p className="text-primary font-semibold text-lg">{viewedInstructor.specialty}</p>
                                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                    {viewedInstructor.expertise_areas?.map((area, idx) => (
                                        <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{area}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bio & Philosophy */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><BookOpen size={18} className="text-blue-500"/> نبذة تعريفية</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border">
                                        {viewedInstructor.bio}
                                    </p>
                                </div>
                                {viewedInstructor.teaching_philosophy && (
                                    <div>
                                        <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><Quote size={18} className="text-purple-500"/> فلسفتي في التدريب</h4>
                                        <p className="text-gray-600 text-sm leading-relaxed italic">
                                            "{viewedInstructor.teaching_philosophy}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Video */}
                            <div>
                                {viewedInstructor.intro_video_url && getYoutubeId(viewedInstructor.intro_video_url) ? (
                                    <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
                                        <div className="aspect-video relative bg-black">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={`https://www.youtube.com/embed/${getYoutubeId(viewedInstructor.intro_video_url)}`}
                                                title="Intro Video"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                        <div className="p-2 bg-white text-center text-xs font-semibold text-gray-500">
                                            فيديو تعريفي
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed">
                                        <PlayCircle className="text-gray-300 w-12 h-12 mb-2" />
                                        <p className="text-gray-400 text-sm">لا يوجد فيديو تعريفي</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* List */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {instructors.map(instructor => {
                    // حساب السعر الخاص بهذا المدرب لهذه الباقة
                    const netPrice = selectedPackage 
                        ? (instructor.package_rates?.[selectedPackage.id] ?? selectedPackage.price) 
                        : 0;
                    
                    const finalPrice = calculateCustomerPrice(netPrice, pricingConfig);
                    const isSelected = selectedId === instructor.id;

                    return (
                        <div
                            key={instructor.id}
                            className={cn(
                                'flex flex-col p-4 border-2 rounded-2xl text-center transition-all hover:shadow-lg relative group bg-white',
                                 isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                            )}
                        >
                            <div className="relative mx-auto mb-3">
                                <Image 
                                    src={instructor.avatar_url || '/images/male-avatar.png'} 
                                    alt={instructor.name} 
                                    className="w-20 h-20 rounded-full"
                                />
                                {isSelected && (
                                    <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1 border-2 border-white">
                                        <UserCheck size={12} />
                                    </div>
                                )}
                            </div>
                            
                            <h3 className="font-bold text-foreground line-clamp-1">{instructor.name}</h3>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{instructor.specialty}</p>
                            
                            {selectedPackage && (
                                <div className="mb-4 pt-2 border-t border-dashed w-full">
                                    <p className="text-[10px] text-muted-foreground mb-0.5">سعر الباقة:</p>
                                    <p className="font-extrabold text-primary text-lg">
                                        {finalPrice === 0 ? 'مجانية' : `${finalPrice} ج.م`}
                                    </p>
                                </div>
                            )}

                            <div className="mt-auto grid grid-cols-2 gap-2 w-full">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={(e) => { e.stopPropagation(); setViewedInstructor(instructor); }}
                                    className="h-8 px-0 text-xs"
                                    title="عرض الملف"
                                >
                                    <Eye size={14} className="mr-1"/> ملفه
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant={isSelected ? "default" : "secondary"}
                                    onClick={() => handleSelect(instructor)}
                                    className="h-8 px-0 text-xs"
                                >
                                    {isSelected ? 'مختار' : 'اختار'}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InstructorSelection;
