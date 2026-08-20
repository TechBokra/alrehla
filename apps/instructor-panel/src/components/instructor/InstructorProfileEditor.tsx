import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { Instructor, PublishedWork } from '../../lib/database.types';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import FormField from '@alrehla/ui/form-field';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import ImageUploadField from '../ui/ImageUploadField';
import { cloudinaryService } from '../../services/cloudinaryService';

interface InstructorProfileEditorProps {
    instructor: Instructor;
    disabled: boolean;
}

const InstructorProfileEditor: React.FC<InstructorProfileEditorProps> = ({ instructor, disabled }) => {
    const { requestProfileUpdate } = useInstructorMutations();
    const [name, setName] = useState(instructor.name || '');
    const [specialty, setSpecialty] = useState(instructor.specialty || '');
    const [bio, setBio] = useState(instructor.bio || '');
    const [avatarUrl, setAvatarUrl] = useState<any>(instructor.avatar_url || '');
    const [teachingPhilosophy, setTeachingPhilosophy] = useState(instructor.teaching_philosophy || '');
    const [expertiseAreas, setExpertiseAreas] = useState((instructor.expertise_areas || []).join(', '));
    const [introVideoUrl, setIntroVideoUrl] = useState(instructor.intro_video_url || '');
    const [publishedWorks, setPublishedWorks] = useState<PublishedWork[]>(instructor.published_works || []);
    const [justification, setJustification] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const isSaving = requestProfileUpdate.isPending;

    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const hasUnsavedAvatar = (avatarUrl as any) instanceof File;
            const hasUnsavedBooks = publishedWorks.some(w => (w.cover_url as any) instanceof File);
            if (hasUnsavedAvatar || hasUnsavedBooks) {
                e.preventDefault();
                e.returnValue = 'لديك تعديلات غير محفوظة في الصور. هل أنت متأكد من المغادرة؟';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [avatarUrl, publishedWorks]);

    const handlePublishedWorkChange = (index: number, field: keyof PublishedWork, value: string) => {
        const newWorks = [...publishedWorks];
        newWorks[index] = { ...newWorks[index], [field]: value };
        setPublishedWorks(newWorks);
    };
    
    const handlePublishedWorkCoverChange = (index: number, newUrl: any) => {
        const newWorks = [...publishedWorks];
        newWorks[index] = { ...newWorks[index], cover_url: newUrl };
        setPublishedWorks(newWorks);
    };

    const addPublishedWork = () => {
        setPublishedWorks([...publishedWorks, { title: '', cover_url: '' }]);
    };
    
    const removePublishedWork = (index: number) => {
        setPublishedWorks(publishedWorks.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            let finalAvatarUrl = avatarUrl;
            let finalPublishedWorks = [...publishedWorks];

            if ((avatarUrl as any) instanceof File) {
                const asset = await cloudinaryService.uploadImageWithCompression(avatarUrl as any, 'instructors');
                finalAvatarUrl = JSON.stringify(asset);
            }

            for (let i = 0; i < finalPublishedWorks.length; i++) {
                const work = finalPublishedWorks[i];
                if ((work.cover_url as any) instanceof File) {
                    const asset = await cloudinaryService.uploadImageWithCompression(work.cover_url as any, 'instructor_books');
                    finalPublishedWorks[i] = {
                        ...work,
                        cover_url: JSON.stringify(asset)
                    };
                }
            }

            const updates = {
                name,
                specialty,
                bio,
                avatar_url: finalAvatarUrl,
                teaching_philosophy: teachingPhilosophy,
                expertise_areas: expertiseAreas.split(',').map(s => s.trim()).filter(Boolean),
                intro_video_url: introVideoUrl,
                published_works: finalPublishedWorks,
            };
            
            await requestProfileUpdate.mutateAsync({ 
                instructorId: instructor.id,
                updates,
                justification
            });

            if ((avatarUrl as any) instanceof File && instructor.avatar_url) {
                const publicId = cloudinaryService.getPublicIdFromUrl(instructor.avatar_url);
                if (publicId) await cloudinaryService.deleteAsset(publicId);
            }

            if (instructor.published_works) {
                for (const oldWork of instructor.published_works) {
                    const newWork = finalPublishedWorks.find(w => w.title === oldWork.title);
                    if (newWork && newWork.cover_url !== oldWork.cover_url && oldWork.cover_url) {
                        const publicId = cloudinaryService.getPublicIdFromUrl(oldWork.cover_url);
                        if (publicId) await cloudinaryService.deleteAsset(publicId);
                    }
                }
            }

            setJustification('');
        } catch (error) {
            console.error("Failed to save instructor profile updates", error);
        } finally {
            setIsUploading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className={`space-y-8 mt-4 ${disabled ? 'opacity-50' : ''}`}>
            <fieldset disabled={disabled || isSaving || isUploading} className="space-y-8">
                <Card>
                    <CardHeader><CardTitle>المعلومات الأساسية</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <ImageUploadField
                            label="الصورة الرمزية"
                            fieldKey="avatar_url"
                            currentUrl={avatarUrl}
                            onUrlChange={(_, url) => setAvatarUrl(url)}
                        />
                        <FormField label="الاسم" htmlFor="name">
                            <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
                        </FormField>
                         <FormField label="التخصص" htmlFor="specialty">
                            <Input id="specialty" type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                        </FormField>
                        <FormField label="نبذة تعريفية" htmlFor="bio">
                            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5}/>
                        </FormField>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>المحتوى المتقدم</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField label="فلسفتي في التدريب" htmlFor="teachingPhilosophy">
                            <Textarea id="teachingPhilosophy" value={teachingPhilosophy} onChange={(e) => setTeachingPhilosophy(e.target.value)} rows={4}/>
                        </FormField>
                         <FormField label="مجالات الخبرة (افصل بينها بفاصلة)" htmlFor="expertiseAreas">
                            <Input id="expertiseAreas" type="text" value={expertiseAreas} onChange={(e) => setExpertiseAreas(e.target.value)} />
                        </FormField>
                         <FormField label="رابط فيديو تعريفي (يوتيوب)" htmlFor="introVideoUrl">
                            <Input id="introVideoUrl" type="url" value={introVideoUrl} onChange={(e) => setIntroVideoUrl(e.target.value)} dir="ltr" />
                        </FormField>
                    </CardContent>
                </Card>

                <Card>
                     <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>الأعمال المنشورة</span>
                            <Button type="button" size="sm" variant="outline" onClick={addPublishedWork} icon={<Plus size={16}/>}>إضافة كتاب</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {publishedWorks.map((work, index) => (
                             <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/50 items-start">
                                <div className="space-y-4">
                                    <FormField label={`عنوان الكتاب ${index+1}`} htmlFor={`work-title-${index}`}>
                                        <Input id={`work-title-${index}`} value={work.title} onChange={e => handlePublishedWorkChange(index, 'title', e.target.value)} />
                                    </FormField>
                                    <Button type="button" variant="destructive" onClick={() => removePublishedWork(index)} icon={<Trash2 size={16}/>}>حذف الكتاب</Button>
                                </div>
                                <ImageUploadField
                                    label={`صورة الغلاف ${index + 1}`}
                                    fieldKey={`work-cover-${index}`}
                                    currentUrl={work.cover_url}
                                    onUrlChange={(_, url) => handlePublishedWorkCoverChange(index, url)}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>تأكيد التغييرات</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <FormField label="مبررات طلب التعديل (إلزامي)" htmlFor="justification">
                             <Textarea id="justification" value={justification} onChange={(e) => setJustification(e.target.value)} rows={3} placeholder="مثال: قمت بتحديث سيرتي الذاتية وإضافة أعمالي الجديدة." required />
                        </FormField>
                        <div className="flex justify-end mt-4">
                            <Button type="submit" loading={isSaving || isUploading} icon={<Save />}>
                                إرسال طلب التحديث
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </fieldset>
        </form>
    );
};

export default InstructorProfileEditor;
