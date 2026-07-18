
import React, { useMemo } from 'react';
import Link from 'next/link';
import { Calendar, ArrowLeft } from 'lucide-react';
import AdminSection from '../AdminSection';
import { Button } from '@alrehla/ui/button';

const AgendaWidget = React.forwardRef<HTMLElement, { bookings: any[], attachments: any[] } & React.HTMLAttributes<HTMLElement>>(
    ({ bookings, attachments, ...props }, ref) => {
    
    const todaysSessions = useMemo(() => {
        const today = new Date().toDateString();
        const sessions: any[] = [];
        bookings.forEach(booking => {
            booking.sessions?.forEach((session: any) => {
                if (new Date(session.session_date).toDateString() === today && session.status === 'upcoming') {
                    sessions.push({
                        ...session,
                        childName: booking.child_profiles?.name || 'طالب',
                        packageName: booking.package_name,
                    });
                }
            });
        });
        return sessions.sort((a,b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
    }, [bookings]);

    const recentAttachments = useMemo(() => {
        return [...attachments]
            .filter(att => att.uploader_role !== 'instructor')
            .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3)
            .map(att => {
                const booking = bookings.find(b => b.id === att.booking_id);
                return {
                    ...att,
                    childName: booking?.child_profiles?.name || 'طالب',
                };
            });
    }, [attachments, bookings]);


    return (
        <AdminSection ref={ref} title="أجندة اليوم والمهام العاجلة" icon={<Calendar />} {...props}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-bold mb-3">جلسات اليوم</h3>
                    {todaysSessions.length > 0 ? (
                        <div className="space-y-3">
                            {todaysSessions.map(session => (
                                <div key={session.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm">{session.childName}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(session.session_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} - {session.packageName}</p>
                                    </div>
                                    <Button as={Link} href={`/session/${session.id}`} size="sm" variant="outline">
                                        انضم
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">لا توجد جلسات مجدولة لهذا اليوم.</p>
                    )}
                </div>
                <div>
                    <h3 className="font-bold mb-3">أحدث مرفقات الطلاب (للمراجعة)</h3>
                    {recentAttachments.length > 0 ? (
                         <div className="space-y-3">
                            {recentAttachments.map(att => (
                                <div key={att.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm truncate max-w-[150px]">{att.file_name}</p>
                                        <p className="text-xs text-muted-foreground">من: {att.childName}</p>
                                    </div>
                                    <Button as={Link} href={`/journey/${att.booking_id}`} size="sm" variant="ghost">
                                        <span className="hidden sm:inline">مراجعة</span>
                                        <ArrowLeft size={16} className="sm:mr-1" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-sm text-muted-foreground py-4">لا توجد مرفقات جديدة.</p>
                    )}
                </div>
            </div>
        </AdminSection>
    );
});
AgendaWidget.displayName = "AgendaWidget";

export default AgendaWidget;
