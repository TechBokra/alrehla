import React, { useMemo, useState } from 'react';
import { Calendar, Clock, CheckCircle, BookOpen } from 'lucide-react';
import InstructorSection from './InstructorSection';
import { WeeklyScheduleManager } from './WeeklyScheduleManager';
import type { Instructor, ScheduledSession, CreativeWritingPackage, CreativeWritingBooking } from '../../lib/database.types';
import { formatDate } from '../../utils/helpers';
import Accordion from '@alrehla/ui/accordion';
import { Button } from '@alrehla/ui/button';
import RequestSessionChangeModal from './RequestSessionChangeModal';
import IntroductoryAvailabilityManager from './IntroductoryAvailabilityManager';

type EnrichedInstructorBooking = CreativeWritingBooking & {
    sessions: ScheduledSession[];
    packageDetails?: CreativeWritingPackage;
    child_profiles: { name: string; avatar_url: string | null } | null;
    package_name: string;
};

interface InstructorSchedulePanelProps {
    instructor: Instructor;
    bookings: EnrichedInstructorBooking[];
}

const getStatusInfo = (status: string) => {
    switch (status) {
        case 'upcoming': return { text: 'قادمة', icon: <Clock size={16} className="text-blue-500" />, style: 'text-blue-800 font-semibold' };
        case 'completed': return { text: 'مكتملة', icon: <CheckCircle size={16} className="text-green-500" />, style: 'text-gray-500 line-through' };
        default: return { text: status, icon: <Clock size={16} className="text-gray-500" />, style: 'text-gray-500' };
    }
};

const parseTotalSessions = (sessionString: string | undefined): number => {
    if (!sessionString) return 0;
    const match = sessionString.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
};

const JourneyScheduleCard: React.FC<{ journey: EnrichedInstructorBooking; onSessionChangeRequest: (session: ScheduledSession) => void; }> = ({ journey, onSessionChangeRequest }) => {
    
    const sortedSessions = useMemo(() => 
        [...(journey.sessions || [])].sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime()),
    [journey.sessions]);
    
    const totalSessions = parseTotalSessions(journey.packageDetails?.sessions);
    const completedSessionsCount = sortedSessions.filter(s => s.status === 'completed').length;

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border">
            <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">رحلة الطالب: {journey.child_profiles?.name}</h3>
                    <p className="text-sm font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full inline-block mt-1">{journey.package_name}</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold">{completedSessionsCount}/{totalSessions || '?'}</p>
                    <p className="text-xs text-gray-500">جلسات مكتملة</p>
                </div>
            </div>

            {/* List of Sessions */}
            <div className="space-y-3">
                {sortedSessions.map((session, index) => {
                    const statusInfo = getStatusInfo(session.status);
                    const isUpcoming = session.status === 'upcoming';

                    return (
                        <div key={session.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 rounded-lg border bg-gray-50/50 hover:bg-gray-100/50 transition-colors gap-3 sm:gap-2">
                            <div className="flex items-center gap-3">
                                {statusInfo.icon}
                                <div>
                                    <span className="font-bold text-gray-700">الجلسة {index + 1}: </span>
                                    <span className="font-semibold text-gray-800">{formatDate(session.session_date)}</span>
                                    <span className="text-xs text-gray-500 mr-2">({new Date(session.session_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                                <span className={`text-xs px-2.5 py-1 rounded-full ${session.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
                                    {statusInfo.text}
                                </span>
                                
                                {isUpcoming && (
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => onSessionChangeRequest(session)}
                                        className="text-xs text-gray-600 hover:text-blue-600 border-gray-300"
                                    >
                                        طلب تعديل الموعد
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const InstructorSchedulePanel: React.FC<InstructorSchedulePanelProps> = ({ instructor, bookings }) => {
    const [selectedSessionForChange, setSelectedSessionForChange] = useState<{ session: ScheduledSession; childName: string } | null>(null);

    const activeBookings = useMemo(() => {
        return bookings.filter(b => b.status === 'مؤكد' && (b.sessions || []).some(s => s.status === 'upcoming'));
    }, [bookings]);

    const handleOpenChangeModal = (session: ScheduledSession, childName: string = 'الطالب') => {
        setSelectedSessionForChange({ session, childName });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* 1. إدارة الجدول الأسبوعي الأساسي */}
            <div className="space-y-4">
                <Accordion title="تعديل جدول التوفر الأسبوعي المعتمد">
                    <div className="p-4 bg-muted/20 rounded-lg">
                        <WeeklyScheduleManager instructor={instructor} />
                    </div>
                </Accordion>
                <Accordion title="مواعيد الجلسات التعريفية المتاحة">
                    <div className="p-4 bg-muted/20 rounded-lg">
                        <IntroductoryAvailabilityManager instructor={instructor} />
                    </div>
                </Accordion>
            </div>

            {/* 2. جداول الرحلات الحالية للطلاب */}
            <InstructorSection title="مواعيد الجلسات القادمة للطلاب المشتركين" icon={<BookOpen className="text-primary" />}>
                {activeBookings.length === 0 ? (
                    <p className="text-muted-foreground p-4 border rounded-xl text-center">لا توجد رحلات نشطة بمواعيد قادمة حالياً.</p>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {activeBookings.map(booking => (
                            <JourneyScheduleCard 
                                key={booking.id} 
                                journey={booking} 
                                onSessionChangeRequest={(session) => handleOpenChangeModal(session, booking.child_profiles?.name)}
                            />
                        ))}
                    </div>
                )}
            </InstructorSection>

            {/* Modal for Requesting Changes */}
            {selectedSessionForChange && (
                <RequestSessionChangeModal
                    isOpen={!!selectedSessionForChange}
                    onClose={() => setSelectedSessionForChange(null)}
                    session={selectedSessionForChange.session}
                    childName={selectedSessionForChange.childName}
                    instructor={instructor}
                />
            )}
        </div>
    );
};

export default InstructorSchedulePanel;
