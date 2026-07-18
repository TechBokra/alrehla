"use client";


import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon } from 'lucide-react';
import { useUserMutations } from '../../hooks/mutations/useUserMutations';
import { ChildProfile } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Select } from '@alrehla/ui/native-select';
import { Textarea } from '@alrehla/ui/textarea';
import Modal from '@alrehla/ui/modal';
import Image from '@alrehla/ui/next-image';

interface ChildProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    childToEdit: ChildProfile | null;
}

const ChildProfileModal: React.FC<ChildProfileModalProps> = ({ isOpen, onClose, childToEdit }) => {
    const { createChildProfile, updateChildProfile } = useUserMutations();
    const isSaving = createChildProfile.isPending || updateChildProfile.isPending;
    const today = new Date().toISOString().split('T')[0];
    
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState<'ذكر' | 'أنثى' | ''>('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [interests, setInterests] = useState('');
    const [strengths, setStrengths] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (childToEdit) {
                setName(childToEdit.name);
                setBirthDate(childToEdit.birth_date);
                setGender(childToEdit.gender);
                setPreview(childToEdit.avatar_url);
                setInterests((childToEdit.interests || []).join(', '));
                setStrengths((childToEdit.strengths || []).join(', '));
            } else {
                setName('');
                setBirthDate('');
                setGender('');
                setPreview(null);
                setInterests('');
                setStrengths('');
            }
            setAvatarFile(null);
        }
    }, [childToEdit, isOpen]);
    
    if (!isOpen) return null;

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
        try {
            const interestsArray = interests.split(',').map(s => s.trim()).filter(Boolean);
            const strengthsArray = strengths.split(',').map(s => s.trim()).filter(Boolean);

            let newAvatarUrl = childToEdit?.avatar_url || null;
            if (avatarFile) {
                // In a real app, this would be an upload. For mock, we use a placeholder.
                newAvatarUrl = '/images/male-avatar.png';
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
            onClose();
        } catch (error) {
            console.error("Failed to save child profile", error);
            // Error toast will be shown from the mutation hook
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={childToEdit ? 'تعديل ملف الطفل' : 'إضافة طفل جديد'}
            footer={
                 <>
                    <Button type="button" onClick={onClose} disabled={isSaving} variant="ghost">
                        إلغاء
                    </Button>
                    <Button type="submit" form="child-profile-form" loading={isSaving} icon={<Save />}>
                        {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                </>
            }
        >
            <form id="child-profile-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <Image src={preview || '/images/male-avatar.png'} alt="Avatar" className="w-24 h-24 rounded-full" />
                    <input type="file" id="avatar-upload" onChange={handleFileChange} accept="image/*" className="hidden"/>
                    <label htmlFor="avatar-upload" className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full">
                        <ImageIcon size={16} /> <span>{preview ? 'تغيير الصورة الرمزية' : 'رفع صورة رمزية'}</span>
                    </label>
                </div>
                <FormField label="اسم الطفل*" htmlFor="name">
                    <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="تاريخ الميلاد*" htmlFor="birthDate">
                        <Input type="date" id="birthDate" value={birthDate} max={today} onChange={(e) => setBirthDate(e.target.value)} required />
                    </FormField>
                    <FormField label="الجنس*" htmlFor="gender">
                        <Select id="gender" value={gender} onChange={(e) => setGender(e.target.value as 'ذكر' | 'أنثى' | '')} required>
                            <option value="" disabled>-- اختر الجنس --</option>
                            <option value="ذكر">ذكر</option>
                            <option value="أنثى">أنثى</option>
                        </Select>
                    </FormField>
                </div>
                <FormField label="اهتمامات الطفل" htmlFor="interests">
                    <Textarea id="interests" value={interests} onChange={(e) => setInterests(e.target.value)} rows={2} placeholder="مثال: الديناصورات، الرسم، كرة القدم"/>
                    <p className="text-xs text-gray-500 mt-1">افصل بين كل اهتمام بفاصلة (,)</p>
                </FormField>
                <FormField label="نقاط قوة الطفل" htmlFor="strengths">
                    <Textarea id="strengths" value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2} placeholder="مثال: شجاع، خياله واسع، يحب مساعدة الآخرين"/>
                    <p className="text-xs text-gray-500 mt-1">افصل بين كل نقطة قوة بفاصلة (,)</p>
                </FormField>
            </form>
        </Modal>
    );
};

export default ChildProfileModal;
