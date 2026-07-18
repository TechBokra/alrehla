
import React, { useState, useMemo } from 'react';
import { Package, Plus, Edit, Trash2, Table as TableIcon, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminCWSettings } from '../../hooks/queries/admin/useAdminSettingsQuery';
import { useCreativeWritingSettingsMutations } from '../../hooks/mutations/useCreativeWritingSettingsMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import type { CreativeWritingPackage } from '../../lib/database.types';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import SortableTableHead from '../../components/admin/ui/SortableTableHead';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import ComparisonCriteriaManager from '../../components/admin/ComparisonCriteriaManager';

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

const AdminCreativeWritingPackagesPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const { data, isLoading, error, refetch } = useAdminCWSettings();
    const { deletePackage } = useCreativeWritingSettingsMutations();

    const [activeTab, setActiveTab] = useState('packages');
    const [sortConfig, setSortConfig] = useState<{ key: keyof CreativeWritingPackage; direction: 'asc' | 'desc' } | null>({ key: 'price', direction: 'asc' });

    const packages = useMemo(() => {
        let sortableItems = [...(data?.packages || [])];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data?.packages, sortConfig]);

    const handleDeletePackage = async (packageId: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الباقة؟ لا يمكن حذف الباقة إذا كانت مرتبطة بحجوزات موجودة.')) {
            try {
                await deletePackage.mutateAsync({ packageId });
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    const handleSort = (key: keyof CreativeWritingPackage) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    if (isLoading) return <PageLoader />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-foreground">إعدادات باقات بداية الرحلة</h1>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="packages"><Package className="ml-2" size={16}/> الباقات</TabsTrigger>
                    <TabsTrigger value="criteria"><TableIcon className="ml-2" size={16}/> معايير المقارنة</TabsTrigger>
                </TabsList>

                <TabsContent value="packages">
                    <div className="flex justify-end mb-4">
                         <Button onClick={() => navigate('/creative-writing-packages/new')} icon={<Plus size={18} />}>
                            إضافة باقة
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><List /> قائمة الباقات الحالية</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <SortableTableHead<CreativeWritingPackage> sortKey="name" label="الباقة" sortConfig={sortConfig} onSort={handleSort} />
                                            <SortableTableHead<CreativeWritingPackage> sortKey="sessions" label="الجلسات" sortConfig={sortConfig} onSort={handleSort} />
                                            <SortableTableHead<CreativeWritingPackage> sortKey="price" label="السعر" sortConfig={sortConfig} onSort={handleSort} />
                                            <TableHead>إجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {packages.map((pkg: CreativeWritingPackage) => (
                                            <TableRow key={pkg.id}>
                                                <TableCell className="font-semibold">{pkg.name} {pkg.popular && <span className="text-xs text-primary">(الأكثر شيوعاً)</span>}</TableCell>
                                                <TableCell>{pkg.sessions}</TableCell>
                                                <TableCell className="font-bold">{pkg.price === 0 ? 'مجانية' : `${pkg.price} ج.م`}</TableCell>
                                                <TableCell className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/creative-writing-packages/${pkg.id}`)} title="تعديل"><Edit size={20} /></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeletePackage(pkg.id)} title="حذف" loading={deletePackage.isPending}><Trash2 size={20} /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="criteria">
                     <ComparisonCriteriaManager items={data?.comparisonItems || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminCreativeWritingPackagesPage;
