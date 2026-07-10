
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserMutations } from '../../hooks/mutations/useUserMutations';
import { usePublisherProfile } from '../../hooks/queries/admin/useAdminUsersQuery';
import { useToast } from '../../contexts/ToastContext';
import { User, Key, Globe, Building2, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import ImageUploadField from '../../components/admin/ui/ImageUploadField';
import { supportedCountries } from '../../data/mockData';
import PageLoader from '../../components/ui/PageLoader';
import { cloudinaryService } from '../../services/cloudinaryService';

const AdminMyProfilePage: React.FC = () => {
    const { currentUser, updateCurrentUser } = useAuth();
    const { updateUser, updateUserPassword, updatePublisherProfile } = useUserMutations();
    const { addToast } = useToast();
    
    // --- Basic Profile State ---
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [phone, setPhone] = useState(currentUser?.phone || '');
    const [country, setCountry] = useState(currentUser?.country ? supportedCountries.find(c => c.name === currentUser?.country)?.code || 'EG' : 'EG');
    const [city, setCity] = useState(currentUser?.city || '');

    // --- Password State ---
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // --- Publisher Profile State ---
    const isPublisher = currentUser?.role === 'publisher';
    const { data: publisherData, isLoading: publisherLoading } = usePublisherProfile(currentUser?.id);

    const [storeName, setStoreName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [website, setWebsite] = useState('');
    const [logoUrl, setLogoUrl] = useState<any>('');
    const [coverUrl, setCoverUrl] = useState<any>('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (logoUrl instanceof File || coverUrl instanceof File) {
                e.preventDefault();
                e.returnValue = 'لديك تعديلات غير محفوظة في الصور. هل أنت متأكد من المغادرة؟';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [logoUrl, coverUrl]);

    // Load Publisher Data
    useEffect(() => {
        if (publisherData) {
            setStoreName(publisherData.store_name || '');
            setSlug(publisherData.slug || '');
            setDescription(publisherData.description || '');
            setWebsite(publisherData.website || '');
            setLogoUrl(publisherData.logo_url || '');
            setCoverUrl(publisherData.cover_url || '');
        } else if (currentUser?.role === 'publisher') {
            // Default initialization if no record exists yet
            setStoreName(currentUser.name || '');
        }
    }, [publisherData, currentUser]);

    const handleBasicInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const selectedCountryData = supportedCountries.find(c => c.code === country);

        const payload = {
            id: currentUser.id,
            name,
            phone,
            city,
            country: selectedCountryData?.name,
            timezone: selectedCountryData?.timezone,
            currency: selectedCountryData?.currency
        };

        try {
            await updateUser.mutateAsync(payload);
            updateCurrentUser(payload);
        } catch (error) {
            console.error("Profile update failed", error);
            // Toast is handled by hook
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        
        if (newPassword !== confirmPassword) {
            addToast("كلمتا المرور الجديدتان غير متطابقتين.", "warning");
            return;
        }
        
        try {
            await updateUserPassword.mutateAsync({ userId: currentUser.id, newPassword });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            // Toast handled by hook
        }
    };

    const handlePublisherSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsUploading(true);

        try {
            let finalLogoUrl = logoUrl;
            let finalCoverUrl = coverUrl;

            if (logoUrl instanceof File) {
                const asset = await cloudinaryService.uploadImageWithCompression(logoUrl, 'publishers');
                finalLogoUrl = JSON.stringify(asset);
            }
            if (coverUrl instanceof File) {
                const asset = await cloudinaryService.uploadImageWithCompression(coverUrl, 'publishers');
                finalCoverUrl = JSON.stringify(asset);
            }

            const payload = {
                user_id: currentUser.id,
                store_name: storeName,
                slug,
                description,
                website,
                logo_url: finalLogoUrl,
                cover_url: finalCoverUrl
            };

            await updatePublisherProfile.mutateAsync(payload);

            // Clean up old assets if new ones were uploaded
            if (publisherData) {
                if (logoUrl instanceof File && publisherData.logo_url) {
                    const publicId = cloudinaryService.getPublicIdFromUrl(publisherData.logo_url);
                    if (publicId) await cloudinaryService.deleteAsset(publicId);
                }
                if (coverUrl instanceof File && publisherData.cover_url) {
                    const publicId = cloudinaryService.getPublicIdFromUrl(publisherData.cover_url);
                    if (publicId) await cloudinaryService.deleteAsset(publicId);
                }
            }
        } catch (error) {
            console.error("Failed to save publisher profile", error);
        } finally {
            setIsUploading(false);
        }
    };
    
    if (isPublisher && publisherLoading) return <PageLoader text="جاري تحميل بياناتك..." />;

    return (
        <div className="animate-fadeIn space-y-8 max-w-4xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-extrabold text-foreground">إعدادات الحساب</h1>
                <p className="text-muted-foreground mt-1">
                    {isPublisher ? 'تعديل بيانات دار النشر والملف الشخصي' : 'تعديل بياناتك الشخصية ومعلومات الدخول'}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- PUBLISHER SECTION (Full Width) --- */}
                {isPublisher && (
                    <div className="lg:col-span-3">
                        <form onSubmit={handlePublisherSubmit}>
                            <Card className="border-t-4 border-t-blue-600 shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-blue-800"><Building2 /> بيانات دار النشر (عامة)</CardTitle>
                                    <CardDescription>هذه البيانات تظهر للجمهور في صفحة دار النشر الخاصة بك.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ImageUploadField 
                                            label="شعار الدار (Logo)" 
                                            fieldKey="logoUrl" 
                                            currentUrl={logoUrl} 
                                            onUrlChange={(_, url) => setLogoUrl(url)} 
                                            recommendedSize="400x400px"
                                        />
                                        <ImageUploadField 
                                            label="صورة الغلاف (Cover)" 
                                            fieldKey="coverUrl" 
                                            currentUrl={coverUrl} 
                                            onUrlChange={(_, url) => setCoverUrl(url)} 
                                            recommendedSize="1200x400px"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="اسم الدار" htmlFor="storeName">
                                            <Input id="storeName" value={storeName} onChange={e => setStoreName(e.target.value)} required />
                                        </FormField>
                                        <FormField label="معرّف الرابط (Slug)" htmlFor="slug">
                                            <Input id="slug" value={slug} onChange={e => setSlug(e.target.value)} required dir="ltr" placeholder="my-store-name" />
                                            <p className="text-[10px] text-muted-foreground mt-1">يستخدم في رابط صفحتك: /publisher/your-slug</p>
                                        </FormField>
                                    </div>

                                    <FormField label="نبذة عن الدار" htmlFor="description">
                                        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="اكتب نبذة مختصرة عن تاريخ الدار وتوجهها..." />
                                    </FormField>

                                    <FormField label="الموقع الإلكتروني" htmlFor="website">
                                        <Input id="website" value={website} onChange={e => setWebsite(e.target.value)} dir="ltr" placeholder="https://..." />
                                    </FormField>

                                    <div className="flex justify-end pt-4 border-t">
                                        <Button type="submit" loading={updatePublisherProfile.isPending || isUploading} icon={<Save />}>حفظ إعدادات النشر</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </div>
                )}

                {/* --- BASIC INFO --- */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleBasicInfoSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><User /> المعلومات الشخصية (الخاصة)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField label="الاسم الكامل (للمسؤول)" htmlFor="name">
                                    <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                                </FormField>
                                <FormField label="البريد الإلكتروني" htmlFor="email">
                                    <Input id="email" value={email} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
                                    <p className="text-xs text-muted-foreground mt-1">لا يمكن تغيير البريد الإلكتروني.</p>
                                </FormField>
                                <FormField label="رقم الهاتف" htmlFor="phone">
                                    <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" placeholder="+20..." />
                                </FormField>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                    <div className="col-span-full">
                                        <p className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-700">
                                            <Globe size={16} /> المنطقة الجغرافية (اختياري)
                                        </p>
                                    </div>
                                    <FormField label="الدولة" htmlFor="country">
                                        <Select id="country" value={country} onChange={e => setCountry(e.target.value)}>
                                            {supportedCountries.map(c => (
                                                <option key={c.code} value={c.code}>{c.name}</option>
                                            ))}
                                        </Select>
                                    </FormField>
                                    <FormField label="المدينة" htmlFor="city">
                                        <Input id="city" value={city} onChange={e => setCity(e.target.value)} />
                                    </FormField>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" loading={updateUser.isPending}>حفظ البيانات</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>

                {/* --- PASSWORD --- */}
                <div className="lg:col-span-1">
                    <form onSubmit={handlePasswordSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Key /> الأمان</CardTitle>
                                <CardDescription>تغيير كلمة المرور الخاصة بحسابك.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField label="كلمة المرور الجديدة" htmlFor="newPassword">
                                    <Input 
                                        type="password" 
                                        id="newPassword" 
                                        value={newPassword} 
                                        onChange={e => setNewPassword(e.target.value)} 
                                        required 
                                        minLength={6}
                                    />
                                </FormField>
                                <FormField label="تأكيد كلمة المرور" htmlFor="confirmPassword">
                                    <Input 
                                        type="password" 
                                        id="confirmPassword" 
                                        value={confirmPassword} 
                                        onChange={e => setConfirmPassword(e.target.value)} 
                                        required 
                                    />
                                </FormField>
                                <Button type="submit" variant="outline" className="w-full" loading={updateUserPassword.isPending}>
                                    تحديث كلمة المرور
                                </Button>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminMyProfilePage;
