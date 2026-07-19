
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useUserMutations } from '../../hooks/mutations/useUserMutations';
import { useAdminUsers, useAdminAllChildProfiles, transformUsersWithRelations } from '../../hooks/queries/admin/useAdminUsersQuery';
import { roleNames, STAFF_ROLES, CUSTOMER_ROLES } from '../../lib/roles';
import type { UserRole } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Select } from '@alrehla/ui/native-select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@alrehla/ui/card';
import { ArrowLeft, Save, Shield, Briefcase, GraduationCap, Link as LinkIcon, AlertTriangle, Trash2, Info, Building2 } from 'lucide-react';
import PageLoader from '@alrehla/ui/page-loader';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '@alrehla/ui/modal';

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

// تعريف الواجهة لحل مشاكل الأنواع
interface UserFormData {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    phone: string;
    address: string;
}

const AdminUserFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const router = useRouter();
    const navigate = createNavigate(router);
    const isNew = !id;
    const { currentUser: loggedInAdmin } = useAuth();

    const type = searchParams.get('type') || 'customer';
    const isStaffFlow = type === 'staff';
    const isPublisherFlow = type === 'publisher';

    // Set default role based on flow
    let defaultRole: UserRole = 'user';
    if (isStaffFlow) defaultRole = 'instructor';
    if (isPublisherFlow) defaultRole = 'publisher';

    // Fix: Provide arguments to useAdminUsers and extract users correctly
    const { data: usersData, isLoading: usersLoading } = useAdminUsers({ page: 1, pageSize: 1000, search: '', roleFilter: 'all' });
    const users = usersData?.users || [];
    const parentsMap = usersData?.parentsMap || new Map();
    
    const { data: children = [] } = useAdminAllChildProfiles();
    const { updateUser, createUser, bulkDeleteUsers } = useUserMutations(); 

    // استخدام الواجهة المحددة للحالة
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        email: '',
        password: '',
        role: defaultRole,
        phone: '',
        address: ''
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const enrichedUser = useMemo(() => {
        if (isNew) return null;
        const allEnriched = transformUsersWithRelations(users, children, parentsMap);
        return allEnriched.find(u => u.id === id);
    }, [users, children, id, isNew, parentsMap]);

    useEffect(() => {
        if (!isNew && users.length > 0) {
            const userToEdit = users.find(u => u.id === id);
            if (userToEdit) {
                setFormData({
                    name: userToEdit.name,
                    email: userToEdit.email,
                    password: '', 
                    role: userToEdit.role,
                    phone: userToEdit.phone || '',
                    address: userToEdit.address || ''
                });
            }
        }
    }, [id, isNew, users]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isNew) {
                await createUser.mutateAsync(formData as any);
            } else {
                await updateUser.mutateAsync({ id: id!, ...formData });
            }
            navigate('/users');
        } catch (error) {
            // Error handling via mutation feedback
        }
    };

    const handleConfirmDelete = async () => {
        if (!id) return;
        try {
            await bulkDeleteUsers.mutateAsync({ userIds: [id] });
            navigate('/users');
        } catch (error) {
            // Error handled in hook
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const isSaving = createUser.isPending || updateUser.isPending || bulkDeleteUsers.isPending;

    if (usersLoading && !isNew) return <PageLoader />;

    const deleteWarningMessage = enrichedUser?.role === 'student' 
        ? `أنت على وشك حذف حساب الطالب "${formData.name}". سيؤدي هذا إلى فك ارتباطه بملف الطفل فوراً ولن يتمكن من الدخول إلى المنصة مرة أخرى.`
        : `أنت على وشك حذف حساب المستخدم "${formData.name}". سيتم حذف كافة البيانات المرتبطة به نهائياً ولا يمكن التراجع عن هذا الإجراء.`;

    const getIcon = () => {
        if (enrichedUser?.role === 'student') return <GraduationCap className="text-blue-500"/>;
        if (isPublisherFlow || enrichedUser?.role === 'publisher') return <Building2 className="text-amber-500"/>;
        if (isStaffFlow) return <Shield className="text-primary"/>;
        return <Briefcase className="text-pink-500"/>;
    };

    const getTitle = () => {
        if (isNew) {
            if (isPublisherFlow) return 'إضافة دار نشر جديدة';
            if (isStaffFlow) return 'إضافة موظف جديد';
            return 'إضافة عميل جديد';
        }
        return `تعديل حساب: ${formData.name}`;
    }

    return (
        <div className="animate-fadeIn space-y-8 max-w-4xl mx-auto">
            {/* نافذة تأكيد الحذف */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="تأكيد حذف الحساب"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} disabled={bulkDeleteUsers.isPending}>
                            إلغاء
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleConfirmDelete} 
                            loading={bulkDeleteUsers.isPending}
                            icon={<Trash2 size={16} />}
                        >
                            تأكيد وحذف
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">هل أنت متأكد تماماً؟</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            {deleteWarningMessage}
                        </p>
                    </div>
                </div>
            </Modal>

            <div className="flex justify-between items-center">
                <Link href="/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold">
                    <ArrowLeft size={16} /> العودة لقائمة المستخدمين
                </Link>
                
                {!isNew && id !== loggedInAdmin?.id && (
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => setIsDeleteModalOpen(true)} 
                        loading={bulkDeleteUsers.isPending}
                        icon={<Trash2 size={16} />}
                    >
                        حذف الحساب نهائياً
                    </Button>
                )}
            </div>

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
                    {getIcon()}
                    {getTitle()}
                </h1>
                <Button type="submit" form="user-form" loading={isSaving} icon={<Save size={18} />}>حفظ التغييرات</Button>
            </div>

            <form id="user-form" onSubmit={handleSubmit} className="space-y-8">
                {enrichedUser?.parentName && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6 flex gap-4 items-center">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600"><LinkIcon size={24} /></div>
                            <div className="flex-grow">
                                <p className="font-bold text-blue-900">هذا الحساب تابع لولي الأمر: {enrichedUser.parentName}</p>
                                <p className="text-sm text-blue-700">البريد الإلكتروني للأب/الأم: {enrichedUser.parentEmail}</p>
                            </div>
                            <div className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold">حساب مرتبـط</div>
                        </CardContent>
                    </Card>
                )}

                {enrichedUser?.role === 'student' && !enrichedUser?.parentName && (
                    <Card className="bg-red-50 border-red-200 border-2">
                        <CardContent className="pt-6 flex gap-4 items-center">
                            <div className="bg-red-100 p-2 rounded-full text-red-600"><AlertTriangle size={24} /></div>
                            <div>
                                <p className="font-bold text-red-900">حساب طالب غير مرتبط (يتيم)</p>
                                <p className="text-sm text-red-700">هذا الحساب لا يتبع لأي ولي أمر حالياً. يمكنك حذفه إذا كان مكرراً أو ناتجاً عن خطأ في النظام.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
                        <CardDescription>البريد الإلكتروني يجب أن يكون فريداً وغير مستخدم في أي حساب آخر.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="الاسم الكامل / اسم الجهة" htmlFor="name">
                                <Input id="name" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </FormField>
                            <FormField label="البريد الإلكتروني" htmlFor="email">
                                <Input id="email" name="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={!isNew} />
                            </FormField>
                        </div>
                        
                        {/* New Password Field - Only visible when creating a NEW user */}
                        {isNew && (
                            <FormField label="كلمة المرور*" htmlFor="password">
                                <Input 
                                    id="password" 
                                    name="password" 
                                    type="password" 
                                    value={formData.password || ''} 
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                    required 
                                    placeholder="8 أحرف على الأقل"
                                    minLength={8}
                                />
                                <div className="mt-2 flex items-start gap-2 text-xs text-blue-700 bg-blue-50 p-2 rounded-md">
                                    <Info size={16} className="flex-shrink-0" />
                                    <span>سيتم إنشاء هذا الحساب في Clerk مع بريد وكلمة مرور. يرجى حفظ كلمة المرور وإعطائها للمستخدم.</span>
                                </div>
                            </FormField>
                        )}

                        <FormField label="الدور / الرتبة" htmlFor="role">
                            <Select 
                                id="role" 
                                name="role" 
                                value={formData.role} 
                                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                disabled={enrichedUser?.role === 'student' || (enrichedUser && (enrichedUser.totalChildrenCount ?? 0) > 0)}
                            >
                                <optgroup label="العملاء">
                                    {CUSTOMER_ROLES.map(role => (
                                        <option key={role} value={role}>{roleNames[role]}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="فريق العمل والإدارة">
                                    {STAFF_ROLES.map(role => (
                                        <option key={role} value={role}>{roleNames[role]}</option>
                                    ))}
                                </optgroup>
                            </Select>
                            {enrichedUser && (enrichedUser.totalChildrenCount ?? 0) > 0 && <p className="text-xs text-orange-600 mt-1 italic">لا يمكن تغيير رتبة ولي الأمر لوجود أطفال مرتبطين.</p>}
                        </FormField>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <FormField label="رقم الهاتف" htmlFor="phone">
                                <Input id="phone" name="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="اختياري" />
                            </FormField>
                            <FormField label="العنوان" htmlFor="address">
                                <Input id="address" name="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="اختياري" />
                            </FormField>
                        </div>
                        
                        {!isNew && (
                            <div className="pt-4 border-t">
                                <h4 className="font-bold text-sm text-gray-700 mb-2">تحديث الأمان</h4>
                                <FormField label="كلمة مرور جديدة (اختياري)" htmlFor="password">
                                    <Input id="password" name="password" type="password" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="اتركه فارغاً لعدم التغيير" minLength={8} />
                                </FormField>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

export default AdminUserFormPage;
