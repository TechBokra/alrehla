"use client";


import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserMutations } from '../../hooks/mutations/useUserMutations';
import { User, Key, LogOut, Edit, Home, Globe, AlertCircle } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import { Select } from '@alrehla/ui/native-select';
import { supportedCountries } from '../../data/mockData';

const Section: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode}> = ({title, icon, children}) => (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            {icon} {title}
        </h2>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

interface AccountSettingsPanelProps {
    isMandatoryMode?: boolean;
}

const AccountSettingsPanel: React.FC<AccountSettingsPanelProps> = ({ isMandatoryMode = false }) => {
    const { currentUser, signOut, updateCurrentUser, closeProfileModal } = useAuth();
    const { updateUser, updateUserPassword } = useUserMutations();
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(currentUser!.name);
    
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [address, setAddress] = useState(currentUser!.address || '');
    const [city, setCity] = useState(currentUser!.city || '');
    const [country, setCountry] = useState(currentUser!.country ? supportedCountries.find(c => c.name === currentUser!.country)?.code || 'EG' : 'EG');
    const [phone, setPhone] = useState(currentUser!.phone || '');

    // Auto-open editing if mandatory
    useEffect(() => {
        if (isMandatoryMode) {
            setIsEditingAddress(true);
        }
    }, [isMandatoryMode]);

    const handleNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { id: currentUser!.id, name };
        await updateUser.mutateAsync(payload);
        updateCurrentUser({ name }); 
        setIsEditingName(false);
    };
    
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("كلمتا المرور الجديدتان غير متطابقتين.");
            return;
        }
        await updateUserPassword.mutateAsync({ userId: currentUser!.id, newPassword });
        setIsEditingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };
    
    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const selectedCountryData = supportedCountries.find(c => c.code === country);

        const payload = { 
            id: currentUser!.id,
            address,
            city,
            phone,
            country: selectedCountryData?.name,
            timezone: selectedCountryData?.timezone,
            currency: selectedCountryData?.currency
        };
        await updateUser.mutateAsync(payload);
        updateCurrentUser(payload);
        
        setIsEditingAddress(false);
        
        // If this was mandatory, clear the flag so user can proceed
        if (isMandatoryMode) {
            closeProfileModal(); 
        }
    };


    return (
        <div className="space-y-8 animate-fadeIn">
            {isMandatoryMode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3 text-yellow-800 animate-pulse">
                    <AlertCircle className="shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold">مطلوب استكمال البيانات</h3>
                        <p className="text-sm">يرجى تحديث بيانات الموقع ورقم الهاتف بالأسفل للمتابعة في عملية الطلب.</p>
                    </div>
                </div>
            )}

            <Section title="الموقع والتوقيت" icon={<Globe />}>
                {!isEditingAddress ? (
                    <div>
                        <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="font-semibold text-gray-600 text-xs">الدولة:</p><p>{currentUser?.country || 'لم يحدد'}</p></div>
                                <div><p className="font-semibold text-gray-600 text-xs">المدينة:</p><p>{currentUser?.city || 'لم يحدد'}</p></div>
                                <div><p className="font-semibold text-gray-600 text-xs">التوقيت:</p><p className="dir-ltr text-right">{currentUser?.timezone || 'UTC'}</p></div>
                                <div><p className="font-semibold text-gray-600 text-xs">رقم الهاتف:</p><p className="dir-ltr text-right">{currentUser?.phone || '-'}</p></div>
                            </div>
                            <div className="border-t pt-2">
                                <p className="font-semibold text-gray-600 text-xs">العنوان التفصيلي:</p>
                                <p>{currentUser?.address || '-'}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(true)} icon={<Edit size={14}/>} className="mt-2">تحديث الموقع</Button>
                    </div>
                ) : (
                    <form onSubmit={handleAddressSubmit} className={`p-4 rounded-lg border space-y-4 ${isMandatoryMode ? 'bg-yellow-50/50 border-yellow-200' : 'bg-gray-50'}`}>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="الدولة" htmlFor="country">
                                <Select id="country" value={country} onChange={e => setCountry(e.target.value)}>
                                    {supportedCountries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                </Select>
                            </FormField>
                            <FormField label="المدينة / المنطقة" htmlFor="city">
                                <Input id="city" value={city} onChange={e => setCity(e.target.value)} required placeholder="اكتب اسم مدينتك..." />
                            </FormField>
                        </div>
                        <FormField label="رقم الهاتف" htmlFor="phone">
                            <Input 
                                id="phone" 
                                type="tel" 
                                value={phone} 
                                onChange={e => {
                                    const val = e.target.value;
                                    // Only allow digits
                                    if (/^\d*$/.test(val)) {
                                        setPhone(val);
                                    }
                                }} 
                                required 
                                placeholder="01xxxxxxxxx" 
                                dir="ltr" 
                                className="text-left font-mono" 
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                        </FormField>
                        <FormField label="العنوان التفصيلي" htmlFor="address">
                            <Textarea id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="اسم الشارع، رقم المبنى..." />
                        </FormField>
                        <div className="flex gap-2 pt-2">
                            <Button type="submit" size="sm" loading={updateUser.isPending} variant={isMandatoryMode ? 'primary' : 'default'}>
                                {isMandatoryMode ? 'حفظ ومتابعة' : 'حفظ التحديثات'}
                            </Button>
                            {!isMandatoryMode && <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingAddress(false)}>إلغاء</Button>}
                        </div>
                    </form>
                )}
            </Section>

            <Section title="الملف الشخصي" icon={<User />}>
                {!isEditingName ? (
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                        <div>
                            <p className="font-semibold text-gray-600 text-sm">الاسم:</p>
                            <p>{currentUser!.name}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingName(true)} icon={<Edit size={14}/>}>تعديل</Button>
                    </div>
                ) : (
                    <form onSubmit={handleNameSubmit} className="p-4 bg-gray-50 rounded-lg border space-y-4">
                        <FormField label="الاسم" htmlFor="name">
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                        </FormField>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" loading={updateUser.isPending}>حفظ</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingName(false)}>إلغاء</Button>
                        </div>
                    </form>
                )}
                <div className="p-4 bg-gray-50 rounded-lg border">
                     <p className="font-semibold text-gray-600 text-sm">البريد الإلكتروني:</p>
                     <p>{currentUser!.email}</p>
                </div>
            </Section>
            
            <Section title="الأمان" icon={<Key />}>
                 {!isEditingPassword ? (
                     <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                        <p className="text-sm text-gray-500">لأمان حسابك، نوصي بتغيير كلمة المرور بشكل دوري.</p>
                        <Button variant="outline" size="sm" onClick={() => setIsEditingPassword(true)}>تغيير كلمة المرور</Button>
                    </div>
                 ) : (
                     <form onSubmit={handlePasswordSubmit} className="p-4 bg-gray-50 rounded-lg border space-y-4">
                         <FormField label="كلمة المرور الجديدة" htmlFor="newPassword">
                             <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                         </FormField>
                          <FormField label="تأكيد كلمة المرور الجديدة" htmlFor="confirmPassword">
                             <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                         </FormField>
                         <div className="flex gap-2">
                            <Button type="submit" size="sm" loading={updateUserPassword.isPending}>حفظ التغييرات</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingPassword(false)}>إلغاء</Button>
                        </div>
                     </form>
                 )}
                <div className="pt-4 mt-6 border-t">
                     <Button onClick={signOut} variant="ghost" className="w-full justify-start text-red-600 hover:text-red-800 hover:bg-red-50" icon={<LogOut size={16}/>}>
                        تسجيل الخروج
                     </Button>
                </div>
            </Section>
        </div>
    );
};

export default AccountSettingsPanel;
