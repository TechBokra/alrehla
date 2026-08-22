import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Clock, CheckCircle2, AlertCircle, Calendar, Globe, ExternalLink, Plus } from 'lucide-react';
import { Card, CardContent } from '@alrehla/ui/card';
import { Button } from '@alrehla/ui/button';
import { formatDate, formatTime, generateGoogleCalendarUrl } from '../../utils/helpers';
import RequestSessionChangeModal from './RequestSessionChangeModal';
import GoogleCalendarSyncModal from './GoogleCalendarSyncModal';
import { ScheduledSession } from '../../lib/database.types';
import { getMarketplaceUrl } from '../../lib/marketplaceUrl';

const createNavigate = (router: ReturnType<typeof useRouter>) => (
    href: string | number,
    options?: { replace?: boolean },
) => {
    if (typeof href === 'number') {
        router.back();
        return;
    }

    const target = href || '/';
    if (options?.replace) router.replace(target);
    else router.push(target);
};

export interface WidgetSession extends ScheduledSession {
    child_name?: string;
    package_name?: string;
}

interface WeeklySessionsWidgetProps {
    sessions: WidgetSession[];
    instructorName: string;
}

const WeeklySessionsWidget: React.FC<WeeklySessionsWidgetProps> = ({ sessions, instructorName }) => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const [rescheduleModalSession, setRescheduleModalSession] = useState<WidgetSession | null>(null);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

    const weekData = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = now.getDay(); 
        const diff = (day === 6 ? 0 : day + 1);
        startOfWeek.setDate(now.getDate() - diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const currentWeekSessions = (sessions || []).filter(s => {
            const sDate = new Date(s.session_date);
            return sDate >= startOfWeek && sDate <= endOfWeek;
        });

        const pastNeedsAction = currentWeekSessions.filter(s => 
            new Date(s.session_date) < now && s.status === 'upcoming'
        );

        const todayStr = now.toDateString();
        const todaySessions = currentWeekSessions.filter(s => 
             new Date(s.session_date) >= now && new Date(s.session_date).toDateString() === todayStr
        ).sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();

        const upcomingSessions = currentWeekSessions.filter(s => {
            const sDate = new Date(s.session_date);
            return sDate >= now && sDate.toDateString() !== todayStr;
        }).sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

        return { pastNeedsAction, todaySessions, upcomingSessions, startOfWeek, endOfWeek };
    }, [sessions]);

    const handleAddToGoogleCalendar = (session: WidgetSession) => {
        const url = generateGoogleCalendarUrl(
            `جلسة: ${session.child_name || 'طالب'} - ${session.package_name}`,
            `جلسة تدريبية مع الطالب ${session.child_name}.\nرابط الجلسة: ${getMarketplaceUrl(`/session/${session.id}`)}`,
            session.session_date
        );
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
            <GoogleCalendarSyncModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                sessions={sessions}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <CalendarDays className="text-primary" /> جدول الأسبوع الحالي
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span className="bg-gray-100 px-2 py-1 rounded-md border">{formatDate(weekData.startOfWeek.toISOString())}</span>
                        <span className="text-gray-300">➜</span>
                        <span className="bg-gray-100 px-2 py-1 rounded-md border">{formatDate(weekData.endOfWeek.toISOString())}</span>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1 font-bold text-indigo-600"><Globe size={12}/> توقيت القاهرة</span>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsSyncModalOpen(true)} className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                    <Calendar size={16} /> ربط Google Calendar
                </Button>
            </div>

            {/* 1. المهام المعلقة (فائتة) */}
            {weekData.pastNeedsAction.length > 0 && (
                <div className="animate-fadeIn">
                    <h3 className="text-xs font-black text-red-600 mb-3 flex items-center gap-2 uppercase tracking-widest">
                        <AlertCircle size={14} /> إجراء مطلوب (جلسات فائتة)
                    </h3>
                    <div className="space-y-3">
                        {weekData.pastNeedsAction.map(session => (
                            <div key={session.id} className="border-l-4 border-l-red-500 bg-white p-4 rounded-r-xl shadow-sm border-t border-b border-r flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="bg-red-50 p-2 rounded-lg text-center min-w-[60px]">
                                        <span className="block text-xl font-black text-red-600">{new Date(session.session_date).getDate()}</span>
                                        <span className="block text-[10px] text-red-400 font-bold uppercase">{new Date(session.session_date).toLocaleDateString('en-US', {weekday:'short'})}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{session.child_name || 'طالب'}</p>
                                        <p className="text-xs text-muted-foreground">{session.package_name}</p>
                                        <p className="text-xs text-red-600 font-bold mt-1">
                                            {formatTime(session.session_date)} (فات الموعد)
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <Button size="sm" variant="success" className="h-8 text-xs font-bold w-full md:w-auto" onClick={() => navigate(`/session-report/${session.id}`)}>
                                        إرسال التقرير
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 text-xs text-red-600 hover:bg-red-50 w-full md:w-auto" onClick={() => setRescheduleModalSession(session)}>
                                        إلغاء/تأجيل
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2. جلسات اليوم */}
                <div>
                     <h3 className="text-sm font-bold text-green-700 mb-4 flex items-center gap-2 bg-green-50 w-fit px-3 py-1 rounded-full border border-green-200">
                        <Clock size={16} /> جلسات اليوم
                    </h3>
                    {weekData.todaySessions.length > 0 ? (
                        <div className="space-y-4">
                            {weekData.todaySessions.map(session => (
                                <Card key={session.id} className="border-green-200 shadow-md overflow-hidden group">
                                    <div className="bg-green-600 h-1 w-full"></div>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                                 <div className="text-center min-w-[50px]">
                                                    <span className="block text-2xl font-black text-gray-800">{formatTime(session.session_date)}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Today</span>
                                                </div>
                                                <div className="border-r pr-3 mr-1">
                                                    <p className="font-bold text-gray-900">{session.child_name}</p>
                                                    <p className="text-xs text-gray-500">{session.package_name}</p>
                                                </div>
                                            </div>
                                            <Button size="icon" variant="ghost" onClick={() => handleAddToGoogleCalendar(session)} title="Google Calendar">
                                                <Plus size={16} className="text-gray-400 hover:text-green-600"/>
                                            </Button>
                                        </div>
                                        <div className="mt-4 pt-4 border-t flex justify-end">
                                             <a
                                                href={getMarketplaceUrl(`/session/${session.id}`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-md shadow-lg w-full transition-colors"
                                            >
                                                <ExternalLink size={14}/>
                                                بدء الجلسة
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-2xl bg-gray-50">
                            <CheckCircle2 className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500 font-medium">لا توجد جلسات أخرى اليوم.</p>
                        </div>
                    )}
                </div>

                {/* 3. باقي الأسبوع */}
                <div>
                     <h3 className="text-sm font-bold text-blue-700 mb-4 flex items-center gap-2 bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-200">
                        <Calendar size={16} /> القادم هذا الأسبوع
                    </h3>
                    {weekData.upcomingSessions.length > 0 ? (
                        <div className="space-y-3">
                            {weekData.upcomingSessions.map(session => (
                                <div key={session.id} className="flex items-center justify-between p-3 bg-white rounded-xl border hover:border-blue-300 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex flex-col items-center justify-center border border-blue-100">
                                            <span className="text-sm font-black leading-none">{new Date(session.session_date).getDate()}</span>
                                            <span className="text-[8px] font-bold uppercase">{new Date(session.session_date).toLocaleDateString('en-US', {weekday:'short'})}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 mb-0.5">{formatTime(session.session_date)}</p>
                                            <p className="text-sm font-bold text-gray-800">{session.child_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddToGoogleCalendar(session)}>
                                            <Plus size={14}/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRescheduleModalSession(session)}>
                                            <Clock size={14}/>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-10 border-2 border-dashed rounded-2xl bg-gray-50">
                            <p className="text-sm text-gray-500 font-medium">جدولك لباقي الأسبوع فارغ.</p>
                        </div>
                    )}
                </div>
            </div>

            {rescheduleModalSession && (
                <RequestSessionChangeModal 
                    isOpen={!!rescheduleModalSession}
                    onClose={() => setRescheduleModalSession(null)}
                    session={rescheduleModalSession}
                    childName={rescheduleModalSession.child_name}
                />
            )}
        </div>
    );
};

export default WeeklySessionsWidget;
