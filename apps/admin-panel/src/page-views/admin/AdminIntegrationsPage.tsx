
import React, { useState, useEffect } from 'react';
import { Save, Plug, Camera } from 'lucide-react';
import { useAdminJitsiSettings } from '../../hooks/queries/admin/useAdminSettingsQuery';
import { useSettingsMutations } from '../../hooks/mutations/useSettingsMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@alrehla/ui/card';
import { Checkbox } from '@alrehla/ui/checkbox';
import type { JitsiSettings } from '../../lib/database.types';

const AdminIntegrationsPage: React.FC = () => {
    const { data: initialSettings, isLoading } = useAdminJitsiSettings();
    const { updateJitsiSettings } = useSettingsMutations();
    const [settings, setSettings] = useState<Partial<JitsiSettings>>({});

    useEffect(() => {
        if (initialSettings) {
            setSettings(initialSettings as JitsiSettings);
        }
    }, [initialSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) || 0 : value),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Force cast to JitsiSettings since we know form fields cover necessary props or they are optional
        await updateJitsiSettings.mutateAsync(settings as JitsiSettings);
    };

    const handleTestRoom = () => {
        const randomString = `test-${Math.random().toString(36).substring(7)}`;
        const roomName = `${settings.room_prefix || 'AlRehlah-Session-'}${randomString}`;
        const url = `https://${settings.domain || 'meet.jit.si'}/${roomName}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (isLoading) return <PageLoader text="جاري تحميل إعدادات التكامل..." />;

    return (
        <div className="animate-fadeIn space-y-8">
            <h1 className="text-3xl font-extrabold text-foreground">إدارة التكاملات</h1>
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Plug /> إعدادات Jitsi Meet
                        </CardTitle>
                        <CardDescription>
                            هنا يمكنك التحكم في كيفية تكامل المنصة مع خدمة الاجتماعات المرئية Jitsi Meet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField label="نطاق خادم Jitsi" htmlFor="domain">
                            <Input id="domain" name="domain" value={settings.domain || ''} onChange={handleChange} dir="ltr" placeholder="meet.jit.si" />
                        </FormField>
                        <FormField label="بادئة اسم الغرفة" htmlFor="room_prefix">
                            <Input id="room_prefix" name="room_prefix" value={settings.room_prefix || ''} onChange={handleChange} dir="ltr" placeholder="AlRehlah-Session-" />
                        </FormField>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="السماح بالانضمام قبل (بالدقائق)" htmlFor="join_minutes_before">
                                <Input type="number" id="join_minutes_before" name="join_minutes_before" value={settings.join_minutes_before || ''} onChange={handleChange} />
                            </FormField>
                            <FormField label="انتهاء صلاحية الجلسة بعد (بالدقائق)" htmlFor="expire_minutes_after">
                                <Input type="number" id="expire_minutes_after" name="expire_minutes_after" value={settings.expire_minutes_after || ''} onChange={handleChange} />
                            </FormField>
                        </div>
                        <div className="space-y-2 pt-4 border-t">
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox name="start_with_audio_muted" checked={!!settings.start_with_audio_muted} onCheckedChange={(checked) => setSettings(p => ({...p, start_with_audio_muted: !!checked}))} />
                                بدء الجلسة مع كتم صوت المشاركين
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox name="start_with_video_muted" checked={!!settings.start_with_video_muted} onCheckedChange={(checked) => setSettings(p => ({...p, start_with_video_muted: !!checked}))} />
                                بدء الجلسة مع إيقاف كاميرا المشاركين
                            </label>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                         <Button type="button" variant="outline" onClick={handleTestRoom} icon={<Camera />}>
                            اختبار الغرفة
                        </Button>
                        <Button type="submit" loading={updateJitsiSettings.isPending} icon={<Save />}>
                            حفظ الإعدادات
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
};

export default AdminIntegrationsPage;
