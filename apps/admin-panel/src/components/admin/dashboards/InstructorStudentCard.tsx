
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import type { ScheduledSession, CreativeWritingPackage } from '../../../lib/database.types';
import Image from '@alrehla/ui/image';

interface StudentProfile {
    name: string;
    avatar_url: string | null;
}

interface Journey {
    id: string;
    package_name: string;
    status: string;
    sessions: ScheduledSession[];
    packageDetails?: CreativeWritingPackage;
}

const parseTotalSessions = (sessionString: string | undefined): number => {
    if (!sessionString) return 0;
    const match = sessionString.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
};

const InstructorStudentCard: React.FC<{ student: StudentProfile; journeys: Journey[] }> = ({ student, journeys }) => {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border hover:shadow-md transition-all duration-300 flex flex-col h-full group">
            {/* Header */}
            <div className="flex items-center gap-4 border-b pb-4 mb-4">
                <div className="relative">
                    <Image 
                        src={student.avatar_url || 'https://i.ibb.co/2S4xT8w/male-avatar.png'} 
                        alt={student.name} 
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-offset-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                    />
                </div>
                <div className="flex-grow min-w-0">
                    <h3 className="text-lg font-bold text-gray-800 truncate" title={student.name}>{student.name}</h3>
                    <p className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full w-fit mt-1">
                        {journeys.length} رحلات نشطة
                    </p>
                </div>
            </div>

            {/* Journeys List */}
            <div className="space-y-4 flex-grow">
                 {journeys.map(journey => {
                    const isConfirmed = journey.status === 'مؤكد' || journey.status === 'مكتمل';
                    
                    const totalSessions = parseTotalSessions(journey.packageDetails?.sessions);
                    const completedCount = journey.sessions.filter(s => s.status === 'completed').length;
                    const progress = totalSessions > 0 ? (completedCount / totalSessions) * 100 : 0;

                    return (
                        <div key={journey.id} className={`p-4 rounded-xl border transition-colors ${
                            isConfirmed ? 'bg-green-50/20 border-green-100' : 'bg-orange-50/20 border-orange-100'
                        }`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm line-clamp-1" title={journey.package_name}>{journey.package_name}</h4>
                                    <div className="mt-1">
                                        {isConfirmed ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700">
                                                <ShieldCheck size={10} /> نشط
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700">
                                                <Clock size={10} /> قيد المراجعة
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right bg-white px-2 py-1 rounded border shadow-sm">
                                    <span className="text-xs font-black font-mono">{completedCount}/{totalSessions || '?'}</span>
                                </div>
                            </div>

                            {/* Progress Bar - Only meaningful for confirmed journeys */}
                            {isConfirmed && (
                                <div className="w-full bg-white/50 rounded-full h-1.5 mb-4 overflow-hidden border border-white/20">
                                    <div 
                                        className="bg-green-500 h-full rounded-full transition-all duration-500 ease-out" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-gray-300/50">
                                <div className="flex -space-x-1.5 rtl:space-x-reverse overflow-hidden px-1">
                                    {journey.sessions.slice(0, 5).map((s, idx) => (
                                        <div key={s.id} className={`w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-bold shadow-sm ${
                                            s.status === 'completed' ? 'bg-green-500 text-white' : 'bg-white text-gray-400'
                                        }`}>
                                            {idx + 1}
                                        </div>
                                    ))}
                                </div>
                                
                                {isConfirmed ? (
                                    <Button as={Link} href={`/journey/${journey.id}`} size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-primary hover:text-primary hover:bg-white px-3 shadow-sm border border-transparent hover:border-primary/20">
                                        مساحة العمل <ArrowLeft size={10} className="mr-1" />
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    );
                 })}
            </div>
        </div>
    );
};

export default InstructorStudentCard;
