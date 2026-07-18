"use client";


import React, { useState, useEffect, useRef } from 'react';
import { getAdminPanelUrl } from '../../../lib/adminPanelUrl';
import { useParams, Link } from '@/lib/router-compat';
import { useTrainingJourneyData } from '../../../hooks/queries/user/useJourneyDataQuery';
import { useAuth } from '../../../contexts/AuthContext';
import { useBookingMutations } from '../../../hooks/mutations/useBookingMutations';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import { 
    MessageSquare, Paperclip, FileText, Send, Upload, 
    ArrowLeft, Download, Loader2, User, GraduationCap, UserCheck, Clock, CheckCircle2, RefreshCw, AlertCircle, Shield, Award
} from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import { Textarea } from '@alrehla/ui/textarea';
import { formatDate } from '../../../utils/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import type { UserRole } from '../../../lib/database.types';
import Image from '@alrehla/ui/next-image';

const TrainingJourneyPage: React.FC = () => {
    const { journeyId } = useParams<{ journeyId: string }>();
    const { currentUser } = useAuth();
    const { data: journeyData, isLoading, refetch, isRefetching } = useTrainingJourneyData(journeyId);
    const { sendSessionMessage, uploadSessionAttachment } = useBookingMutations();

    const [activeTab, setActiveTab] = useState<'discussion' | 'attachments'>('discussion');
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeTab === 'discussion') {
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [journeyData?.messages, activeTab]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !journeyId || !currentUser) return;
        
        const messageToSend = newMessage;
        setNewMessage(''); 
        
        try {
            await sendSessionMessage.mutateAsync({
                bookingId: journeyId,
                senderId: currentUser.id,
                role: currentUser.role, 
                message: messageToSend
            });
            refetch();
        } catch (error: any) {
            setNewMessage(messageToSend);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !journeyId || !currentUser) return;

        try {
            await uploadSessionAttachment.mutateAsync({
                bookingId: journeyId,
                uploaderId: currentUser.id,
                role: currentUser.role,
                file
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
            refetch();
        } catch (error: any) {
             // Error handled by hook
        }
    };
    
    const getSenderInfo = (role: UserRole, senderId: string) => {
        const isMe = currentUser?.id === senderId;
        
        let label = 'مستخدم';
        let bubbleColor = 'bg-white text-gray-800 border border-gray-100';
        let align = isMe ? 'justify-end' : 'justify-start';
        let avatarUrl = null;
        let icon = null;

        if (role === 'instructor') {
            label = 'المدرب';
            bubbleColor = 'bg-amber-50 border-amber-100 text-gray-800';
            avatarUrl = (journeyData as any)?.instructor?.avatar_url;
        } else if (role === 'student') {
            label = 'الطالب';
            bubbleColor = 'bg-blue-50 border-blue-100 text-gray-800';
            avatarUrl = (journeyData as any)?.childProfile?.avatar_url;
        } else if (['parent', 'user'].includes(role)) {
            label = 'ولي الأمر';
        } else if (['super_admin', 'general_supervisor', 'creative_writing_supervisor'].includes(role)) {
            label = 'الإدارة / المشرف';
            bubbleColor = 'bg-purple-50 border-purple-100 text-purple-900 shadow-sm';
            icon = <Shield size={12} className="text-purple-600" />;
        }
        
        if (isMe) {
            bubbleColor = 'bg-primary text-primary-foreground shadow-md border-transparent';
            label = 'أنت';
        }
        
        return { label, bubbleColor, align, avatarUrl, icon };
    };

    if (isLoading) return <PageLoader />;
    
    if (!journeyData || !journeyData.booking) {
        return <ErrorState message="الرحلة غير موجودة أو لم يتم تحميل البيانات." />;
    }

    const { booking, scheduledSessions, messages, attachments, childProfile } = journeyData;
    const instructorName = (journeyData as any).instructor?.name || 'غير محدد';
    const bookingPackageName = (booking as any).package_name || 'باقة تدريبية';
    
    const upcomingSession = scheduledSessions.find((s: any) => s.status === 'upcoming');
    const isPendingApproval = booking.status === 'بانتظار المراجعة' || booking.status === 'بانتظار الدفع';
    
    // --- تقرير المدرب (النتيجة) ---
    const progressReport = (booking as any).progress_notes;

    let backLink = "/account";
    if (currentUser?.role === 'student') {
        backLink = "/student/dashboard";
    } else if (currentUser?.role === 'instructor') {
        backLink = getAdminPanelUrl('/journeys');
    } else if (['super_admin', 'creative_writing_supervisor'].includes(currentUser?.role || '')) {
        backLink = getAdminPanelUrl(`/creative-writing/bookings/${booking.id}`);
    }

    return (
        <div className="bg-gray-50/50 py-8 animate-fadeIn min-h-screen">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border">
                    <div className="flex-grow">
                        <div className="flex items-center justify-between mb-2">
                            <Link to={backLink} className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1">
                                 <ArrowLeft size={12} className="rotate-180"/> العودة
                            </Link>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => refetch()} 
                                className="h-6 text-[10px] text-muted-foreground hover:text-primary"
                                title="تحديث البيانات"
                            >
                                <RefreshCw size={12} className={`mr-1 ${isRefetching ? 'animate-spin' : ''}`} /> تحديث
                            </Button>
                        </div>
                        <h1 className="text-2xl font-black text-gray-800">{bookingPackageName}</h1>
                        <p className="text-muted-foreground font-medium text-sm flex items-center gap-2 mt-1">
                            <GraduationCap size={14}/> الطالب: {childProfile?.name} 
                            <span className="text-gray-300">|</span>
                            <UserCheck size={14}/> المدرب: {instructorName}
                        </p>
                    </div>
                    {upcomingSession ? (
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-blue-800 font-bold">جلستك القادمة</p>
                                <p className="text-xs text-blue-600 font-mono mt-0.5" dir="ltr">
                                    {new Date(upcomingSession.session_date).toLocaleDateString('ar-EG')} - {new Date(upcomingSession.session_date).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                            <Button as={Link} to={`/session/${upcomingSession.id}`} size="sm" className="mr-2 h-8 text-xs shadow-md">
                                دخول
                            </Button>
                        </div>
                    ) : isPendingApproval ? (
                        <div className="bg-orange-50 border border-orange-200 text-orange-700 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                            <AlertCircle size={16} /> بانتظار اعتماد الإدارة لجدولة الجلسات
                        </div>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
                    <div className="lg:col-span-3 flex flex-col h-full space-y-6">
                        
                        {/* Instructor Feedback / Result Section */}
                        {progressReport && (
                             <Card className="bg-yellow-50/50 border-yellow-200 border-l-4 border-l-yellow-400">
                                <CardContent className="p-4">
                                    <h3 className="font-bold text-yellow-800 flex items-center gap-2 mb-2">
                                        <Award size={18} /> ملاحظات وتقرير المدرب
                                    </h3>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {progressReport}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="flex-grow flex flex-col shadow-sm border overflow-hidden h-full">
                            <CardContent className="p-0 flex-grow flex flex-col h-full">
                                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-grow flex flex-col h-full">
                                    <div className="border-b bg-white px-4">
                                        <TabsList className="w-full justify-start h-14 bg-transparent p-0">
                                            <TabsTrigger value="discussion" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-gray-500 h-full"><MessageSquare size={16} className="ml-2"/> المحادثة</TabsTrigger>
                                            <TabsTrigger value="attachments" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-gray-500 h-full"><Paperclip size={16} className="ml-2"/> المرفقات</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <div className="flex-grow bg-slate-50/50 relative overflow-hidden flex flex-col">
                                        <TabsContent value="discussion" className="h-full flex flex-col mt-0">
                                            {/* Chat Area */}
                                            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#e5ddd5] bg-opacity-30" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/subtle-white-feathers.png')"}}>
                                                {messages.length > 0 ? messages.map((msg: any, idx: number) => {
                                                    const { label, bubbleColor, align, avatarUrl, icon } = getSenderInfo(msg.sender_role, msg.sender_id);
                                                    const isMe = currentUser?.id === msg.sender_id;
                                                    const timeString = new Date(msg.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'});
                                                    const showAvatar = !isMe && (idx === 0 || messages[idx-1].sender_id !== msg.sender_id);
                                                    
                                                    return (
                                                        <div key={msg.id} className={`flex items-end gap-2 ${align} ${!showAvatar && !isMe ? 'mr-9' : ''}`}>
                                                            {!isMe && showAvatar && (
                                                                <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-300 bg-white flex-shrink-0">
                                                                    <Image src={avatarUrl || '/images/male-avatar.png'} alt={label} className="w-full h-full object-cover" />
                                                                </div>
                                                            )}
                                                            <div className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl shadow-sm relative text-sm ${bubbleColor} ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                                                                {!isMe && (
                                                                    <p className="text-[10px] font-bold text-primary mb-1 opacity-80 flex items-center gap-1">
                                                                        {icon} {label}
                                                                    </p>
                                                                )}
                                                                <p className="leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                                                                <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                                    {timeString}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
                                                        <div className="bg-white p-4 rounded-full mb-3 shadow-sm">
                                                            <MessageSquare size={32} className="text-primary"/>
                                                        </div>
                                                        <p>مساحة النقاش مفتوحة!</p>
                                                    </div>
                                                )}
                                                <div ref={chatEndRef} />
                                            </div>
                                            
                                            {/* Input Area */}
                                            <div className="p-3 bg-white border-t">
                                                <form onSubmit={handleSendMessage} className="flex gap-2 items-end bg-gray-100 p-1.5 rounded-3xl border border-gray-200">
                                                    <Textarea 
                                                        value={newMessage} 
                                                        onChange={e => setNewMessage(e.target.value)} 
                                                        placeholder="اكتب رسالة..." 
                                                        className="min-h-[44px] max-h-[120px] bg-transparent border-none focus-visible:ring-0 shadow-none resize-none py-3 px-4 text-sm" 
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSendMessage(e);
                                                            }
                                                        }}
                                                    />
                                                    <Button type="submit" size="icon" className="h-10 w-10 shrink-0 mb-0.5 rounded-full shadow-sm" disabled={sendSessionMessage.isPending || !newMessage.trim()}>
                                                        {sendSessionMessage.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={18} className="rtl:rotate-180"/>}
                                                    </Button>
                                                </form>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="attachments" className="h-full mt-0 p-6 overflow-y-auto custom-scrollbar">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                <div className="bg-white p-6 rounded-xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center hover:bg-blue-50/50 transition-colors">
                                                    <div className="w-12 h-12 bg-blue-100 text-primary rounded-full flex items-center justify-center mb-3">
                                                        <Upload size={24} />
                                                    </div>
                                                    <h3 className="font-bold text-gray-800 text-sm">رفع ملف جديد (واجب / نشاط)</h3>
                                                    <input 
                                                        type="file" 
                                                        ref={fileInputRef}
                                                        className="hidden" 
                                                        onChange={handleFileUpload} 
                                                        disabled={uploadSessionAttachment.isPending} 
                                                        id="file-upload"
                                                    />
                                                    <Button 
                                                        as="label" 
                                                        htmlFor="file-upload" 
                                                        loading={uploadSessionAttachment.isPending} 
                                                        className="cursor-pointer h-9 px-6 text-xs mt-2"
                                                    >
                                                        {uploadSessionAttachment.isPending ? 'جاري الرفع...' : 'اختر ملفاً'}
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">الملفات المرفوعة ({attachments.length})</h4>
                                            <div className="space-y-3">
                                                {attachments.length > 0 ? attachments.map((att: any) => (
                                                    <div key={att.id} className="bg-white p-3 rounded-lg border flex items-center justify-between group hover:border-primary/50 transition-colors">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                                                                <FileText size={20}/>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold truncate text-gray-800" title={att.file_name}>{att.file_name}</p>
                                                                <p className="text-[10px] text-muted-foreground">{formatDate(att.created_at)}</p>
                                                            </div>
                                                        </div>
                                                        <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-primary transition-colors bg-gray-50 hover:bg-blue-50 rounded-full">
                                                            <Download size={16}/>
                                                        </a>
                                                    </div>
                                                )) : <p className="text-xs text-gray-400 text-center py-4">لا توجد ملفات.</p>}
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 h-full overflow-hidden">
                        <Card className="h-full flex flex-col border-t-4 border-t-secondary shadow-sm bg-white">
                            <CardHeader className="pb-3 border-b bg-gray-50">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Clock size={16} className="text-secondary"/> خطة الرحلة
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-grow overflow-y-auto custom-scrollbar">
                                {scheduledSessions.length > 0 ? (
                                    <div className="p-3 space-y-3">
                                        {scheduledSessions.map((s: any, idx: number) => {
                                            const isCompleted = s.status === 'completed';
                                            const isUpcoming = s.status === 'upcoming';
                                            const isNext = upcomingSession?.id === s.id;

                                            return (
                                                <div key={s.id} className={`p-3 rounded-lg border relative transition-all ${
                                                    isNext ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-200' :
                                                    isCompleted ? 'bg-green-50/50 border-green-100 opacity-80' : 'bg-white hover:bg-gray-50'
                                                }`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`text-xs font-bold ${isNext ? 'text-blue-700' : 'text-gray-700'}`}>جلسة {idx + 1}</span>
                                                        {isCompleted && <CheckCircle2 size={14} className="text-green-600"/>}
                                                        {isNext && <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded animate-pulse">القادمة</span>}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {formatDate(s.session_date)}
                                                    </div>
                                                    {isUpcoming && currentUser && (['student', 'parent', 'instructor', 'super_admin', 'creative_writing_supervisor'].some(r => r === currentUser.role)) && (
                                                        <Button as={Link} to={`/session/${s.id}`} size="sm" className={`w-full h-7 text-[10px] ${isNext ? 'bg-blue-600 hover:bg-blue-700' : ''}`} variant={isNext ? 'default' : 'outline'}>
                                                            {isNext ? 'بدء الجلسة' : 'دخول'}
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-muted-foreground text-xs">
                                        <p>لم تتم جدولة الجلسات بعد.</p>
                                        <p className="mt-1 opacity-70">ستظهر هنا فور تأكيد الحجز من الإدارة.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingJourneyPage;
