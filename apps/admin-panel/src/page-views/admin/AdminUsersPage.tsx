
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAdminUsers, useAdminAllChildProfiles, transformUsersWithRelations, type UserWithParent } from '../../hooks/queries/admin/useAdminUsersQuery';
import { useUserMutations } from '../../hooks/mutations/useUserMutations';
import { Users, Plus, Edit, Trash2, Search, Link as LinkIcon, RefreshCw, User, Baby, GraduationCap, Shield, ShoppingBag, Link2Off, ChevronLeft, ChevronRight, UserCheck, AlertTriangle, Building2 } from 'lucide-react';
import { roleNames } from '../../lib/roles';
import { Button } from '@alrehla/ui/button';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import { Input } from '@alrehla/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import LinkStudentModal from '../../components/admin/LinkStudentModal';
import DataTable from '../../components/admin/ui/DataTable';
import Dropdown from '@alrehla/ui/dropdown-wrapper';
import { useDebounce } from '../../hooks/useDebounce';

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

const AdminUsersPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const searchParams = useSearchParams();
    
    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500); 
    
    // Parse query param for tab or default to 'parents'
    const defaultTab = (searchParams.get('tab') as any) || 'parents';
    const [activeTab, setActiveTab] = useState<'parents' | 'customers' | 'students' | 'staff' | 'publishers'>(defaultTab);

    const roleFilter = useMemo(() => {
        switch(activeTab) {
            case 'parents': return 'parent'; 
            case 'customers': return 'customers'; // Custom filter logic in service
            case 'students': return 'student';
            case 'staff': return 'staff'; // Custom filter logic in service
            case 'publishers': return 'publisher';
            default: return 'all';
        }
    }, [activeTab]);

    // Main Users Query
    const { data, isLoading, error, refetch, isRefetching } = useAdminUsers({
        page,
        pageSize,
        search: debouncedSearch,
        roleFilter
    });
    
    // Backup Query: Fetch all child profiles to ensure linking is detected even if parent isn't on current page
    const { data: allChildProfiles = [] } = useAdminAllChildProfiles();

    const { bulkDeleteUsers } = useUserMutations();
    
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [selectedUserForLink, setSelectedUserForLink] = useState<UserWithParent | null>(null);

    useEffect(() => {
        setPage(1);
    }, [activeTab, debouncedSearch]);

    // تحويل البيانات ودمجها
    const enrichedUsers = useMemo(() => {
        if (!data?.users) return [];
        
        // نستخدم الأطفال من الاستعلام الرئيسي، ولكن ندمج معهم القائمة الكاملة للأطفال (كاحتياط) لضمان العثور على الرابط
        // هذا يحل مشكلة عدم ظهور "مرتبط" إذا فشل الاستعلام الجزئي
        const combinedChildren = [...(data.relatedChildren || []), ...allChildProfiles];
        // إزالة التكرار
        const uniqueChildrenMap = new Map();
        combinedChildren.forEach(c => uniqueChildrenMap.set(c.id, c));
        const uniqueChildren = Array.from(uniqueChildrenMap.values());

        return transformUsersWithRelations(data.users, uniqueChildren, data.parentsMap || new Map());
    }, [data, allChildProfiles]);

    const totalPages = data?.count ? Math.ceil(data.count / pageSize) : 1;

    const handleDelete = (userId: string, name: string) => {
        if (window.confirm(`هل أنت متأكد من حذف المستخدم "${name}"؟ سيتم حذف كافة البيانات المرتبطة ولن يتمكن من الدخول ثانية.`)) {
            bulkDeleteUsers.mutate({ userIds: [userId] });
        }
    };

    const handleOpenLinkModal = (user: UserWithParent) => {
        setSelectedUserForLink(user);
        setLinkModalOpen(true);
    };
    
    const addUserOptions = [
        { 
            label: 'إضافة عميل / ولي أمر', 
            action: () => navigate('/users/new?type=customer'),
            icon: <User size={16} />
        },
        { 
            label: 'إضافة دار نشر', 
            action: () => navigate('/users/new?type=publisher'),
            icon: <Building2 size={16} />
        },
        { 
            label: 'إضافة موظف / إداري', 
            action: () => navigate('/users/new?type=staff'),
            icon: <Shield size={16} />
        }
    ];

    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <div className="animate-fadeIn space-y-8">
            <LinkStudentModal 
                isOpen={linkModalOpen} 
                onClose={() => { setLinkModalOpen(false); setSelectedUserForLink(null); refetch(); }} 
                user={selectedUserForLink} 
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-extrabold text-foreground">إدارة المستخدمين</h1>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => refetch()} variant="ghost" icon={<RefreshCw className={isRefetching ? 'animate-spin' : ''} size={16}/>}>تحديث البيانات</Button>
                    <Dropdown 
                        trigger={
                            <span className="flex items-center gap-2">
                                <Plus size={18} /> إضافة مستخدم
                            </span>
                        }
                        items={addUserOptions}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> قاعدة البيانات</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <Input 
                                placeholder="بحث بالاسم أو البريد الإلكتروني..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="pr-10"
                            />
                        </div>

                        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
                            <TabsList className="w-full justify-start bg-muted/50 p-1 flex-wrap h-auto">
                                <TabsTrigger value="parents" className="gap-2"><Baby size={16}/> أولياء الأمور</TabsTrigger>
                                <TabsTrigger value="customers" className="gap-2"><ShoppingBag size={16}/> عملاء (أخرى)</TabsTrigger>
                                <TabsTrigger value="students" className="gap-2"><GraduationCap size={16}/> حسابات الطلاب</TabsTrigger>
                                <TabsTrigger value="publishers" className="gap-2"><Building2 size={16}/> شركاء (دور النشر)</TabsTrigger>
                                <TabsTrigger value="staff" className="gap-2"><Shield size={16}/> الموظفون والمدربون</TabsTrigger>
                            </TabsList>

                            <TabsContent value={activeTab}>
                                <DataTable<UserWithParent>
                                    data={enrichedUsers}
                                    columns={[
                                        {
                                            accessorKey: 'name',
                                            header: 'الاسم',
                                            cell: ({ row }) => (
                                                <div>
                                                    <div className="font-medium">{row.name}</div>
                                                    {/* عرض حالة الربط للطالب */}
                                                    {row.role === 'student' && (
                                                        <div className="mt-1">
                                                            {row.relatedChildName ? (
                                                                <div className="flex items-start gap-1 text-[10px] text-blue-700 bg-blue-50 px-2 py-1 rounded w-fit border border-blue-100" title={`البريد: ${row.parentEmail || 'غير متوفر'}`}>
                                                                    <UserCheck size={12} className="mt-0.5" />
                                                                    <div>
                                                                        <span className="block font-bold">مرتبط بـ: {row.relatedChildName}</span>
                                                                        {row.parentName ? (
                                                                            <span className="block opacity-75 text-[9px]">ولي الأمر: {row.parentName}</span>
                                                                        ) : (
                                                                            <span className="block text-orange-600 font-bold text-[9px] flex items-center gap-1">
                                                                                <AlertTriangle size={8} /> بيانات الأب غير محملة
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-[9px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full w-fit border border-red-100 font-bold">
                                                                    <Link2Off size={10} />
                                                                    <span>غير مرتبط بولي أمر!</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        },
                                        {
                                            accessorKey: 'email',
                                            header: 'البريد الإلكتروني',
                                            cell: ({ value }) => <span className="text-xs font-mono">{value}</span>
                                        },
                                        {
                                            accessorKey: 'role',
                                            header: 'الرتبة',
                                            cell: ({ value }) => (
                                                <span className={`inline-flex w-fit items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    value === 'student' ? 'bg-indigo-100 text-indigo-800' : 
                                                    value === 'parent' ? 'bg-green-100 text-green-800' :
                                                    value === 'publisher' ? 'bg-amber-100 text-amber-800' :
                                                    value === 'instructor' ? 'bg-orange-100 text-orange-800' :
                                                    value === 'user' ? 'bg-gray-100 text-gray-800' : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {roleNames[value as keyof typeof roleNames]}
                                                </span>
                                            )
                                        },
                                        {
                                            accessorKey: 'totalChildrenCount',
                                            header: 'بيانات مرتبطة',
                                            cell: ({ row }) => {
                                                if (row.role === 'student') return <span className="text-[10px] text-muted-foreground">-</span>;
                                                if (row.role === 'publisher') return <span className="text-[10px] text-muted-foreground">ملف الدار + المنتجات</span>;
                                                
                                                if (row.totalChildrenCount > 0) {
                                                    return (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-bold text-gray-700">{row.totalChildrenCount} ملف طفل</span>
                                                        </div>
                                                    );
                                                }
                                                return <span className="text-[10px] text-muted-foreground italic">لا يوجد أطفال</span>;
                                            }
                                        }
                                    ]}
                                    renderRowActions={(user) => (
                                        <div className="flex items-center gap-1">
                                            {user.role === 'student' && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleOpenLinkModal(user)} 
                                                    title={user.relatedChildName ? "تعديل الربط" : "ربط بولي أمر"}
                                                    className={!user.relatedChildName ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : ""}
                                                >
                                                    <LinkIcon size={18} />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/users/${user.id}`)} title="تعديل"><Edit size={18} /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(user.id, user.name)} title="حذف"><Trash2 size={18} /></Button>
                                        </div>
                                    )}
                                />
                                
                                {/* Pagination Controls */}
                                <div className="flex justify-between items-center mt-4 border-t pt-4">
                                    <div className="text-sm text-gray-500">
                                        صفحة {page} من {totalPages} (إجمالي {data?.count} سجل)
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1 || isLoading}
                                        >
                                            <ChevronRight className="h-4 w-4 rtl:rotate-180" /> السابق
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages || isLoading}
                                        >
                                            التالي <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminUsersPage;
