"use client";


import React, { useState, useMemo } from 'react';
import { Mail, HelpCircle, MessageCircle, Search, Package, BookOpen, Truck, LifeBuoy, Phone, Feather, Layers, FileQuestion, UserCog, RefreshCw, Handshake } from 'lucide-react';
import SupportForm from '../../../components/shared/SupportForm';
import FAQSection from '../../../components/shared/FAQSection';
import { useCommunicationMutations } from '../../../hooks/mutations/useCommunicationMutations';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import { Link } from '@/lib/router-compat';

const QuickActionCard: React.FC<{ icon: React.ReactNode, title: string, to: string, colorClass: string }> = ({ icon, title, to, colorClass }) => (
    <Link to={to} className="group block h-full">
        <div className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center h-full group-hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${colorClass}`}>
                {icon}
            </div>
            <span className="font-bold text-gray-700 group-hover:text-primary transition-colors text-sm">{title}</span>
        </div>
    </Link>
);

const SupportPage: React.FC = () => {
    const { createSupportTicket } = useCommunicationMutations();
    const { data: publicData } = usePublicData();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const comms = publicData?.communicationSettings;
    const content = publicData?.siteContent?.supportPage;
    const faqs = content?.faqs || [];

    const whatsappUrl = comms?.whatsapp_number 
        ? `https://wa.me/${comms.whatsapp_number}?text=${encodeURIComponent(comms.whatsapp_default_message || "مرحباً")}`
        : '#';

    // Filter FAQs based on search
    const filteredFaqs = useMemo(() => {
        if (!searchTerm) return faqs;
        const lowerTerm = searchTerm.toLowerCase();
        return faqs.filter(item => 
            item.question.toLowerCase().includes(lowerTerm) || 
            item.answer.toLowerCase().includes(lowerTerm)
        );
    }, [faqs, searchTerm]);

    // Categorize FAQs for Tabs
    const categorizedFaqs = useMemo(() => {
        const enhaLakKeywords = ['إنها لك', 'منتج', 'قصة', 'شحن', 'توصيل', 'صندوق'];
        const cwKeywords = ['بداية الرحلة', 'كتابة', 'جلسة', 'مدرب', 'زوم', 'برنامج'];
        const publisherKeywords = ['ناشر', 'نشر', 'كتب', 'مبيعات', 'عمولة'];
        
        const enhaLak = filteredFaqs.filter(f => enhaLakKeywords.some(k => f.category?.includes(k)));
        const creativeWriting = filteredFaqs.filter(f => cwKeywords.some(k => f.category?.includes(k)));
        const publisher = filteredFaqs.filter(f => publisherKeywords.some(k => f.category?.includes(k)));
        
        // General are those not in the above lists
        const general = filteredFaqs.filter(f => 
            !enhaLak.includes(f) && !creativeWriting.includes(f) && !publisher.includes(f)
        );

        return { enhaLak, creativeWriting, publisher, general };
    }, [filteredFaqs]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        
        try {
            await createSupportTicket.mutateAsync({
                name: data.name as string,
                email: data.email as string,
                subject: data.subject as string,
                message: data.message as string,
            });
            (e.target as HTMLFormElement).reset();
        } catch (error) {
            // Error toast is handled in context
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-muted/30 animate-fadeIn min-h-screen pb-20">
            {/* Hero Section */}
            <div className="bg-primary py-20 text-primary-foreground text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute top-10 right-10 w-20 h-20 bg-blue-400/20 rounded-full blur-2xl"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{content?.heroTitle || 'كيف يمكننا مساعدتك اليوم؟'}</h1>
                    <p className="text-lg opacity-90 max-w-2xl mx-auto mb-10 text-blue-100 leading-relaxed">
                        {content?.heroSubtitle || 'فريق الدعم في منصة الرحلة هنا للإجابة على استفساراتك وحل مشكلاتك.'}
                    </p>
                    
                    <div className="max-w-2xl mx-auto relative transform translate-y-4">
                        <div className="relative group">
                            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <Input 
                                type="text" 
                                placeholder="ابحث عن سؤالك هنا (مثال: طريقة الدفع، الشحن...)" 
                                className="pr-12 h-14 rounded-full shadow-2xl text-foreground text-lg border-2 border-transparent focus:border-primary/30"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16">
                
                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
                    <QuickActionCard icon={<Package size={24}/>} title="تتبع طلباتي" to="/account" colorClass="bg-pink-100 text-pink-600" />
                    <QuickActionCard icon={<UserCog size={24}/>} title="إعدادات الحساب" to="/account" colorClass="bg-blue-100 text-blue-600" />
                    <QuickActionCard icon={<RefreshCw size={24}/>} title="استعادة كلمة المرور" to="/reset-password" colorClass="bg-yellow-100 text-yellow-600" />
                    <QuickActionCard icon={<FileQuestion size={24}/>} title="دليل الاستخدام" to="/about" colorClass="bg-purple-100 text-purple-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Main Content (FAQs) */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border p-1">
                            <Tabs defaultValue="enha-lak" className="w-full">
                                <TabsList className="w-full justify-start h-auto bg-muted/50 p-2 rounded-xl mb-6 flex-wrap gap-2">
                                    <TabsTrigger value="enha-lak" className="flex-1 py-2.5 gap-2 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                                        <Package size={16} /> "إنها لك"
                                    </TabsTrigger>
                                    <TabsTrigger value="creative-writing" className="flex-1 py-2.5 gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                                        <Feather size={16} /> بداية الرحلة
                                    </TabsTrigger>
                                    <TabsTrigger value="publisher" className="flex-1 py-2.5 gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                                        <Handshake size={16} /> الشركاء
                                    </TabsTrigger>
                                    <TabsTrigger value="general" className="flex-1 py-2.5 gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-700 data-[state=active]:shadow-sm rounded-lg transition-all">
                                        <Layers size={16} /> عامة
                                    </TabsTrigger>
                                </TabsList>

                                <div className="px-4 pb-4 min-h-[400px]">
                                    <TabsContent value="enha-lak" className="space-y-4 animate-fadeIn mt-0">
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                <Package className="text-pink-500" /> أسئلة المنتجات والقصص
                                            </h3>
                                            <p className="text-sm text-gray-500">كل ما يخص القصص المخصصة، الطباعة، والشحن.</p>
                                        </div>
                                        {categorizedFaqs.enhaLak.length > 0 ? (
                                            <FAQSection category="" items={categorizedFaqs.enhaLak.map(f => ({ q: f.question, a: f.answer }))} />
                                        ) : <div className="text-center py-10 text-muted-foreground bg-gray-50 rounded-xl">لا توجد أسئلة في هذا القسم حالياً.</div>}
                                    </TabsContent>

                                    <TabsContent value="creative-writing" className="space-y-4 animate-fadeIn mt-0">
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                <Feather className="text-blue-500" /> أسئلة برنامج الكتابة
                                            </h3>
                                            <p className="text-sm text-gray-500">عن الجلسات، المدربين، والمناهج التعليمية.</p>
                                        </div>
                                        {categorizedFaqs.creativeWriting.length > 0 ? (
                                            <FAQSection category="" items={categorizedFaqs.creativeWriting.map(f => ({ q: f.question, a: f.answer }))} />
                                        ) : <div className="text-center py-10 text-muted-foreground bg-gray-50 rounded-xl">لا توجد أسئلة في هذا القسم حالياً.</div>}
                                    </TabsContent>

                                    <TabsContent value="publisher" className="space-y-4 animate-fadeIn mt-0">
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                <Handshake className="text-purple-500" /> أسئلة الشركاء والناشرين
                                            </h3>
                                            <p className="text-sm text-gray-500">كيفية الانضمام، إضافة الكتب، والسياسات المالية.</p>
                                        </div>
                                        {categorizedFaqs.publisher.length > 0 ? (
                                            <FAQSection category="" items={categorizedFaqs.publisher.map(f => ({ q: f.question, a: f.answer }))} />
                                        ) : <div className="text-center py-10 text-muted-foreground bg-gray-50 rounded-xl">لا توجد أسئلة في هذا القسم حالياً.</div>}
                                    </TabsContent>

                                    <TabsContent value="general" className="space-y-4 animate-fadeIn mt-0">
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                <LifeBuoy className="text-gray-500" /> أسئلة عامة
                                            </h3>
                                            <p className="text-sm text-gray-500">عن الحساب، الدفع، والمشاكل التقنية.</p>
                                        </div>
                                        {categorizedFaqs.general.length > 0 ? (
                                            <FAQSection category="" items={categorizedFaqs.general.map(f => ({ q: f.question, a: f.answer }))} />
                                        ) : <div className="text-center py-10 text-muted-foreground bg-gray-50 rounded-xl">لا توجد أسئلة في هذا القسم حالياً.</div>}
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </div>
                    
                    {/* Sidebar (Contact Info & Form) */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Direct Contact Cards */}
                        <div className="grid grid-cols-1 gap-4">
                            <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 shadow-sm hover:shadow-md transition-shadow group">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-green-800 mb-1 flex items-center gap-2"><MessageCircle size={16}/> واتساب</p>
                                        <p className="text-xs text-green-600">محادثة فورية (9ص - 9م)</p>
                                    </div>
                                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white p-3 rounded-full group-hover:scale-110 transition-transform shadow-lg shadow-green-200">
                                        <MessageCircle size={24} />
                                    </a>
                                </CardContent>
                            </Card>

                             <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-shadow group">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-2"><Mail size={16}/> البريد الإلكتروني</p>
                                        <p className="text-xs text-blue-600">للشكاوى والمقترحات</p>
                                    </div>
                                    <a href={`mailto:${comms?.support_email}`} className="bg-blue-600 text-white p-3 rounded-full group-hover:scale-110 transition-transform shadow-lg shadow-blue-200">
                                        <Mail size={24} />
                                    </a>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Form */}
                        <Card className="shadow-lg border-t-4 border-t-primary bg-white overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-20 h-20 bg-primary/5 rounded-br-full"></div>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2"><LifeBuoy className="text-primary" /> تذكرة دعم فني</CardTitle>
                              <CardDescription>لم تجد إجابة؟ أرسل لنا وسنرد خلال 24 ساعة.</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <SupportForm 
                                  onSubmit={handleSubmit} 
                                  isSubmitting={isSubmitting} 
                                  subjectOptions={[
                                      "مشكلة في طلب (إنها لك)", 
                                      "استفسار عن بداية الرحلة", 
                                      "مشكلة في الدفع", 
                                      "مشكلة تقنية في الموقع", 
                                      "استفسار شراكة / نشر",
                                      "اقتراح أو شكوى"
                                  ]}
                              />
                            </CardContent>
                        </Card>
                        
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                                هل ترغب في الانضمام لفريقنا؟ <Link to="/join-us" className="text-primary font-bold hover:underline">قدم طلبك هنا</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportPage;
