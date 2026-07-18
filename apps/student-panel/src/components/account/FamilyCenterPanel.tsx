"use client";


import React, { useState, useMemo } from 'react';
import { useUserAccountData, type EnrichedChildProfile } from '../../hooks/queries/user/useUserDataQuery';
import { useUserMutations } from '../../hooks/mutations/useUserMutations';
import { useAuth } from '../../contexts/AuthContext';
import { Users, UserPlus, Info } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import EmptyState from './EmptyState';
import ChildDashboardCard from './ChildDashboardCard';
import ChildForm from './ChildForm';
import StudentAccountForm from './StudentAccountForm';
import PageLoader from '@alrehla/ui/page-loader';

type ViewMode = 'list' | 'child-form' | 'student-form';

const FamilyCenterPanel: React.FC = () => {
    const { currentUser } = useAuth();
    const { data: accountData, isLoading } = useUserAccountData();
    const { deleteChildProfile } = useUserMutations();

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedChild, setSelectedChild] = useState<EnrichedChildProfile | null>(null);
    
    const childProfiles = accountData?.childProfiles || [];
    const { userOrders = [], userBookings = [], userSubscriptions = [], allBadges = [], childBadges = [] } = accountData || {};
    
    const activityByChildId = useMemo(() => {
        const map = new Map<number, { orders: any[], bookings: any[], subscriptions: any[] }>();
        childProfiles.forEach(child => {
            map.set(child.id, { orders: [], bookings: [], subscriptions: [] });
        });
        userOrders.forEach(o => map.has(o.child_id) && map.get(o.child_id)!.orders.push(o));
        userBookings.forEach(b => map.has(b.child_id) && map.get(b.child_id)!.bookings.push(b));
        userSubscriptions.forEach(s => map.has(s.child_id) && map.get(s.child_id)!.subscriptions.push(s));
        return map;
    }, [childProfiles, userOrders, userBookings, userSubscriptions]);

    const handleAddChild = () => {
        setSelectedChild(null);
        setViewMode('child-form');
    };

    const handleEditChild = (child: EnrichedChildProfile) => {
        setSelectedChild(child);
        setViewMode('child-form');
    };
    
    const handleDeleteChild = (childId: number) => {
        if(window.confirm('تنبيه: سيتم حذف كافة البيانات المرتبطة بهذا الطفل. هل أنت متأكد؟')) {
            deleteChildProfile.mutate({ childId });
        }
    };

    const handleCreateStudentAccount = (child: EnrichedChildProfile) => {
        setSelectedChild(child);
        setViewMode('student-form');
    };

    if (isLoading) return <div className="p-8 bg-white rounded-2xl shadow-lg"><PageLoader text="جاري تحميل بيانات العائلة..." /></div>;

    if (viewMode === 'child-form') return <div className="bg-white p-8 rounded-2xl shadow-lg"><ChildForm childToEdit={selectedChild} onCancel={() => setViewMode('list')} onSuccess={() => setViewMode('list')} /></div>;
    
    // Pass parentEmail to enable auto-generation
    if (viewMode === 'student-form' && selectedChild) return <div className="bg-white p-8 rounded-2xl shadow-lg"><StudentAccountForm childProfile={selectedChild} parentEmail={currentUser?.email} onCancel={() => setViewMode('list')} onSuccess={() => setViewMode('list')} /></div>;

    return (
        <>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 pb-4 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <Users /> المركز العائلي
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">تفعيل المركز العائلي يتيح لك إنشاء حسابات تعليمية مستقلة لأطفالك.</p>
                    </div>
                    {childProfiles.length > 0 && <Button onClick={handleAddChild} icon={<UserPlus size={18} />} size="sm">إضافة طفل</Button>}
                </div>
                
                {childProfiles.length > 0 ? (
                    <div className="space-y-8 animate-fadeIn">
                        {childProfiles.map(child => (
                           <ChildDashboardCard 
                                key={child.id}
                                child={child}
                                childActivity={activityByChildId.get(child.id) || { orders: [], bookings: [], subscriptions: [] }}
                                allBadges={allBadges}
                                childBadges={childBadges}
                                onEdit={handleEditChild}
                                onDelete={handleDeleteChild}
                                onCreateStudentAccount={handleCreateStudentAccount}
                           />
                        ))}
                    </div>
                ) : (
                    <EmptyState 
                        icon={<Users className="w-12 h-12 text-gray-400" />}
                        title="ابدأ تفعيل مركزك العائلي"
                        message="بإضافة ملف طفلك الأول، ستتحول إلى حساب ولي أمر وتفتح لك ميزات المتابعة والربط التعليمي."
                        actionText="إضافة طفل وبدء التفعيل"
                        onAction={handleAddChild}
                    />
                )}

                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-sm text-blue-700">
                    <Info className="flex-shrink-0 mt-0.5" size={18} />
                    <p>ملاحظة: طلب منتجات باسم طفل لا يعني إنشاء ملف عائلي. لإدارة رحلة طفلك التعليمية، يرجى إنشاء ملف له هنا أولاً.</p>
                </div>
            </div>
        </>
    );
};

export default FamilyCenterPanel;
