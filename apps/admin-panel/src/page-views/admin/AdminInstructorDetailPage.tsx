
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAdminInstructors } from '../../hooks/queries/admin/useAdminInstructorsQuery';
import { useAdminCWSettings } from '../../hooks/queries/admin/useAdminSettingsQuery';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import { ArrowLeft, Save, User, FileEdit, Clock, Check, XCircle, ArrowRightCircle, Calendar } from 'lucide-react';
import type { Instructor } from '../../lib/database.types';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import Image from '@alrehla/ui/image';
import { formatDate } from '../../utils/helpers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';

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

const ORDERED_DAYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const dayNames: { [key: string]: string } = {
    saturday: 'السبت', sunday: 'الأحد', monday: 'الاثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء',
    thursday: 'الخميس', friday: 'الجمعة'
};

const ScheduleViewer: React.FC<{ schedule: any, isEmptyMessage?: string, title: string, colorClass?: string }> = ({ 
    schedule, 
    isEmptyMessage = "لا توجد مواعيد محددة",
    title,
    colorClass = "bg-gray-50 border-gray-200"
}) => {
    // 1. تنظيف البيانات
    const validSchedule = schedule && typeof schedule === 'object' && !Array.isArray(schedule) ? schedule : {};
    
    // 2. التحقق من وجود مواعيد
    const hasAnySlots = ORDERED_DAYS.some(day => Array.isArray(validSchedule[day]) && validSchedule[day].length > 0);

    return (
        <div className={`rounded-xl border p-4 h-full ${colorClass}`}>
            <h4 className="font-bold text-center mb-4 text-gray-700 border-b pb-2">{title}</h4>
            
            {!hasAnySlots ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Calendar className="mb-2 opacity-20" size={32} />
                    <p className="text-sm">{isEmptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {ORDERED_DAYS.map((day) => {
                        const times = validSchedule[day];
                        if (!Array.isArray(times) || times.length === 0) return null;

                        return (
                            <div key={day} className="flex items-start gap-2 bg-white p-2 rounded border shadow-sm">
                                <div className="w-16 font-bold text-xs pt-1 text-gray-600 bg-gray-50 px-1 rounded text-center shrink-0">
                                    {dayNames[day] || day}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                     {times.map((t: string) => (
                                         <span key={t} className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                            {t}
                                         </span>
                                     ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const AdminInstructorDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const navigate = createNavigate(router);
    const isNew = id === 'new';

    const { data: instructors = [], isLoading: instructorsLoading } = useAdminInstructors();
    const { data: settingsData, isLoading: settingsLoading } = useAdminCWSettings();
    const { 
        createInstructor, updateInstructor, approveInstructorProfileUpdate, 
        rejectInstructorProfileUpdate, approveInstructorSchedule, rejectInstructorSchedule 
    } = useInstructorMutations();
    
    const [profile, setProfile] = useState<Partial<Instructor>>({ name: '', specialty: '', slug: '', bio: '' });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    
    const [adminFeedback, setAdminFeedback] = useState('');
    const [approvedRates, setApprovedRates] = useState<{
        package_rates: Record<string, number>,
        service_rates: Record<string, number>
    }>({ package_rates: {}, service_rates: {} });

    const instructor = !isNew ? instructors.find(i => i.id === parseInt(id!)) : null;
    const pendingUpdates = instructor?.pending_profile_data?.updates;
    const pendingSchedule = instructor?.pending_profile_data?.proposed_schedule || {};

    useEffect(() => {
        if (instructor) {
            setProfile(instructor);
            setPreview(instructor.avatar_url || null);
            
            if (instructor.profile_update_status === 'pending' && pendingUpdates) {
                setApprovedRates({
                    package_rates: { ...pendingUpdates.package_rates },
                    service_rates: { ...pendingUpdates.service_rates }
                });
            }
        }
    }, [instructor, pendingUpdates]);

    const isLoading = instructorsLoading || settingsLoading;
    const isSaving = createInstructor.isPending || updateInstructor.isPending;

    if (isLoading && !isNew) return <PageLoader />;
    if (!isNew && !isLoading && !instructor) return <ErrorState message="لم يتم العثور على المدرب" onRetry={() => navigate('/instructors')} />;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setAvatarFile(file);
        if (file) setPreview(URL.createObjectURL(file));
    };
    
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { 
            name: profile.name || 'New Instructor',
            specialty: profile.specialty || '', 
            slug: profile.slug || '', 
            bio: profile.bio || '', 
            avatarFile,
            id: profile.id
        };

        if (isNew) {
            await createInstructor.mutateAsync(payload);
        } else {
            await updateInstructor.mutateAsync(payload);
        }
        navigate('/instructors');
    };

    const handleApprovedRateChange = (type: 'package' | 'service', id: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setApprovedRates(prev => ({
            ...prev,
            [type === 'package' ? 'package_rates' : 'service_rates']: {
                ...prev[type === 'package' ? 'package_rates' : 'service_rates'],
                [id]: numValue
            }
        }));
    };

    const handleApproveWithModifications = async () => {
        if (!instructor || !pendingUpdates) return;
        const finalUpdates = {
            ...pendingUpdates,
            package_rates: approvedRates.package_rates,
            service_rates: approvedRates.service_rates,
            admin_feedback: adminFeedback 
        };
        await approveInstructorProfileUpdate.mutateAsync({
            instructorId: instructor.id,
            modifiedUpdates: finalUpdates
        });
        setAdminFeedback('');
    };

    const handleReject = async () => {
         await rejectInstructorProfileUpdate.mutateAsync({
             instructorId: instructor!.id,
             feedback: adminFeedback
         });
         setAdminFeedback('');
    };

    const renderPricingRow = (itemId: string, itemName: string, currentVal: number, requestedVal: number, type: 'package' | 'service') => {
        const approvedVal = type === 'package' ? approvedRates.package_rates[itemId] : approvedRates.service_rates[itemId];
        const isModified = approvedVal !== requestedVal;
        
        return (
            <TableRow key={`${type}-${itemId}`}>
                <TableCell className="font-medium">{itemName}</TableCell>
                <TableCell className="text-center text-muted-foreground">{currentVal || 0}</TableCell>
                <TableCell className="text-center font-bold text-blue-600">{requestedVal}</TableCell>
                <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                         <ArrowRightCircle size={16} className="text-gray-400" />
                        <Input 
                            type="number" 
                            className={`w-24 h-8 text-center font-bold ${isModified ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-green-400 bg-green-50 text-green-700'}`}
                            value={approvedVal ?? requestedVal} 
                            onChange={(e) => handleApprovedRateChange(type, itemId, e.target.value)}
                        />
                    </div>
                </TableCell>
            </TableRow>
        );
    };

    const hasPricingUpdates = pendingUpdates && (pendingUpdates.package_rates || pendingUpdates.service_rates);

    return (
        <div className="animate-fadeIn space-y-8 max-w-5xl mx-auto pb-20">
            <Link href="/instructors" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold">
                <ArrowLeft size={16} /> العودة لقائمة المدربين
            </Link>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
                    <User /> {isNew ? 'إضافة مدرب جديد' : `إدارة ملف: ${instructor?.name}`}
                </h1>
                {!isNew && (
                    <Button type="submit" form="main-profile-form" loading={isSaving} icon={<Save />}>تحديث البيانات الحالية</Button>
                )}
            </div>
            
            {!isNew && instructor && (
                <div className="space-y-8">
                    
                    {/* Schedule Update Review (Top Priority) */}
                    {instructor.schedule_status === 'pending' && (
                        <Card className="border-4 border-blue-500 shadow-xl bg-blue-50/10" id="schedule-review">
                            <CardHeader className="bg-blue-100 border-b border-blue-200">
                                <CardTitle className="flex items-center gap-2 text-blue-800 font-black"><Clock /> مراجعة تحديث الجدول الأسبوعي</CardTitle>
                                <CardDescription className="text-blue-700">قام المدرب بتعديل أوقات توفره الأسبوعية. يرجى مقارنة الجدولين أدناه.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* الجدول الحالي */}
                                    <ScheduleViewer 
                                        title="الجدول الحالي (القديم)"
                                        schedule={instructor.weekly_schedule} 
                                        isEmptyMessage="الجدول الحالي فارغ"
                                        colorClass="bg-white border-gray-200"
                                    />
                                    
                                    {/* الجدول الجديد */}
                                    <ScheduleViewer 
                                        title="الجدول الجديد (المقترح)"
                                        schedule={pendingSchedule} 
                                        isEmptyMessage="الجدول المقترح فارغ (مسح الكل)"
                                        colorClass="bg-blue-50 border-blue-200 ring-2 ring-blue-500 ring-offset-2"
                                    />
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-4 border-t pt-6">
                                    <Button 
                                        variant="success" 
                                        className="flex-1 h-12 text-lg shadow-md" 
                                        onClick={() => approveInstructorSchedule.mutate({instructorId: instructor.id})} 
                                        loading={approveInstructorSchedule.isPending} 
                                        icon={<Check />}
                                    >
                                        اعتماد الجدول الجديد
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        className="sm:w-1/3 h-12" 
                                        onClick={() => rejectInstructorSchedule.mutate({instructorId: instructor.id})} 
                                        loading={rejectInstructorSchedule.isPending} 
                                        icon={<XCircle />}
                                    >
                                        رفض التغيير
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* --- PRICING & PROFILE UPDATE REQUEST SECTION --- */}
                    {instructor.profile_update_status === 'pending' && pendingUpdates && (
                        <Card className="border-4 border-orange-400 shadow-xl bg-white overflow-hidden" id="profile-review">
                             <CardHeader className="bg-orange-50 border-b border-orange-100">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-orange-800"><FileEdit /> طلب تحديث بيانات/أسعار</CardTitle>
                                        <CardDescription className="text-orange-700">يرجى مراجعة التغييرات المطلوبة في الأسعار أو الملف الشخصي.</CardDescription>
                                    </div>
                                    <div className="text-left bg-white px-3 py-1 rounded-full border border-orange-200">
                                        <p className="text-xs font-bold text-gray-500">تاريخ الطلب: {formatDate(instructor.pending_profile_data?.requested_at)}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* 1. Justification */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-sm font-bold text-gray-700 mb-1">مبررات المدرب:</p>
                                    <p className="text-sm text-gray-600 italic">"{instructor.pending_profile_data?.justification || 'لا يوجد مبرر'}"</p>
                                </div>

                                {/* 2. Pricing Comparison Table */}
                                {hasPricingUpdates && (
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="bg-muted p-3 text-sm font-bold text-center border-b">مقارنة وتعديل الأسعار المطلوبة (صافي المدرب)</div>
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/30">
                                                    <TableHead className="text-right">البند</TableHead>
                                                    <TableHead className="text-center text-gray-500">السعر الحالي</TableHead>
                                                    <TableHead className="text-center text-blue-600">السعر المطلوب</TableHead>
                                                    <TableHead className="text-center text-green-700">السعر المعتمد (قابل للتعديل)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {settingsData?.packages?.map(pkg => {
                                                    const reqVal = pendingUpdates.package_rates?.[pkg.id];
                                                    if (reqVal === undefined) return null;
                                                    const curVal = instructor.package_rates?.[pkg.id] || 0;
                                                    return renderPricingRow(pkg.id.toString(), `باقة: ${pkg.name}`, curVal, reqVal, 'package');
                                                })}
                                                {settingsData?.standaloneServices?.filter(s => s.provider_type === 'instructor').map(svc => {
                                                    const reqVal = pendingUpdates.service_rates?.[svc.id];
                                                    if (reqVal === undefined) return null;
                                                    const curVal = instructor.service_rates?.[svc.id] || 0;
                                                    return renderPricingRow(svc.id.toString(), `خدمة: ${svc.name}`, curVal, reqVal, 'service');
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                                
                                {/* 3. Admin Feedback & Actions */}
                                <div className="grid grid-cols-1 gap-4 border-t pt-6">
                                    <FormField label="ملاحظات الإدارة للمدرب (ستظهر له في لوحته)" htmlFor="adminFeedback">
                                        <Textarea 
                                            id="adminFeedback" 
                                            value={adminFeedback} 
                                            onChange={e => setAdminFeedback(e.target.value)} 
                                            placeholder="مثال: تم قبول أسعار الباقات ولكن تم تعديل سعر الخدمات ليتناسب مع السوق..."
                                            rows={2}
                                        />
                                    </FormField>

                                    <div className="flex gap-4">
                                        <Button variant="success" className="flex-1 h-12 text-lg shadow-md" onClick={handleApproveWithModifications} loading={approveInstructorProfileUpdate.isPending} icon={<Check />}>
                                            اعتماد (بالقيم المحددة أعلاه)
                                        </Button>
                                        <Button variant="destructive" className="w-1/4 h-12" onClick={handleReject} loading={rejectInstructorProfileUpdate.isPending} icon={<XCircle />}>
                                            رفض الطلب بالكامل
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><User /> البيانات الأساسية الحالية (المنشورة)</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <form id="main-profile-form" onSubmit={handleSubmit} className="space-y-6">
                        <FormField label="الصورة الرمزية" htmlFor="avatarFile">
                            <div className="flex items-center gap-4">
                                <Image src={preview || 'https://i.ibb.co/2S4xT8w/male-avatar.png'} alt="Avatar" className="w-20 h-20 rounded-full border shadow-sm" />
                                <Input type="file" id="avatarFile" onChange={handleFileChange} accept="image/*" />
                            </div>
                        </FormField>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="اسم المدرب" htmlFor="name">
                                <Input id="name" name="name" value={profile.name} onChange={handleProfileChange} required />
                            </FormField>
                            <FormField label="التخصص" htmlFor="specialty">
                                <Input id="specialty" name="specialty" value={profile.specialty} onChange={handleProfileChange} />
                            </FormField>
                        </div>
                        <FormField label="معرّف الرابط (Slug)" htmlFor="slug">
                            <Input id="slug" name="slug" value={profile.slug} onChange={handleProfileChange} required dir="ltr" />
                        </FormField>
                        <FormField label="نبذة تعريفية" htmlFor="bio">
                            <Textarea id="bio" name="bio" value={profile.bio} onChange={handleProfileChange} rows={5} />
                        </FormField>
                        <div className="flex justify-end pt-4 border-t">
                             <Button type="submit" loading={isSaving} icon={<Save />}>
                                {isNew ? 'إضافة مدرب' : 'تحديث البيانات المنشورة فوراً'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminInstructorDetailPage;
