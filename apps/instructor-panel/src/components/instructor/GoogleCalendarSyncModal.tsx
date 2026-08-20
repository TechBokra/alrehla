import React, { useState } from 'react';
import { Calendar, Copy, Check, Info, Smartphone, Laptop, Download, AlertTriangle } from 'lucide-react';
import Modal from '@alrehla/ui/modal';
import { Button } from '@alrehla/ui/button';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useInstructorData } from '../../hooks/queries/instructor/useInstructorDataQuery';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import { DEFAULT_CONFIG } from '../../lib/config';
import { getMarketplaceUrl } from '../../lib/marketplaceUrl';

interface GoogleCalendarSyncModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const { data } = useInstructorData();
    const { addToast } = useToast();
    const [copied, setCopied] = useState(false);

    const projectUrl = DEFAULT_CONFIG.supabase.projectUrl;
    
    const baseApiUrl = `${projectUrl}/functions/v1/instructor-calendar`;
    const params = `id=${currentUser?.id}&t=${Date.now()}&ext=.ics`;
    const httpsUrl = baseApiUrl + '?' + params;
    
    const googleSubscribeUrl = `https://calendar.google.com/calendar/r/settings/addbyurl?cid=${encodeURIComponent(httpsUrl)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(httpsUrl);
        setCopied(true);
        addToast('تم نسخ الرابط بنجاح!', 'success');
        setTimeout(() => setCopied(false), 3000);
    };

    const handleDownloadIcs = () => {
        if (!data?.bookings) {
            addToast('لا توجد بيانات لإنشاء الملف', 'error');
            return;
        }

        const bookings = data.bookings;
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Alrehla//Instructor Calendar//AR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
        
        bookings.forEach((booking: any) => {
            if (booking.sessions) {
                booking.sessions.forEach((session: any) => {
                    if (session.status === 'upcoming' || session.status === 'completed') {
                        const startDate = new Date(session.session_date);
                        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
                        
                        const format = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                        
                        icsContent += "BEGIN:VEVENT\n";
                        icsContent += `UID:${session.id}\n`;
                        icsContent += `DTSTAMP:${format(new Date())}\n`;
                        icsContent += `DTSTART:${format(startDate)}\n`;
                        icsContent += `DTEND:${format(endDate)}\n`;
                        icsContent += `SUMMARY:${booking.package_name} - ${booking.child_profiles?.name || 'طالب'}\n`;
                        icsContent += `DESCRIPTION:جلسة تدريبية على منصة الرحلة.\nرابط الجلسة: ${getMarketplaceUrl(`/session/${session.id}`)}\n`;
                        icsContent += "END:VEVENT\n";
                    }
                });
            }
        });

        icsContent += "END:VCALENDAR";

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `alrehla_schedule_${new Date().toISOString().split('T')[0]}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addToast('تم تحميل ملف التقويم بنجاح', 'success');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="إعدادات مزامنة التقويم"
            size="xl"
            footer={<Button onClick={onClose} variant="ghost">إغلاق</Button>}
        >
            <Tabs defaultValue="google">
                <TabsList className="w-full">
                    <TabsTrigger value="google" className="flex-1">Google Calendar</TabsTrigger>
                    <TabsTrigger value="file" className="flex-1">ملف (ICS)</TabsTrigger>
                    <TabsTrigger value="other" className="flex-1">رابط مباشر</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="google" className="space-y-6">
                        <div className="text-center space-y-6">
                            <div className="p-6 border-2 border-dashed rounded-2xl bg-blue-50/50 flex flex-col items-center justify-center gap-4">
                                <Calendar className="w-16 h-16 text-blue-600" />
                                <h3 className="font-bold text-lg text-gray-800">الاشتراك التلقائي (Sync)</h3>
                                <p className="text-sm text-gray-600 max-w-sm leading-relaxed">
                                    اضغط أدناه لإضافة جدولك إلى تقويم جوجل وتلقي التحديثات تلقائياً.
                                    <br/>
                                    <span className="text-xs text-muted-foreground">(يتطلب تفعيل خدمة Calendar API من الإدارة)</span>
                                </p>
                                <a 
                                    href={googleSubscribeUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-6 rounded-full hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg"
                                >
                                    <PlusIcon /> إضافة إلى تقويم جوجل
                                </a>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-right text-xs border border-yellow-200">
                                <AlertTriangle size={16} className="shrink-0" />
                                <p>
                                    إذا ظهرت رسالة خطأ "Settings Error" أو "Failed to add calendar" في جوجل، فهذا يعني أن خدمة المزامنة السحابية غير مفعلة حالياً. 
                                    <strong className="block mt-1">الحل البديل: استخدم تبويب "ملف (ICS)" لتحميل المواعيد يدوياً.</strong>
                                </p>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="file" className="space-y-6">
                         <div className="text-center p-6 border rounded-2xl bg-gray-50">
                            <Download className="w-12 h-12 text-green-600 mx-auto mb-3" />
                            <h3 className="font-bold text-lg mb-2">تحميل ملف التقويم (Offline)</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                هذا الخيار يعمل دائماً! سيقوم بتحميل ملف يحتوي على جميع جلساتك الحالية والمستقبلية. يمكنك فتحه لإضافتها إلى أي تقويم (Google, Outlook, Apple).
                            </p>
                            <Button onClick={handleDownloadIcs} variant="success" size="lg" className="shadow-md" icon={<Download />}>
                                تحميل ملف .ics الآن
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="other" className="space-y-6">
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-4">
                                <div className="bg-white p-2 rounded-xl shadow-sm text-blue-600">
                                    <Info size={24} />
                                </div>
                                <div className="text-sm leading-relaxed text-blue-800">
                                    <p className="font-bold mb-1">رابط الاشتراك المباشر</p>
                                    <p>استخدم هذا الرابط في Outlook أو Apple Calendar للاشتراك.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted p-3 rounded-xl border font-mono text-[10px] break-all text-muted-foreground dir-ltr">
                                    {httpsUrl}
                                </div>
                                <Button 
                                    onClick={handleCopy} 
                                    variant={copied ? "success" : "default"} 
                                    className="shrink-0 h-11 w-11 p-0 rounded-xl"
                                    title="نسخ الرابط"
                                >
                                    {copied ? <Check size={20} /> : <Copy size={20} />}
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 bg-gray-50 rounded-xl border">
                                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Smartphone size={16}/> iPhone / iPad</h4>
                                    <ol className="text-[10px] list-decimal list-inside text-muted-foreground space-y-1">
                                        <li>انتقل إلى الإعدادات &gt; التقويم &gt; الحسابات.</li>
                                        <li>اختر "إضافة حساب" &gt; "أخرى".</li>
                                        <li>اختر "إضافة تقويم مشترك" وألصق الرابط.</li>
                                    </ol>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border">
                                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Laptop size={16}/> Outlook Desktop</h4>
                                    <ol className="text-[10px] list-decimal list-inside text-muted-foreground space-y-1">
                                        <li>افتح التقويم.</li>
                                        <li>انقر بزر الماوس الأيمن على "My Calendars".</li>
                                        <li>اختر Add Calendar &gt; From Internet وألصق الرابط.</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </Modal>
    );
};

const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14"/>
    </svg>
);

export default GoogleCalendarSyncModal;
