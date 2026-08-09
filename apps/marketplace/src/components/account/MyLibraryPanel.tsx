"use client";


import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Star, BookOpen, CreditCard, ArrowLeft, ChevronLeft, ChevronRight, Calendar, Package } from 'lucide-react';
import { useUserAccountData } from '../../hooks/queries/user/useUserDataQuery';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, daysInMonth } from '../../utils/helpers';
import EmptyState from './EmptyState';
import { Button } from '@alrehla/ui/button';
import type { Order, Subscription, CreativeWritingBooking, ScheduledSession, CreativeWritingPackage } from '../../lib/database.types';
import StatusBadge from '@alrehla/ui/status-badge';
import { Card, CardContent } from '@alrehla/ui/card';

type EnrichedBooking = CreativeWritingBooking & {
    sessions: ScheduledSession[];
    packageDetails: CreativeWritingPackage | undefined;
    instructorName: string;
};

const JourneyCalendarView: React.FC<{ journey: EnrichedBooking }> = ({ journey }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { packageDetails, sessions, instructorName } = journey;

    const getTotalSessionsCount = (pkg: CreativeWritingPackage | undefined) => {
        if (!pkg) return 0;
        if (pkg.name.includes('التعريفية') || pkg.sessions.includes('واحدة')) return 1;
        const match = pkg.sessions.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    };

    const totalSessions = getTotalSessionsCount(packageDetails);
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const upcomingSessions = sessions.filter(s => s.status === 'upcoming')
        .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
    const nextSession = upcomingSessions[0];

    const monthName = currentDate.toLocaleString('ar-EG', { month: 'long' });
    const year = currentDate.getFullYear();

    const getSessionForDay = (day: number) => {
        return sessions.find(s => {
            const sessionDate = new Date(s.session_date);
            return sessionDate.getFullYear() === currentDate.getFullYear() &&
                   sessionDate.getMonth() === currentDate.getMonth() &&
                   sessionDate.getDate() === day;
        });
    };

    // Saturday Start Configuration
    const dayNames = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
    const daysArray = Array.from({ length: daysInMonth(currentDate) }, (_, i) => i + 1);

    // Helper to get first day index (0=Sun, ..., 6=Sat)
    const getFirstDayIndex = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Offset for Saturday Start: (day + 1) % 7
    const startingDay = (getFirstDayIndex(currentDate) + 1) % 7;

    return (
        <Card className="border shadow-sm overflow-hidden h-full flex flex-col hover:shadow-md transition-all duration-300">
            <div className="bg-purple-50/50 p-4 border-b flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-white border border-purple-100 text-purple-600 rounded-xl shadow-sm">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 line-clamp-1" title={packageDetails?.name}>{packageDetails?.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                            مع {instructorName}
                        </p>
                    </div>
                </div>
                <div className="bg-white px-2 py-1 rounded text-xs font-bold border shadow-sm">
                    {completedSessions.length}/{totalSessions || '?'}
                </div>
            </div>

            <CardContent className="p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-4 bg-gray-50 p-2 rounded-lg">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 rounded-full hover:bg-white hover:shadow-sm transition-all"><ChevronRight size={16} /></button>
                    <span className="font-bold text-sm">{monthName} {year}</span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 rounded-full hover:bg-white hover:shadow-sm transition-all"><ChevronLeft size={16} /></button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-gray-400 mb-2">
                    {dayNames.map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-4">
                    {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                    {daysArray.map(day => {
                        const session = getSessionForDay(day);
                        const isNext = nextSession && new Date(nextSession.session_date).toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                        let dayClass = 'text-gray-500 hover:bg-gray-50';

                        if (session) {
                            dayClass = session.status === 'completed'
                                ? 'bg-green-500 text-white shadow-sm'
                                : 'bg-blue-100 text-blue-700 border border-blue-200';
                        }
                        if (isNext) {
                            dayClass = 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200 ring-offset-1 font-bold animate-pulse';
                        }

                        return (
                            <div key={day} className={`aspect-square flex items-center justify-center rounded-lg transition-all text-xs cursor-default ${dayClass}`}>
                                {day}
                            </div>
                        )
                    })}
                </div>

                <div className="mt-auto pt-4 border-t">
                    <Button asChild variant="outline" className="w-full justify-between group hover:border-purple-300 hover:bg-purple-50">
                        <Link href={`/journey/${journey.id}`}>
                            <span className="text-xs">دخول مساحة العمل</span>
                            <ArrowLeft size={14} className="text-purple-500 group-hover:-translate-x-1 transition-transform rtl:group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


interface MyLibraryPanelProps {
    onPay: (item: { id: string; type: 'order' | 'subscription' | 'booking' }) => void;
}

const MyLibraryPanel: React.FC<MyLibraryPanelProps> = ({ onPay }) => {
    const router = useRouter();
    const { data } = useUserAccountData();
    const { childProfiles } = useAuth();
    const { userOrders: orders = [], userSubscriptions: subscriptions = [], userBookings: bookings = [] } = data || {};
    const [activeTab, setActiveTab] = useState<'enha-lak' | 'creative-writing'>('enha-lak');

    const enhaLakItemsExist = orders.length > 0 || subscriptions.length > 0;

    const bookingsByChild = useMemo(() => {
        const map = new Map<number, { childName: string, journeys: EnrichedBooking[] }>();
        (bookings as EnrichedBooking[]).forEach((booking: EnrichedBooking) => {
            const child = childProfiles.find(c => c.id === booking.child_id);
            if(child){
                if (!map.has(child.id)) {
                    map.set(child.id, { childName: child.name, journeys: [] });
                }
                map.get(child.id)!.journeys.push(booking);
            }
        });
        return Array.from(map.values());
    }, [bookings, childProfiles]);

    const creativeWritingItemsExist = bookings.length > 0;
    const subscriptionStatusPresentation = {
        active: { label: 'نشط', variant: 'success' as const },
        paused: { label: 'متوقف مؤقتاً', variant: 'warning' as const },
        cancelled: { label: 'ملغي', variant: 'destructive' as const },
        pending_payment: { label: 'بانتظار الدفع', variant: 'muted' as const },
        pending_review: { label: 'الإيصال قيد المراجعة', variant: 'info' as const },
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg min-h-[600px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                    <BookOpen className="text-primary" /> مكتبتي التعليمية
                </h2>
                <div className="flex p-1 bg-gray-100 rounded-xl">
                    <button
                        onClick={() => setActiveTab('enha-lak')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'enha-lak' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <span className="flex items-center gap-2"><ShoppingBag size={16} /> إنها لك</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('creative-writing')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'creative-writing' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <span className="flex items-center gap-2"><BookOpen size={16} /> بداية الرحلة</span>
                    </button>
                </div>
            </div>

            <div className="animate-fadeIn">
                {activeTab === 'enha-lak' && (
                    <div className="space-y-8">
                        {enhaLakItemsExist ? (
                            <>
                                {subscriptions.length > 0 && (
                                    <section>
                                        <h3 className="text-lg font-bold text-gray-700 mb-4 border-r-4 border-orange-400 pr-3">الاشتراكات</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {subscriptions.map((sub: Subscription) => (
                                                <div key={sub.id} className="p-5 border rounded-2xl flex flex-col justify-between gap-4 bg-gradient-to-br from-orange-50 to-white hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 flex items-center justify-center bg-white text-orange-500 rounded-full shadow-sm border border-orange-100">
                                                                <Star size={20} fill="currentColor" className="opacity-80"/>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800 text-sm">صندوق الرحلة ({sub.plan_name})</p>
                                                                <p className="text-xs text-muted-foreground mt-0.5">للطفل: {sub.child_name}</p>
                                                            </div>
                                                        </div>
                                                        <StatusBadge
                                                            status={subscriptionStatusPresentation[sub.status].label}
                                                            variant={subscriptionStatusPresentation[sub.status].variant}
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t border-orange-100">
                                                        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                                                            التجديد: {formatDate(sub.next_renewal_date)}
                                                        </div>
                                                        {sub.status === 'pending_payment' && (
                                                            <Button onClick={() => onPay({ id: sub.id, type: 'subscription' })} variant="success" size="sm" icon={<CreditCard size={14} />}>ادفع الآن</Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                                {orders.length > 0 && (
                                    <section>
                                        <h3 className="text-lg font-bold text-gray-700 mb-4 border-r-4 border-pink-400 pr-3">القصص والمنتجات</h3>
                                        <div className="space-y-3">
                                            {orders.map((item: Order) => (
                                                <div key={item.id} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-shrink-0 bg-pink-50 p-2 rounded-lg text-pink-600"><ShoppingBag size={20} /></div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 text-sm">{item.item_summary}</p>
                                                            <p className="text-xs text-gray-500 mt-1">تاريخ الطلب: {formatDate(item.order_date)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 self-end sm:self-center">
                                                        <span className="font-mono font-bold text-sm bg-gray-100 px-2 py-1 rounded">{item.total} ج.م</span>
                                                        <StatusBadge status={item.status} />
                                                        {item.status === 'بانتظار الدفع' && <Button onClick={() => onPay({ id: item.id, type: 'order' })} variant="success" size="sm" className="h-8 text-xs">سداد</Button>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </>
                        ) : (
                            <EmptyState
                                icon={<ShoppingBag className="w-16 h-16 text-gray-300" />}
                                title="لا توجد منتجات بعد"
                                message="ابدأ بتخصيص قصة لطفلك أو اشترك في الصندوق الشهري لتظهر طلباتك هنا."
                                actionText="اكتشف المتجر"
                                onAction={() => router.push('/enha-lak/custom')}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'creative-writing' && (
                    <div>
                        {creativeWritingItemsExist ? (
                             <div className="space-y-10">
                                {bookingsByChild.map(({ childName, journeys }) => (
                                    <div key={childName}>
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            رحلات {childName}
                                        </h3>
                                        {/* استخدام Grid بدل القائمة العمودية */}
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                            {journeys.map(journey => (
                                                <JourneyCalendarView key={journey.id} journey={journey} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <EmptyState
                                icon={<BookOpen className="w-16 h-16 text-gray-300" />}
                                title="لم تبدأ أي رحلة بعد"
                                message="سجل طفلك في برنامج 'بداية الرحلة' لتنمية مهاراته الكتابية."
                                actionText="استعرض الباقات"
                                onAction={() => router.push('/creative-writing/packages')}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyLibraryPanel;
