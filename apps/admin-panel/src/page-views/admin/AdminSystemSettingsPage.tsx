
import React, { useState, useEffect } from 'react';
import { Database, Image as ImageIcon, Server, Save, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useAdminSystemConfig } from '../../hooks/queries/admin/useAdminSettingsQuery';
import { useSettingsMutations } from '../../hooks/mutations/useSettingsMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import { DEFAULT_CONFIG } from '../../lib/config';

const AdminSystemSettingsPage: React.FC = () => {
    const { data: configData, isLoading, refetch } = useAdminSystemConfig();
    const { updateSystemConfig } = useSettingsMutations();
    
    const [config, setConfig] = useState<typeof DEFAULT_CONFIG>(DEFAULT_CONFIG);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState('supabase');

    useEffect(() => {
        if (configData) {
            setConfig(configData);
        }
    }, [configData]);

    const handleChange = (section: keyof typeof DEFAULT_CONFIG, field: string, value: string) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        if (window.confirm("تحذير: هل أنت متأكد من حفظ الإعدادات؟")) {
            await updateSystemConfig.mutateAsync(config);
            refetch();
        }
    };

    const handleReset = () => {
        if (window.confirm("هل تريد استعادة الإعدادات الافتراضية؟")) {
            setConfig(DEFAULT_CONFIG);
        }
    };

    if (isLoading) return <PageLoader />;

    return (
        <div className="animate-fadeIn space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
                        <Server className="text-primary" /> تكوين النظام
                    </h1>
                    <p className="text-muted-foreground mt-1">إدارة مفاتيح الاتصال بالخدمات الخارجية.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset} icon={<RefreshCw size={16}/>}>استعادة الافتراضي</Button>
                    <Button onClick={handleSave} loading={updateSystemConfig.isPending} icon={<Save size={16}/>}>حفظ الإعدادات</Button>
                </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 flex-wrap h-auto">
                    <TabsTrigger value="supabase" className="gap-2"><Database size={16}/> Supabase</TabsTrigger>
                    <TabsTrigger value="cloudinary" className="gap-2"><ImageIcon size={16}/> Cloudinary</TabsTrigger>
                    <TabsTrigger value="storage" className="gap-2"><Server size={16}/> Storage</TabsTrigger>
                </TabsList>

                <TabsContent value="supabase" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Supabase Connection</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Project URL" htmlFor="sb_url">
                                    <Input id="sb_url" value={config.supabase.projectUrl} onChange={e => handleChange('supabase', 'projectUrl', e.target.value)} className="font-mono" dir="ltr" />
                                </FormField>
                                <FormField label="Anon Public Key" htmlFor="sb_anon">
                                    <div className="relative">
                                        <Input 
                                            id="sb_anon" 
                                            value={config.supabase.anonKey} 
                                            onChange={e => handleChange('supabase', 'anonKey', e.target.value)} 
                                            className="font-mono pr-10" 
                                            type={showSecrets['anon'] ? 'text' : 'password'}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => toggleSecret('anon')} 
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                                        >
                                            {showSecrets['anon'] ? <EyeOff size={16}/> : <Eye size={16}/>}
                                        </button>
                                    </div>
                                </FormField>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cloudinary" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Cloudinary</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Cloud Name" htmlFor="cl_name">
                                    <Input id="cl_name" value={config.cloudinary.cloudName} onChange={e => handleChange('cloudinary', 'cloudName', e.target.value)} />
                                </FormField>
                                <FormField label="Upload Preset" htmlFor="cl_preset">
                                    <Input id="cl_preset" value={config.cloudinary.uploadPreset} onChange={e => handleChange('cloudinary', 'uploadPreset', e.target.value)} />
                                </FormField>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="storage" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Storage</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <FormField label="Bucket Name" htmlFor="st_bucket">
                                <Input id="st_bucket" value={config.storage.bucketName} onChange={e => handleChange('storage', 'bucketName', e.target.value)} />
                            </FormField>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminSystemSettingsPage;
