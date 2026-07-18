
import React, { useMemo, useState } from 'react';
import { Calendar, Clock, CheckCircle, BookOpen } from 'lucide-react';
import AdminSection from '../AdminSection';
import { WeeklyScheduleManager } from '../WeeklyScheduleManager';
import type { Instructor, ScheduledSession, CreativeWritingPackage, CreativeWritingBooking } from '../../../lib/database.types';
import { formatDate } from '../../../utils/helpers';
import Accordion from '@alrehla/ui/accordion';
import { Button } from '@alrehla/ui/button';
import RequestSessionChangeModal from './RequestSessionChangeModal';
import IntroductoryAvailabilityManager from './IntroductoryAvailabilityManager';

// Define strict type for the joined booking data
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
             <div className="space-y-3">
                {sortedSessions.map((session, index) => {
                    const statusInfo = getStatusInfo(session.status);
                    return (
                        <div key={session.id} className="p-3 bg-gray-50 rounded-lg flex flex-col sm:flex-row justify-between items-start gap-3">
                            <div className={`flex-grow ${statusInfo.style}`}>
                                <p className="font-bold">الجلسة {index + 1} / {totalSessions || '?'}</p>
                                <p className="text-sm">
                                    {formatDate(session.session_date)} - {new Date(session.session_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                             <div className="flex items-center gap-4 self-end sm:self-center">
                                 <span className="flex items-center gap-2 text-sm font-semibold">
                                    {statusInfo.icon} {statusInfo.text}
                                </span>
                                {session.status === 'upcoming' && (
                                    <Button size="sm" variant="outline" onClick={() => onSessionChangeRequest(session)}>
                                        طلب تغيير
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<ScheduledSession | null>(null);
    
     const activeJourneys = useMemo(() => 
        bookings.filter(b => b.status === 'مؤكد'),
     [bookings]);

    const handleOpenModal = (session: ScheduledSession) => {
        setSelectedSession(session);
        setIsModalOpen(true);
    };

    return (
        <>
            <RequestSessionChangeModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                session={selectedSession}
                childName={bookings.find(b => b.id === (selectedSession as any)?.booking_id)?.child_profiles?.name}
                instructor={instructor} // Pass instructor to validate schedule
            />
            <div className="space-y-8">
                <AdminSection title="إدارة الجلسات الحالية" icon={<Calendar />}>
                    <p className="text-sm text-gray-600 mb-6 -mt-2">
                        هنا يمكنك متابعة جلسات طلابك المجدولة وطلب تغييرها إذا لزم الأمر.
                    </p>
                    <div className="space-y-6">
                        {activeJourneys.length > 0 ? activeJourneys.map(journey => (
                           <JourneyScheduleCard 
                                key={journey.id} 
                                journey={journey}
                                onSessionChangeRequest={handleOpenModal}
                           />
                        )) : <p className="text-center text-gray-500 py-8">لا توجد رحلات نشطة حاليًا.</p>}
                    </div>
                </AdminSection>
                
                 <Accordion title="تعديل قالب التوافر الأسبوعي الثابت">
                    <div className="p-6 border-t">
                        <p className="text-sm text-gray-600 mb-4">
                           حدد الأيام والأوقات التي تكون فيها متاحاً "بشكل عام" أسبوعياً. سيتم استخدام هذا القالب لجدولة الاشتراكات الجديدة تلقائياً.
                        </p>
                        <WeeklyScheduleManager instructor={instructor} />
                    </div>
                </Accordion>

                 <Accordion title="مواعيد الجلسات التعريفية المجانية">
                    <div className="p-6 border-t">
                        <p className="text-sm text-gray-600 mb-4">
                            هذه المواعيد تظهر للعملاء الجدد الراغبين في التعرف عليك قبل الاشتراك.
                        </p>
                        <IntroductoryAvailabilityManager instructor={instructor} />
                    </div>
                </Accordion>
            </div>
        </>
    );
};

export default InstructorSchedulePanel;
