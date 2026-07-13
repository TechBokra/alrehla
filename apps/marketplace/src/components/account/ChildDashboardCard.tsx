"use client";


import React, { useMemo, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { Edit, UserPlus, ShoppingBag, BookOpen, Star, ArrowLeft, Award, Lock, Mail, Key, Trash2, Link2Off, Save, X, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Order, CreativeWritingBooking, Subscription, Badge, ChildBadge } from '../../lib/database.types';
import type { EnrichedChildProfile } from '../../hooks/queries/user/useUserDataQuery';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import FormField from '../ui/FormField';
import { formatDate, calculateAge } from '../../utils/helpers';
import Image from '../ui/Image';
import { useUserMutations } from '../../hooks/mutations/useUserMutations';

interface ChildDashboardCardProps {
    child: EnrichedChildProfile;
    childActivity: {
        orders: Order[];
        bookings: CreativeWritingBooking[];
        subscriptions: Subscription[];
    };
    allBadges: Badge[];
    childBadges: ChildBadge[];
    onEdit: (child: EnrichedChildProfile) => void;
    onDelete: (childId: number) => void;
    onCreateStudentAccount: (child: EnrichedChildProfile) => void;
}

const ActivityIcon: React.FC<{type: string}> = ({type}) => {
     switch (type) {
        case 'order': return <ShoppingBag size={18} className="text-pink-500"/>;
        case 'booking': return <BookOpen size={18} className="text-purple-500"/>;
        case 'subscription': return <Star size={18} className="text-orange-500"/>;
        default: return null;
    }
}

const ChildDashboardCard: React.FC<ChildDashboardCardProps> = ({ child, childActivity, allBadges, childBadges, onEdit, onDelete, onCreateStudentAccount }) => {
    const { unlinkStudentFromChildProfile, resetStudentPassword } = useUserMutations();
    
    // Inline Password Reset State
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const recentActivity = useMemo(() => {
        const { orders, bookings, subscriptions } = childActivity;
        const allItems = [
            ...orders.map(o => ({ type: 'order' as const, date: o.order_date, summary: o.item_summary, id: o.id, link: `/account`})),
            ...bookings.map(b => ({ type: 'booking' as const, date: b.created_at, summary: b.package_name, id: b.id, link: `/journey/${b.id}` })),
            ...subscriptions.map(s => ({ type: 'subscription' as const, date: s.start_date, summary: 'صندوق الرحلة الشهري', id: s.id, link: '/account' }))
        ];
        return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
    }, [childActivity]);

    const earnedBadges = useMemo(() => {
        const earned = childBadges
            .filter(cb => cb.child_id === child.id)
            .sort((a,b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime());

        return earned.map(cb => allBadges.find(b => b.id === cb.badge_id)).filter(b => b !== undefined) as Badge[];
    }, [child, childBadges, allBadges]);
    
    const age = calculateAge(child.birth_date);
    
    const handleUnlink = async () => {
        if(window.confirm(`هل أنت متأكد من فك ارتباط حساب الطالب بملف "${child.name}"؟\n\nاستخدم هذا الخيار إذا كان الطالب يواجه مشاكل في الدخول أو يظهر كـ "غير مرتبط" في لوحته.\n\nسيحتاج الطالب لإنشاء حساب جديد للدخول.`)) {
            await unlinkStudentFromChildProfile.mutateAsync({ childProfileId: child.id });
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        
        if (newPassword.length < 6) {
             setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
             return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('كلمتا المرور غير متطابقتين.');
            return;
        }

        if (!child.student_user_id) return;

        try {
            await resetStudentPassword.mutateAsync({
                studentUserId: child.student_user_id,
                newPassword
            });
            setPasswordSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setPasswordSuccess(false);
                setIsResettingPassword(false);
            }, 2000);
        } catch (error: any) {
            setPasswordError(error.message || 'حدث خطأ أثناء تغيير كلمة المرور.');
        }
    };

    const closePasswordReset = () => {
        setIsResettingPassword(false);
        setPasswordError(null);
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="bg-gray-50 p-6 rounded-2xl shadow-md border animate-fadeIn group">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start gap-4 border-b pb-4">
                <Image 
                    src={child.avatar_url || '/images/male-avatar.png'} 
                    alt={child.name} 
                    className="w-24 h-24 rounded-full border-4 border-white shadow-md flex-shrink-0"
                />
                <div className="flex-grow w-full">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">{child.name}</h3>
                            <p className="text-gray-500 text-sm mb-2">{age !== null ? `${age} سنوات` : 'غير محدد'}</p>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(child)} aria-label={`تعديل ${child.name}`} className="text-muted-foreground hover:text-blue-600">
                                <Edit size={18} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(child.id)} aria-label={`حذف ${child.name}`} className="text-muted-foreground hover:text-red-600">
                                <Trash2 size={18} />
                            </Button>
                        </div>
                    </div>
                    
                    {/* حساب الطالب والبريد الإلكتروني المخصص */}
                    <div className="mt-2 p-3 bg-white rounded-lg border border-gray-100 shadow-sm relative transition-all duration-300">
                        {child.student_user_id ? (
                            <>
                                {!isResettingPassword ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                <span className="text-xs font-bold text-green-700">حساب طالب مرتبط</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" onClick={() => setIsResettingPassword(true)} className="h-7 text-xs px-2" icon={<Key size={12} />}>
                                                    تغيير كلمة المرور
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={handleUnlink} className="h-7 text-xs px-2 text-red-500 hover:text-red-700 hover:bg-red-50" title="فك الارتباط لإصلاح مشاكل الدخول">
                                                    <Link2Off size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-sm bg-muted/30 p-2 rounded border border-dashed flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-gray-700 font-mono text-xs overflow-hidden">
                                                <Mail size={14} className="text-primary flex-shrink-0"/>
                                                <span className="truncate" dir="ltr">{child.student_email || 'البريد قيد التحديث...'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Inline Password Reset Form */
                                    <form onSubmit={handlePasswordReset} className="space-y-3 animate-fadeIn bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-bold text-yellow-800 flex items-center gap-2">
                                                <Lock size={14}/> تعيين كلمة مرور جديدة
                                            </h4>
                                            <Button type="button" variant="ghost" size="icon" onClick={closePasswordReset} className="h-6 w-6 text-yellow-700 hover:bg-yellow-100">
                                                <X size={14} />
                                            </Button>
                                        </div>

                                        {passwordSuccess ? (
                                            <div className="flex flex-col items-center justify-center py-4 text-green-600">
                                                <CheckCircle size={32} className="mb-2" />
                                                <p className="font-bold text-sm">تم التغيير بنجاح</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <FormField label="كلمة المرور الجديدة" htmlFor={`new-pass-${child.id}`} className="mb-0">
                                                        <Input 
                                                            type="password" 
                                                            id={`new-pass-${child.id}`} 
                                                            value={newPassword} 
                                                            onChange={(e) => setNewPassword(e.target.value)} 
                                                            className="h-8 text-sm bg-white"
                                                            placeholder="******"
                                                            minLength={6}
                                                        />
                                                    </FormField>
                                                    <FormField label="تأكيد الكلمة" htmlFor={`confirm-pass-${child.id}`} className="mb-0">
                                                        <Input 
                                                            type="password" 
                                                            id={`confirm-pass-${child.id}`} 
                                                            value={confirmPassword} 
                                                            onChange={(e) => setConfirmPassword(e.target.value)} 
                                                            className="h-8 text-sm bg-white"
                                                        />
                                                    </FormField>
                                                </div>
                                                
                                                {passwordError && (
                                                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 flex items-center gap-1">
                                                        <AlertTriangle size={12} /> {passwordError}
                                                    </div>
                                                )}

                                                <div className="flex justify-end pt-2">
                                                    <Button type="submit" size="sm" className="h-8 text-xs bg-yellow-600 hover:bg-yellow-700 text-white" loading={resetStudentPassword.isPending} icon={<Save size={12}/>}>
                                                        حفظ التغيير
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </form>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground italic">لا يوجد حساب دخول للطالب</span>
                                <Button variant="outline" size="sm" onClick={() => onCreateStudentAccount(child)} icon={<UserPlus size={14} />} className="h-8 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                                    إنشاء حساب
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                {/* Stats */}
                <div className="md:col-span-1 space-y-4">
                     <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-pink-100 text-pink-600 rounded-full"><ShoppingBag /></div>
                        <div>
                            <p className="text-xl font-bold">{childActivity.orders.length}</p>
                            <p className="text-xs text-gray-500">قصص "إنها لك"</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full"><BookOpen /></div>
                        <div>
                            <p className="text-xl font-bold">{childActivity.bookings.length}</p>
                            <p className="text-xs text-gray-500">رحلات "بداية الرحلة"</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-full"><Award /></div>
                        <div>
                            <p className="text-xl font-bold">{earnedBadges.length}</p>
                            <p className="text-xs text-gray-500">إنجازات</p>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="md:col-span-2">
                    <h4 className="font-bold text-gray-700 mb-3">أحدث الأنشطة</h4>
                    <div className="space-y-3">
                         {recentActivity.length > 0 ? recentActivity.map(item => (
                            <Link to={item.link} state={{ defaultTab: 'myLibrary' }} key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                                <div className="flex-shrink-0"><ActivityIcon type={item.type}/></div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-sm text-gray-800">{item.summary}</p>
                                    <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                                </div>
                                <ArrowLeft size={16} className="text-gray-400"/>
                            </Link>
                         )) : <p className="text-sm text-center text-gray-500 py-4">لا توجد أنشطة مسجلة لهذا الطفل بعد.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ChildDashboardCard);
