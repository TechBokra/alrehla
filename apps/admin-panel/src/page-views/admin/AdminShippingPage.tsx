import React, { useState, useEffect } from 'react';
import { Save, Truck, Plus, Trash2 } from 'lucide-react';
import { useProduct, ShippingCosts } from '../../contexts/ProductContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import FormField from '@alrehla/ui/form-field';
import { v4 as uuidv4 } from 'uuid';
import PageLoader from '@alrehla/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';

interface Region {
  id: string;
  name: string;
  cost: number;
}
interface Country {
  id: string;
  name: string;
  regions: Region[];
}

const AdminShippingPage: React.FC = () => {
    const { shippingCosts, setShippingCosts, loading: isContextLoading } = useProduct();
    const [countries, setCountries] = useState<Country[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (shippingCosts && typeof shippingCosts === 'object') {
            const transformedCosts: Country[] = Object.entries(shippingCosts).map(([countryName, regions]) => ({
                id: uuidv4(),
                name: countryName,
                regions: Object.entries(regions).map(([regionName, cost]) => ({
                    id: uuidv4(),
                    name: regionName,
                    cost: cost,
                })),
            }));
            setCountries(transformedCosts);
        }
    }, [shippingCosts]);
    
    // Handlers for countries
    const handleAddCountry = () => {
        setCountries([...countries, { id: uuidv4(), name: '', regions: [{ id: uuidv4(), name: '', cost: 0 }] }]);
    };
    const handleRemoveCountry = (countryId: string) => {
        setCountries(countries.filter(c => c.id !== countryId));
    };
    const handleCountryNameChange = (countryId: string, newName: string) => {
        setCountries(countries.map(c => c.id === countryId ? { ...c, name: newName } : c));
    };

    // Handlers for regions
    const handleAddRegion = (countryId: string) => {
        setCountries(countries.map(c => {
            if (c.id === countryId) {
                return { ...c, regions: [...c.regions, { id: uuidv4(), name: '', cost: 0 }] };
            }
            return c;
        }));
    };
    const handleRemoveRegion = (countryId: string, regionId: string) => {
        setCountries(countries.map(c => {
            if (c.id === countryId) {
                return { ...c, regions: c.regions.filter(r => r.id !== regionId) };
            }
            return c;
        }));
    };
    const handleRegionChange = (countryId: string, regionId: string, field: 'name' | 'cost', value: string | number) => {
        setCountries(countries.map(c => {
            if (c.id === countryId) {
                return {
                    ...c,
                    regions: c.regions.map(r => r.id === regionId ? { ...r, [field]: value } : r)
                };
            }
            return c;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Transform back to the object structure
            const newShippingCosts: ShippingCosts = countries.reduce((acc, country) => {
                if (country.name.trim()) {
                    acc[country.name.trim()] = country.regions.reduce((regionAcc, region) => {
                        if (region.name.trim()) {
                            regionAcc[region.name.trim()] = region.cost;
                        }
                        return regionAcc;
                    }, {} as { [region: string]: number });
                }
                return acc;
            }, {} as ShippingCosts);

            await setShippingCosts(newShippingCosts);
        } catch (error: any) {
             addToast(error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isContextLoading) return <PageLoader />;

    return (
        <div className="animate-fadeIn">
            <h1 className="text-3xl font-extrabold text-foreground mb-8">إدارة الشحن</h1>
            <form onSubmit={handleSubmit} className="space-y-8">
                {countries.map((country) => (
                    <Card key={country.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Truck />
                                    {country.name || 'دولة جديدة'}
                                </span>
                                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveCountry(country.id)} disabled={isSaving}><Trash2 size={16}/></Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <FormField label="اسم الدولة" htmlFor={`country-${country.id}`} className="flex-grow">
                                    <Input id={`country-${country.id}`} value={country.name} onChange={(e) => handleCountryNameChange(country.id, e.target.value)} placeholder="مثال: مصر" disabled={isSaving} />
                                </FormField>
                                <h3 className="text-md font-bold text-muted-foreground pt-4 border-t">المناطق/المحافظات</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {country.regions.map((region) => (
                                        <div key={region.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 bg-muted/50 rounded-md">
                                            <FormField label="المنطقة" htmlFor={`region-name-${region.id}`}>
                                                <Input id={`region-name-${region.id}`} value={region.name} onChange={(e) => handleRegionChange(country.id, region.id, 'name', e.target.value)} placeholder="مثال: القاهرة" disabled={isSaving} />
                                            </FormField>
                                            <FormField label="التكلفة" htmlFor={`region-cost-${region.id}`}>
                                                <div className="relative">
                                                    <Input type="number" id={`region-cost-${region.id}`} value={region.cost} onChange={(e) => handleRegionChange(country.id, region.id, 'cost', Number(e.target.value))} className="pl-12 pr-4 rtl:pr-12 rtl:pl-4" disabled={isSaving} />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none rtl:left-auto rtl:right-3">ج.م</span>
                                                </div>
                                            </FormField>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRegion(country.id, region.id)} disabled={isSaving} className="self-end mb-1 text-destructive">
                                                <Trash2 size={16}/>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => handleAddRegion(country.id)} disabled={isSaving} icon={<Plus />}>
                                    إضافة منطقة
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Button type="button" variant="outline" onClick={handleAddCountry} disabled={isSaving} icon={<Plus />}>
                    إضافة دولة
                </Button>

                <div className="flex justify-end sticky bottom-6 mt-8">
                    <Button type="submit" loading={isSaving} size="lg" icon={<Save size={18} />} className="shadow-lg">
                        حفظ كل التغييرات
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AdminShippingPage;