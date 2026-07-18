
import React, { useState, useEffect, useMemo } from 'react';
import { useAdminInstructors } from '../../hooks/queries/admin/useAdminInstructorsQuery';
import { useAdminCWSettings, useAdminPricingSettings } from '../../hooks/queries/admin/useAdminSettingsQuery';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import { useToast } from '../../contexts/ToastContext';
import PageLoader from '@alrehla/ui/page-loader';
import { Card } from '@alrehla/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import { Package, Sparkles, Save, Calculator, Search, User } from 'lucide-react';
import { calculateCustomerPrice, calculatePlatformMargin } from '../../utils/pricingCalculator';

type EditableRates = {
    [instructorId: number]: {
        service_rates: { [serviceId: number]: number | undefined };
        package_rates: { [packageId: number]: number | undefined };
    }
}

const AdminPriceReviewPage: React.FC = () => {
    const { data: instructors = [], isLoading: instructorsLoading, refetch: refetchInstructors } = useAdminInstructors();
    const { data: settings, isLoading: settingsLoading } = useAdminCWSettings();
    const { data: pricingConfig, isLoading: pricingLoading } = useAdminPricingSettings();
    const { updateInstructor } = useInstructorMutations();
    const { addToast } = useToast();
    
    const [editableRates, setEditableRates] = useState<EditableRates>({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (instructors.length > 0) {
            const initialRates = instructors.reduce((acc, instructor) => {
                acc[instructor.id] = {
                    service_rates: instructor.service_rates || {},
                    package_rates: instructor.package_rates || {},
                };
                return acc;
            }, {} as EditableRates);
            setEditableRates(initialRates);
        }
    }, [instructors]);

    const handleRateChange = (instructorId: number, type: 'service' | 'package', itemId: number, value: string) => {
        const rateKey = type === 'service' ? 'service_rates' : 'package_rates';
        const numericValue = value === '' ? undefined : parseFloat(value);
        
        setEditableRates(prev => ({
            ...prev,
            [instructorId]: {
                ...prev[instructorId],
                [rateKey]: {
                    ...prev[instructorId]?.[rateKey],
                    [itemId]: numericValue
                }
            }
        }));
    };
    
    const handleSave = async () => {
        const updatePromises: Promise<any>[] = [];
        instructors.forEach(instructor => {
            const rates = editableRates[instructor.id];
            if (rates) {
                updatePromises.push(updateInstructor.mutateAsync({ 
                    id: instructor.id, 
                    service_rates: rates.service_rates, 
                    package_rates: rates.package_rates 
                }));
            }
        });

        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            addToast(`تم تحديث مصفوفة الأسعار بنجاح.`, 'success');
            refetchInstructors();
        }
    };

    const filteredInstructors = useMemo(() => {
        return instructors.filter(inst => 
            inst.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            inst.specialty.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [instructors, searchTerm]);

    if (instructorsLoading || settingsLoading || pricingLoading) return <PageLoader />;

    const instructorServices = (settings?.standaloneServices || []).filter((s: any) => s.provider_type === 'instructor');
    const packages = (settings?.packages || []).filter((p: any) => p.price > 0);

    return (
        <div className="animate-fadeIn space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
                        <Calculator className="text-primary" /> مصفوفة الأسعار والعمولات
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        تحديد صافي ربح المدرب لكل باقة/خدمة. النظام سيحسب عمولة المنصة والسعر النهائي تلقائياً.
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative w-64">
                         <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                         <Input 
                            placeholder="بحث عن مدرب..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="pr-10"
                        />
                    </div>
                    <Button onClick={handleSave} loading={updateInstructor.isPending} icon={<Save />} size="default">
                        حفظ التغييرات
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="packages">
                <TabsList>
                    <TabsTrigger value="packages" className="gap-2"><Package size={16}/> أسعار الباقات</TabsTrigger>
                    <TabsTrigger value="services" className="gap-2"><Sparkles size={16}/> أسعار الخدمات</TabsTrigger>
                </TabsList>

                <TabsContent value="packages" className="mt-6">
                    <Card className="overflow-hidden border-t-4 border-t-purple-500">
                        <div className="overflow-x-auto max-h-[70vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="sticky right-0 bg-muted/90 z-20 w-[250px] border-l shadow-sm font-bold text-foreground">
                                            اسم المدرب
                                        </TableHead>
                                        {packages.map(pkg => (
                                            <TableHead key={pkg.id} className="text-center min-w-[180px] p-4 border-l">
                                                <div className="flex flex-col gap-1 items-center">
                                                    <span className="font-bold text-gray-800">{pkg.name}</span>
                                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                        الافتراضي: {pkg.price} ج.م
                                                    </span>
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInstructors.length > 0 ? filteredInstructors.map(inst => (
                                        <TableRow key={inst.id} className="hover:bg-muted/10">
                                            <TableCell className="font-semibold sticky right-0 bg-white z-10 border-l shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                                        {inst.avatar_url ? <img src={inst.avatar_url} className="w-full h-full rounded-full object-cover" /> : <User size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm">{inst.name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{inst.specialty}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            {packages.map(pkg => {
                                                const net = editableRates[inst.id]?.package_rates?.[pkg.id] ?? pkg.price;
                                                const customerPrice = calculateCustomerPrice(net, pricingConfig);
                                                const platformMargin = calculatePlatformMargin(customerPrice, net || 0);
                                                
                                                // Highlight logic if custom price differs from default
                                                const isCustom = editableRates[inst.id]?.package_rates?.[pkg.id] !== undefined;

                                                return (
                                                    <TableCell key={pkg.id} className="text-center p-3 border-l bg-white">
                                                        <div className={`space-y-2 p-2 rounded-lg transition-colors ${isCustom ? 'bg-yellow-50 border border-yellow-200' : ''}`}>
                                                            <div className="relative">
                                                                <Input 
                                                                    type="number" 
                                                                    className={`text-center h-9 font-bold ${isCustom ? 'border-yellow-400 focus:ring-yellow-400' : ''}`}
                                                                    value={net ?? ''} 
                                                                    onChange={e => handleRateChange(inst.id, 'package', pkg.id, e.target.value)}
                                                                    placeholder={`${pkg.price}`}
                                                                />
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">صافي</span>
                                                            </div>
                                                            <div className="flex justify-between items-center px-1 text-[10px]">
                                                                <div className="text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded">للعميل: {customerPrice}</div>
                                                                <div className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">هامش: {platformMargin}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={packages.length + 1} className="text-center py-12 text-muted-foreground">
                                                لا يوجد مدربين يطابقون بحثك.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>
                
                <TabsContent value="services" className="mt-6">
                     <Card className="overflow-hidden border-t-4 border-t-blue-500">
                        <div className="overflow-x-auto max-h-[70vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="sticky right-0 bg-muted/90 z-20 w-[250px] border-l shadow-sm font-bold text-foreground">
                                            اسم المدرب
                                        </TableHead>
                                        {instructorServices.map(service => (
                                            <TableHead key={service.id} className="text-center min-w-[180px] p-4 border-l">
                                                 <div className="flex flex-col gap-1 items-center">
                                                    <span className="font-bold text-gray-800">{service.name}</span>
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                        الافتراضي: {service.price} ج.م
                                                    </span>
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInstructors.length > 0 ? filteredInstructors.map(inst => (
                                        <TableRow key={inst.id} className="hover:bg-muted/10">
                                            <TableCell className="font-semibold sticky right-0 bg-white z-10 border-l shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                                        {inst.avatar_url ? <img src={inst.avatar_url} className="w-full h-full rounded-full object-cover" /> : <User size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm">{inst.name}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            {instructorServices.map(service => {
                                                const net = editableRates[inst.id]?.service_rates?.[service.id] ?? service.price;
                                                const customerPrice = calculateCustomerPrice(net, pricingConfig);
                                                const platformMargin = calculatePlatformMargin(customerPrice, net || 0);
                                                const isCustom = editableRates[inst.id]?.service_rates?.[service.id] !== undefined;

                                                return (
                                                    <TableCell key={service.id} className="text-center p-3 border-l bg-white">
                                                         <div className={`space-y-2 p-2 rounded-lg transition-colors ${isCustom ? 'bg-yellow-50 border border-yellow-200' : ''}`}>
                                                            <div className="relative">
                                                                <Input 
                                                                    type="number" 
                                                                    className={`text-center h-9 font-bold ${isCustom ? 'border-yellow-400 focus:ring-yellow-400' : ''}`}
                                                                    value={net ?? ''} 
                                                                    onChange={e => handleRateChange(inst.id, 'service', service.id, e.target.value)}
                                                                    placeholder={`${service.price}`}
                                                                />
                                                                 <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">صافي</span>
                                                            </div>
                                                            <div className="flex justify-between items-center px-1 text-[10px]">
                                                                <div className="text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded">للعميل: {customerPrice}</div>
                                                                <div className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">هامش: {platformMargin}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={instructorServices.length + 1} className="text-center py-12 text-muted-foreground">
                                                لا يوجد مدربين يطابقون بحثك.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminPriceReviewPage;
