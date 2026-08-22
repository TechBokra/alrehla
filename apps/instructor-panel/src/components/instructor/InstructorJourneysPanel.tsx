import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import InstructorSection from './InstructorSection';
import InstructorStudentCard from './InstructorStudentCard';
import type { CreativeWritingBooking, ScheduledSession, CreativeWritingPackage } from '../../lib/database.types';

type EnrichedInstructorBooking = CreativeWritingBooking & {
    sessions: ScheduledSession[];
    packageDetails?: CreativeWritingPackage;
    child_profiles: { id: number; name: string; avatar_url: string | null } | null;
};

interface InstructorJourneysPanelProps {
    instructorBookings: EnrichedInstructorBooking[];
}

const InstructorJourneysPanel: React.FC<InstructorJourneysPanelProps> = ({ instructorBookings }) => {
    
    const students = useMemo(() => {
        const studentMap = new Map<number, { studentProfile: any, journeys: EnrichedInstructorBooking[] }>();
        
        (instructorBookings || []).forEach(booking => {
            if (!booking.child_profiles) return;
            const childId = booking.child_id;
            
            if (!studentMap.has(childId)) {
                studentMap.set(childId, {
                    studentProfile: booking.child_profiles,
                    journeys: [],
                });
            }
            studentMap.get(childId)!.journeys.push(booking);
        });

        return Array.from(studentMap.values());
    }, [instructorBookings]);

    return (
        <InstructorSection title="الطلاب ورحلاتهم التدريبية" icon={<BookOpen />}>
            {students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {students.map(({ studentProfile, journeys }) => (
                        <InstructorStudentCard 
                            key={studentProfile.id} 
                            student={studentProfile} 
                            journeys={journeys} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">لم يتم تعيين أي طلاب لك في رحلات تدريبية نشطة بعد.</p>
                </div>
            )}
        </InstructorSection>
    );
};

export default InstructorJourneysPanel;
