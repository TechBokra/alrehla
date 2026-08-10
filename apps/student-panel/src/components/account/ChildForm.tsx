"use client";


import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { useUserMutations } from '../../hooks/mutations/useUserMutations';
import type { ChildProfile } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { DatePicker } from '@alrehla/ui/date-picker';
import { Select } from '@alrehla/ui/native-select';
import { Textarea } from '@alrehla/ui/textarea';
import Image from '@alrehla/ui/next-image';
import { cloudinaryService } from '../../services/cloudinaryService';

interface ChildFormProps {
    childToEdit: ChildProfile | null;
    onCancel: () => void;
    onSuccess: () => void;
}

const ChildForm: React.FC<ChildFormProps> = ({ childToEdit, onCancel, onSuccess }) => {
    const { createChildProfile, updateChildProfile } = useUserMutations();
    const today = new Date().toISOString().split('T')[0];
    
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState<'ذكر' | 'أنثى' | ''>('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [interests, setInterests] = useState('');
    const [strengths, setStrengths] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (childToEdit) {
            setName(childToEdit.name);
            setBirthDate(childToEdit.birth_date);
            setGender(childToEdit.gender);
            setPreview(childToEdit.avatar_url);
            setInterests((childToEdit.interests || []).join(', '));
            setStrengths((childToEdit.strengths || []).join(', '));
        }
    }, [childToEdit]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setAvatarFile(file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        } else {
            setPreview(childToEdit?.avatar_url || null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            const interestsArray = interests.split(',').map(s => s.trim()).filter(Boolean);
            const strengthsArray = strengths.split(',').map(s => s.trim()).filter(Boolean);

            let newAvatarUrl = childToEdit?.avatar_url || null;
            
            if (avatarFile) {
                try {
                    const asset = await cloudinaryService.uploadImage(avatarFile, 'alrehla_child_profiles');
                    newAvatarUrl = JSON.stringify(asset);
                } catch (uploadError) {
                    console.error("Image upload failed", uploadError);
                    alert("فشل رفع الصورة، سيتم الحفظ بدون تغيير الصورة.");
                }
            }
            
            const profileData = {
                name,
                birth_date: birthDate,
                gender: gender as 'ذكر' | 'أنثى',
                avatar_url: newAvatarUrl,
                interests: interestsArray.length > 0 ? interestsArray : null,
                strengths: strengthsArray.length > 0 ? strengthsArray : null,
            };

            if (childToEdit) {
                await updateChildProfile.mutateAsync({ ...profileData, id: childToEdit.id });
            } else {
                await createChildProfile.mutateAsync({ ...profileData, student_user_id: null });
            }
            onSuccess();
        } catch (error) {
            console.error("Failed to save child profile", error);
        } finally {
            setIsUploading(false);
        }
    };

    const isSaving = createChildProfile.isPending || updateChildProfile.isPending || isUploading;

    return (
        <div className="animate-fadeIn">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                <Button variant="ghost" size="icon" onClick={onCancel}>
                    <ArrowLeft size={20} className="text-gray-500" />
                </Button>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">
                        {childToEdit ? `تعديل ملف: ${childToEdit.name}` : 'إضافة طفل جديد'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {childToEdit ? 'تحديث البيانات الشخصية للطفل' : 'بإضافة طفل، ستصبح ولي أمر في المنصة تلقائياً.'}
                    </p>
                </div>
            </div>

            <form id="child-profile-form" onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl bg-gray-50">
                    <div className="relative">
                        <Image src={preview || '/images/male-avatar.png'} alt="Avatar" className="w-24 h-24 rounded-full" />
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
                                <Loader2 className="animate-spin text-primary" size={24}/>
                            </div>
                        )}
                    </div>
                    <input type="file" id="avatar-upload" onChange={handleFileChange} accept="image/*" className="hidden" disabled={isSaving}/>
                    <label htmlFor="avatar-upload" className={`cursor-pointer flex items-center gap-2 text-sm font-semibold text-blue-600 bg-white border border-blue-100 hover:bg-blue-50 px-4 py-2 rounded-full shadow-sm transition-colors ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                        <ImageIcon size={16} /> <span>{preview ? 'تغيير الصورة' : 'رفع صورة رمزية'}</span>
                    </label>
                </div>

                <div className="space-y-6">
                    <FormField label="اسم الطفل*" htmlFor="name">
                        <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="الاسم الأول والأخير" disabled={isSaving} />
                    </FormField>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="تاريخ الميلاد*" htmlFor="birthDate">
                            <DatePicker
                                id="birthDate"
                                value={birthDate}
                                max={today}
                                fromYear={1900}
                                onChange={setBirthDate}
                                required
                                disabled={isSaving}
                            />
                        </FormField>
                        <FormField label="الجنس*" htmlFor="gender">
                            <Select id="gender" value={gender} onChange={(e) => setGender(e.target.value as 'ذكر' | 'أنثى' | '')} required disabled={isSaving}>
                                <option value="" disabled>-- اختر الجنس --</option>
                                <option value="ذكر">ذكر</option>
                                <option value="أنثى">أنثى</option>
                            </Select>
                        </FormField>
                    </div>
                    
                    <FormField label="اهتمامات الطفل (اختياري)" htmlFor="interests">
                        <Textarea id="interests" value={interests} onChange={(e) => setInterests(e.target.value)} rows={3} placeholder="مثال: الديناصورات، الرسم، كرة القدم" disabled={isSaving}/>
                        <p className="text-xs text-gray-500 mt-1">افصل بين كل اهتمام بفاصلة (,)</p>
                    </FormField>
                    
                    <FormField label="نقاط قوة الطفل (اختياري)" htmlFor="strengths">
                        <Textarea id="strengths" value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={3} placeholder="مثال: شجاع، خياله واسع، يحب مساعدة الآخرين" disabled={isSaving}/>
                        <p className="text-xs text-gray-500 mt-1">افصل بين كل نقطة قوة بفاصلة (,)</p>
                    </FormField>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button type="button" onClick={onCancel} disabled={isSaving} variant="ghost">
                        إلغاء
                    </Button>
                    <Button type="submit" loading={isSaving} icon={<Save size={18} />} className="w-32">
                        {isUploading ? 'جاري الرفع...' : 'حفظ'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ChildForm;
