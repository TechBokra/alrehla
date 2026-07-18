
import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import type { Instructor } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import FormField from '@alrehla/ui/form-field';
import Modal from '@alrehla/ui/modal';
import { compressImage } from '../../utils/imageCompression';
import { useToast } from '../../contexts/ToastContext';

// InstructorModal Component
const InstructorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (details: { name: string; specialty: string; slug: string; bio: string; avatarFile: File | null; id?: number }) => void;
    instructor: Instructor | null;
    isSaving: boolean;
}> = ({ isOpen, onClose, onSave, instructor, isSaving }) => {
    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [slug, setSlug] = useState('');
    const [bio, setBio] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            if (instructor) {
                setName(instructor.name);
                setSpecialty(instructor.specialty || '');
                setSlug(instructor.slug || '');
                setBio(instructor.bio || '');
                setPreview(instructor.avatar_url || null);
            } else {
                setName('');
                setSpecialty('');
                setSlug('');
                setBio('');
                setPreview(null);
            }
            setAvatarFile(null);
        }
    }, [instructor, isOpen]);
    
    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setIsProcessing(true);
            try {
                const compressedDataUrl = await compressImage(file);
                const res = await fetch(compressedDataUrl);
                const blob = await res.blob();
                const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                
                setAvatarFile(compressedFile);
                setPreview(compressedDataUrl);
            } catch (e) {
                addToast('فشل ضغط الصورة', 'error');
            } finally {
                setIsProcessing(false);
            }
        } else {
            setAvatarFile(null);
            setPreview(instructor?.avatar_url || null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: instructor?.id, name, specialty, slug, bio, avatarFile });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={instructor ? 'تعديل المدرب' : 'إضافة مدرب جديد'}
            footer={
                <>
                    <Button type="button" onClick={onClose} disabled={isSaving || isProcessing} variant="ghost">
                        إلغاء
                    </Button>
                    <Button type="submit" form="instructor-form" loading={isSaving || isProcessing}>
                        {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                </>
            }
        >
            <form id="instructor-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-muted overflow-hidden relative">
                        {isProcessing ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                                <Loader2 className="animate-spin text-primary" />
                            </div>
                        ) : (
                            <img src={preview || 'https://i.ibb.co/2S4xT8w/male-avatar.png'} alt="Avatar" className="w-full h-full object-cover" loading="lazy" />
                        )}
                    </div>
                    <div className="flex-grow">
                        <input type="file" onChange={handleFileChange} accept="image/*" disabled={isProcessing} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50"/>
                    </div>
                </div>
                <FormField label="اسم المدرب" htmlFor="name">
                    <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </FormField>
                    <FormField label="التخصص" htmlFor="specialty">
                    <Input type="text" id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                </FormField>
                <FormField label="معرّف الرابط (Slug)" htmlFor="slug">
                    <Input type="text" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="مثال: ahmed-masri" required />
                    <p className="text-xs text-muted-foreground mt-1">يُستخدم في رابط الصفحة الشخصية للمدرب. يجب أن يكون فريدًا وبدون مسافات.</p>
                </FormField>
                <FormField label="نبذة تعريفية" htmlFor="bio">
                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
                </FormField>
            </form>
        </Modal>
    );
};

export default InstructorModal;
