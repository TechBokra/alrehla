
import React, { useState, useMemo } from 'react';
import { Sparkles, Plus, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminCWSettings } from '../../hooks/queries/admin/useAdminSettingsQuery';
import { useCreativeWritingSettingsMutations } from '../../hooks/mutations/useCreativeWritingSettingsMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import type { StandaloneService } from '../../lib/database.types';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import SortableTableHead from '../../components/admin/ui/SortableTableHead';

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

const AdminCreativeWritingServicesPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const { data, isLoading, error, refetch } = useAdminCWSettings();
    const { deleteStandaloneService } = useCreativeWritingSettingsMutations();

    const [sortConfig, setSortConfig] = useState<{ key: keyof StandaloneService; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

    const standaloneServices = useMemo(() => {
        let sortableItems = [...(data?.standaloneServices || [])];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data?.standaloneServices, sortConfig]);

    const handleDeleteService = async (serviceId: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
            await deleteStandaloneService.mutateAsync({ serviceId });
        }
    };

    const handleSort = (key: keyof StandaloneService) => {
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
                <h1 className="text-3xl font-extrabold text-foreground">إدارة الخدمات الإبداعية</h1>
                <Button onClick={() => navigate('/creative-writing-services/new')} icon={<Plus size={18} />}>
                    إضافة خدمة
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles /> قائمة الخدمات</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead<StandaloneService> sortKey="name" label="الخدمة" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<StandaloneService> sortKey="category" label="الفئة" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<StandaloneService> sortKey="provider_type" label="مقدم الخدمة" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<StandaloneService> sortKey="price" label="السعر" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {standaloneServices.map((service: StandaloneService) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-semibold">{service.name}</TableCell>
                                        <TableCell>{service.category}</TableCell>
                                        <TableCell>{service.provider_type === 'company' ? 'الشركة' : 'المدرب'}</TableCell>
                                        <TableCell className="font-bold">{service.price} ج.م</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/creative-writing-services/${service.id}`)} title="تعديل"><Edit size={20} /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteService(service.id)} title="حذف"><Trash2 size={20} /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminCreativeWritingServicesPage;