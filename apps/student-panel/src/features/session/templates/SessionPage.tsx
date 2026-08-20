"use client";


import React, { useRef, useEffect, useState } from 'react';
import { getAdminPanelUrl } from '../../../lib/adminPanelUrl';
import { getInstructorPanelUrl } from '../../../lib/instructorPanelUrl';
import { getMarketplaceUrl } from '../../../lib/marketplaceUrl';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { useSessionDetails } from '../../../hooks/queries/user/useJourneyDataQuery';
import { useJitsiSettings } from '../../../hooks/queries/public/useJitsiSettingsQuery';
import { 
    Loader2, ShieldAlert, Clock, CheckCircle, Headphones, 
    Video, Wind, Sparkles, LogOut, Save, MessageSquare, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import { Button } from '@alrehla/ui/button';
import { Textarea } from '@alrehla/ui/textarea';
import Modal from '@alrehla/ui/modal';
import FormField from '@alrehla/ui/form-field';
import { bookingService } from '../../../services/bookingService';
import { useToast } from '../../../contexts/ToastContext';
import { formatTime, formatDate } from '../../../utils/helpers';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const CountdownTimer: React.FC<{ targetDate: Date; onComplete: () => void }> = ({ targetDate, onComplete }) => {
    const calculateTimeLeft = () => {
        const difference = +targetDate - +new Date();
        let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            if (+targetDate - +new Date() <= 0) {
                onComplete();
                clearInterval(timer);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate, onComplete]);

    const timerComponents = [
        timeLeft.days > 0 && `${timeLeft.days} يوم`,
        timeLeft.hours > 0 && `${timeLeft.hours} ساعة`,
        `${timeLeft.minutes} دقيقة`,
        `${timeLeft.seconds} ثانية`,
    ].filter(Boolean).join(' و ');

    return <p className="text-xl sm:text-3xl font-black text-primary mt-2" dir="ltr">{timerComponents || "جاري الدخول..."}</p>;
};

const SessionPage: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { currentUser, loading: authLoading } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();
    
    const { data: session, isLoading: sessionLoading, refetch } = useSessionDetails(sessionId);
    const { data: jitsiSettings, isLoading: settingsLoading } = useJitsiSettings();
    
    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const jitsiApiRef = useRef<any>(null);
    
    const [status, setStatus] = useState<'loading' | 'waiting' | 'active' | 'ended' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [joinTime, setJoinTime] = useState<Date | null>(null);
    const [jitsiScriptLoaded, setJitsiScriptLoaded] = useState(false);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    const [finishNotes, setFinishNotes] = useState('');
    const [isSubmittingFinish, setIsSubmittingFinish] = useState(false);
    const [allowedWindow, setAllowedWindow] = useState(10);

    const isInstructor = currentUser?.role === 'instructor' || currentUser?.role === 'super_admin' || currentUser?.role === 'creative_writing_supervisor';
    
    // Explicitly cast session to any to bypass strict type checking during build
    const sessionData = session as any;

    // 1. Load Jitsi Script
    useEffect(() => {
        if (!document.getElementById('jitsi-script')) {
            const script = document.createElement('script');
            script.id = 'jitsi-script';
            script.src = 'https://meet.jit.si/external_api.js';
            script.async = true;
            script.onload = () => setJitsiScriptLoaded(true);
            document.head.appendChild(script);
        } else {
            setJitsiScriptLoaded(true);
        }
    }, []);

    // 2. Validate Session & State
    useEffect(() => {
        if (authLoading || sessionLoading || settingsLoading) return;

        if (!currentUser) {
            router.push('/account');
            return;
        }

        if (!sessionData) {
            setError('لم يتم العثور على تفاصيل الجلسة.');
            setStatus('error');
            return;
        }
        
        if (sessionData.status === 'completed' || sessionData.status === 'missed') {
            setStatus('ended');
            return;
        }

        const startTime = new Date(sessionData.session_date);
        
        // تحديد نافذة الدخول: 
        // المدربين والمشرفين: 30 دقيقة قبل الموعد للتجهيز
        // الطلاب: 10 دقائق قبل الموعد (كما هو مطلوب)
        const joinMinutesBefore = isInstructor ? 30 : 10;
        setAllowedWindow(joinMinutesBefore);

        const calculatedJoinTime = new Date(startTime.getTime() - joinMinutesBefore * 60000);
        const now = new Date();

        setJoinTime(calculatedJoinTime);

        if (now < calculatedJoinTime) {
            setStatus('waiting');
        } else {
            setStatus('active');
        }

    }, [authLoading, sessionLoading, settingsLoading, currentUser, sessionData, jitsiSettings, router, isInstructor]);

    // 3. Initialize Jitsi
    useEffect(() => {
        if (status !== 'active' || !jitsiScriptLoaded || !jitsiSettings || !sessionData || !currentUser || jitsiApiRef.current) {
            return;
        }

        const initializeJitsi = async () => {
            try {
                // Request permissions early to avoid Jitsi blocking
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (err: any) {
                console.warn("Media permissions check:", err);
                // We don't block here, let Jitsi handle the UI prompt
            }

            if (window.JitsiMeetExternalAPI && jitsiContainerRef.current) {
                try {
                    const options = {
                        roomName: `${jitsiSettings.room_prefix}${sessionData.id}`,
                        width: '100%',
                        height: '100%',
                        parentNode: jitsiContainerRef.current,
                        userInfo: { displayName: currentUser.name || currentUser.email },
                        configOverwrite: {
                            prejoinPageEnabled: false,
                            startWithAudioMuted: jitsiSettings.start_with_audio_muted,
                            startWithVideoMuted: jitsiSettings.start_with_video_muted,
                            disableDeepLinking: true, 
                        },
                        interfaceConfigOverwrite: {
                            SHOW_JITSI_WATERMARK: false,
                            SHOW_WATERMARK_FOR_GUESTS: false,
                            TOOLBAR_BUTTONS: [
                                'microphone', 'camera', 'desktop', 'fullscreen', 
                                'fodeviceselection', 'hangup', 'profile', 'chat', 
                                'settings', 'tileview', 'raisehand'
                            ],
                        },
                    };

                    jitsiApiRef.current = new window.JitsiMeetExternalAPI(jitsiSettings.domain, options);
                    
                    // Listen for hangup
                    jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
                        if (!isInstructor) {
                            router.back();
                        }
                    });

                } catch (e) {
                    setError("فشل تحميل مكون الفيديو. يرجى تحديث الصفحة.");
                    setStatus('error');
                }
            }
        };

        initializeJitsi();

        return () => {
            if (jitsiApiRef.current) {
                jitsiApiRef.current.dispose();
                jitsiApiRef.current = null;
            }
        };
    }, [status, currentUser, sessionData, jitsiSettings, jitsiScriptLoaded, isInstructor, router]);

    const handleFinishSession = async () => {
        if (!sessionId || !sessionData) return;
        setIsSubmittingFinish(true);
        try {
            await bookingService.updateScheduledSession(sessionId, { 
                status: 'completed', 
                notes: finishNotes 
            });
            addToast('تم إنهاء الجلسة بنجاح وتوثيقها.', 'success');
            
            if (sessionData.booking_id) {
                router.push(`/journey/${sessionData.booking_id}`);
            } else {
                if (currentUser?.role === 'instructor') {
                    window.location.assign(getInstructorPanelUrl('/'));
                } else if (currentUser?.role === 'student') {
                    router.push('/dashboard');
                } else if (['super_admin', 'general_supervisor', 'creative_writing_supervisor', 'enha_lak_supervisor', 'content_editor', 'support_agent', 'publisher'].includes(currentUser?.role || '')) {
                    window.location.assign(getAdminPanelUrl('/'));
                } else {
                    window.location.assign(getMarketplaceUrl('/account'));
                }
            }
        } catch (e) {
            addToast('حدث خطأ أثناء إنهاء الجلسة.', 'error');
        } finally {
            setIsSubmittingFinish(false);
        }
    };

    const renderContent = () => {
        if (status === 'loading') return (
            <div className="flex flex-col justify-center items-center h-full bg-slate-900">
                <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
                <p className="mt-4 text-gray-300 font-bold">جاري الاتصال بالقاعة...</p>
            </div>
        );

        if (status === 'waiting') return (
            <div className="flex flex-col justify-center items-center h-full text-white text-center p-4 bg-slate-900">
                <Card className="max-w-lg w-full bg-white/10 border-white/20 backdrop-blur-md text-white">
                    <CardHeader>
                        <Clock className="h-16 w-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
                        <CardTitle className="text-3xl font-bold">الجلسة لم تبدأ بعد</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                            <p className="text-sm text-gray-300 mb-1">يبدأ الدخول خلال:</p>
                            {joinTime && <CountdownTimer targetDate={joinTime} onComplete={() => setStatus('active')} />}
                        </div>
                        
                        <div className="flex flex-col gap-2 text-sm text-gray-300">
                             <div className="flex items-center justify-center gap-2">
                                <Calendar size={16} className="text-blue-300"/>
                                <span>موعد الجلسة: {formatDate(sessionData?.session_date)}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Clock size={16} className="text-blue-300"/>
                                <span>الساعة: {formatTime(sessionData?.session_date)}</span>
                            </div>
                            <p className="text-xs text-yellow-200/80 mt-2 font-semibold">
                                {isInstructor 
                                    ? `* بصفتك مدرباً، يمكنك الدخول قبل الموعد بـ ${allowedWindow} دقيقة للتجهيز.`
                                    : `* يمكن للطالب الدخول قبل الموعد بـ ${allowedWindow} دقائق فقط.`
                                }
                            </p>
                        </div>

                        <div className="text-right border-t border-white/10 pt-4 space-y-3">
                            <p className="text-xs font-bold text-gray-300 flex items-center gap-2"><Wind size={14} className="text-blue-400"/> تأكد من وجودك في مكان هادئ.</p>
                            <p className="text-xs font-bold text-gray-300 flex items-center gap-2"><Headphones size={14} className="text-pink-400"/> استخدم سماعات الرأس لضمان جودة الصوت.</p>
                            <p className="text-xs font-bold text-gray-300 flex items-center gap-2"><Video size={14} className="text-green-400"/> تأكد من عمل الكاميرا بشكل جيد.</p>
                        </div>

                        <div className="pt-4">
                            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={() => router.back()}>
                                العودة للخلف
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );

        if (status === 'ended') return (
            <div className="flex flex-col justify-center items-center h-full bg-slate-900 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <CardTitle>انتهت الجلسة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">شكراً لحضورك. نتمنى أن تكون الجلسة مفيدة وممتعة.</p>
                        <div className="flex flex-col gap-3">
                            {(() => {
                                let dest = { href: '/dashboard', external: false };
                                if (currentUser?.role === 'instructor') {
                                    dest = { href: getInstructorPanelUrl('/'), external: true };
                                } else if (currentUser?.role === 'student') {
                                    dest = { href: '/dashboard', external: false };
                                } else if (['super_admin', 'general_supervisor', 'creative_writing_supervisor', 'enha_lak_supervisor', 'content_editor', 'support_agent', 'publisher'].includes(currentUser?.role || '')) {
                                    dest = { href: getAdminPanelUrl('/'), external: true };
                                } else {
                                    dest = { href: getMarketplaceUrl('/account'), external: true };
                                }
                                return (
                                    <Button asChild variant="default">
                                        {dest.external ? (
                                            <a href={dest.href}>العودة للوحة التحكم</a>
                                        ) : (
                                            <Link href={dest.href}>العودة للوحة التحكم</Link>
                                        )}
                                    </Button>
                                );
                            })()}
                            {sessionData?.booking_id && (
                                <Button asChild variant="outline"><Link href={`/journey/${sessionData.booking_id}`}>الذهاب لصفحة الرحلة</Link></Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );

        if (status === 'error') return (
            <div className="flex flex-col justify-center items-center h-full bg-slate-900 p-4">
                <Card className="max-w-md w-full text-center border-red-200 bg-red-50">
                    <CardHeader>
                        <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <CardTitle className="text-red-700">خطأ في الاتصال</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-600 mb-6">{error || 'حدث خطأ غير متوقع.'}</p>
                        <Button onClick={() => window.location.reload()} variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                            إعادة المحاولة
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );

        return (
            <div className="relative w-full h-full bg-slate-900">
                <div ref={jitsiContainerRef} className="w-full h-full" />
                
                {/* Floating Controls for Instructor */}
                {isInstructor && (
                    <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
                         <div className="bg-black/50 backdrop-blur text-white p-2 rounded-lg text-xs mb-2 border border-white/10">
                            <p className="font-bold flex items-center gap-2"><Sparkles size={12} className="text-yellow-400"/> وضع المدرب</p>
                        </div>
                        <Button 
                            onClick={() => setIsFinishModalOpen(true)} 
                            variant="destructive" 
                            size="sm" 
                            className="shadow-lg font-bold border-2 border-red-400/50"
                            icon={<LogOut size={16}/>}
                        >
                            إنهاء الجلسة
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background">
             {/* Instructor Finish Modal */}
             <Modal
                isOpen={isFinishModalOpen}
                onClose={() => setIsFinishModalOpen(false)}
                title="إنهاء الجلسة وتوثيقها"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsFinishModalOpen(false)}>إلغاء</Button>
                        <Button onClick={handleFinishSession} loading={isSubmittingFinish} icon={<Save />}>تأكيد وحفظ</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="bg-yellow-50 p-3 rounded-lg flex items-start gap-3 border border-yellow-200">
                        <MessageSquare className="text-yellow-600 shrink-0 mt-1" size={18}/>
                        <p className="text-sm text-yellow-800">
                            ملاحظاتك هنا ستظهر لولي الأمر في تقرير الجلسة. يرجى كتابة ملخص سريع لما تم إنجازه.
                        </p>
                    </div>
                    <FormField label="ملاحظات الجلسة" htmlFor="finishNotes">
                        <Textarea 
                            id="finishNotes" 
                            value={finishNotes} 
                            onChange={e => setFinishNotes(e.target.value)} 
                            rows={4} 
                            placeholder="مثال: تم شرح أساسيات بناء الشخصية، وتفاعل الطالب كان ممتازاً..."
                        />
                    </FormField>
                </div>
            </Modal>

            {renderContent()}
        </div>
    );
};

export default SessionPage;
