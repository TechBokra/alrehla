'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import {
    FormError,
    FormSubmitButton,
    useAppFieldContext,
    useAppForm,
    zodFormOptions,
} from '@alrehla/forms';
import { Button } from '@alrehla/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import type { Instructor } from '../../lib/database.types';
import { cloudinaryService } from '../../services/cloudinaryService';
import ImageUploadField from '../ui/ImageUploadField';
import {
    getInstructorProfileDefaultValues,
    instructorProfileSchema,
    type InstructorProfileFormValues,
    type InstructorProfileUpdatePayload,
} from './instructor-profile.schema';

interface InstructorProfileEditorProps {
    instructor: Instructor;
    disabled: boolean;
}

const isFileValue = (value: string | File | null): value is File =>
    typeof File !== 'undefined' && value instanceof File;

const uploadImageValue = async (
    value: string | File | null,
    folder: string,
): Promise<string | null> => {
    if (!isFileValue(value)) return value;

    const asset = await cloudinaryService.uploadImageWithCompression(value, folder);
    return JSON.stringify(asset);
};

const ProfileImageField = ({
    label,
    fieldKey,
}: {
    label: string;
    fieldKey: string;
}) => {
    const field = useAppFieldContext<string | File | null>();

    return (
        <ImageUploadField
            label={label}
            fieldKey={fieldKey}
            currentUrl={field.state.value}
            onUrlChange={(_, value) => field.handleChange(value)}
        />
    );
};

const PublishedWorksEditor = () => {
    const field = useAppFieldContext<InstructorProfileFormValues['publishedWorks']>();
    const works = field.state.value ?? [];

    const updateWork = (
        index: number,
        update: Partial<InstructorProfileFormValues['publishedWorks'][number]>,
    ) => {
        field.handleChange(
            works.map((work, workIndex) =>
                workIndex === index ? { ...work, ...update } : work,
            ),
        );
    };

    return (
        <>
            {works.map((work, index) => (
                <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/50 items-start"
                >
                    <div className="space-y-4">
                        <FormField label={`عنوان الكتاب ${index + 1}`} htmlFor={`work-title-${index}`}>
                            <Input
                                id={`work-title-${index}`}
                                value={work.title ?? ''}
                                onChange={(event) => updateWork(index, { title: event.currentTarget.value })}
                            />
                        </FormField>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => field.handleChange(works.filter((_, workIndex) => workIndex !== index))}
                            icon={<Trash2 size={16} />}
                        >
                            حذف الكتاب
                        </Button>
                    </div>
                    <ImageUploadField
                        label={`صورة الغلاف ${index + 1}`}
                        fieldKey={`publishedWorks-${index}-coverUrl`}
                        currentUrl={work.coverUrl}
                        onUrlChange={(_, value) => updateWork(index, { coverUrl: value })}
                    />
                </div>
            ))}
        </>
    );
};

const PublishedWorksCard = () => {
    const field = useAppFieldContext<InstructorProfileFormValues['publishedWorks']>();
    const works = field.state.value ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>الأعمال المنشورة</span>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => field.handleChange([...works, { title: '', coverUrl: '' }])}
                        icon={<Plus size={16} />}
                    >
                        إضافة كتاب
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <PublishedWorksEditor />
            </CardContent>
        </Card>
    );
};

const ProfileBeforeUnloadGuard = ({
    avatarUrl,
    publishedWorks,
}: {
    avatarUrl: InstructorProfileFormValues['avatarUrl'];
    publishedWorks: InstructorProfileFormValues['publishedWorks'];
}) => {
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            const hasUnsavedAvatar = isFileValue(avatarUrl);
            const hasUnsavedBooks = publishedWorks.some((work) => isFileValue(work.coverUrl));

            if (!hasUnsavedAvatar && !hasUnsavedBooks) return;

            event.preventDefault();
            event.returnValue = 'لديك تعديلات غير محفوظة في الصور. هل أنت متأكد من المغادرة؟';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [avatarUrl, publishedWorks]);

    return null;
};

const InstructorProfileEditor: React.FC<InstructorProfileEditorProps> = ({ instructor, disabled }) => {
    const { requestProfileUpdate } = useInstructorMutations();
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const defaultValues = useMemo(
        () => getInstructorProfileDefaultValues(instructor),
        [instructor],
    );

    const form = useAppForm({
        ...zodFormOptions(instructorProfileSchema),
        formId: `instructor-profile-${instructor.id}`,
        defaultValues,
        listeners: {
            onChange: () => setSubmissionError(null),
        },
        onSubmit: async ({ formApi, value }) => {
            setSubmissionError(null);

            let finalAvatarUrl: string | null;
            let finalPublishedWorks: InstructorProfileUpdatePayload['published_works'];

            try {
                finalAvatarUrl = await uploadImageValue(value.avatarUrl, 'instructors');
                finalPublishedWorks = [];

                for (const work of value.publishedWorks) {
                    finalPublishedWorks.push({
                        title: work.title,
                        cover_url: await uploadImageValue(work.coverUrl, 'instructor_books'),
                    });
                }
            } catch (error) {
                console.error('Failed to upload instructor profile image', error);
                setSubmissionError('تعذر رفع صورة الملف الشخصي. يرجى المحاولة مرة أخرى.');
                throw error;
            }

            const updates: InstructorProfileUpdatePayload = {
                name: value.name,
                specialty: value.specialty,
                bio: value.bio,
                avatar_url: finalAvatarUrl,
                teaching_philosophy: value.teachingPhilosophy,
                expertise_areas: value.expertiseAreas
                    .split(',')
                    .map((area) => area.trim())
                    .filter(Boolean),
                intro_video_url: value.introVideoUrl,
                published_works: finalPublishedWorks,
            };

            try {
                await requestProfileUpdate.mutateAsync({
                    instructorId: instructor.id,
                    updates,
                    justification: value.justification,
                });
            } catch (error) {
                console.error('Failed to save instructor profile updates', error);
                setSubmissionError('تعذر إرسال طلب تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.');
                throw error;
            }

            if (isFileValue(value.avatarUrl) && instructor.avatar_url) {
                const publicId = cloudinaryService.getPublicIdFromUrl(instructor.avatar_url);
                if (publicId) await cloudinaryService.deleteAsset(publicId);
            }

            if (instructor.published_works) {
                for (const oldWork of instructor.published_works) {
                    const newWork = finalPublishedWorks.find((work) => work.title === oldWork.title);
                    if (newWork && newWork.cover_url !== oldWork.cover_url && oldWork.cover_url) {
                        const publicId = cloudinaryService.getPublicIdFromUrl(oldWork.cover_url);
                        if (publicId) await cloudinaryService.deleteAsset(publicId);
                    }
                }
            }

            formApi.reset({
                ...value,
                avatarUrl: finalAvatarUrl,
                publishedWorks: finalPublishedWorks.map((work) => ({
                    title: work.title,
                    coverUrl: work.cover_url,
                })),
                justification: '',
            });
        },
    });

    return (
        <form.AppForm>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void form.handleSubmit().catch(() => undefined);
                }}
                className={`space-y-8 mt-4 ${disabled ? 'opacity-50' : ''}`}
            >
                <form.Subscribe
                    selector={(state) => ({
                        avatarUrl: state.values.avatarUrl,
                        publishedWorks: state.values.publishedWorks,
                    })}
                >
                    {(values) => (
                        <ProfileBeforeUnloadGuard
                            avatarUrl={values.avatarUrl}
                            publishedWorks={values.publishedWorks}
                        />
                    )}
                </form.Subscribe>

                <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                        <fieldset disabled={disabled || isSubmitting} className="space-y-8">
                            <Card>
                                <CardHeader><CardTitle>المعلومات الأساسية</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <form.AppField name="avatarUrl">
                                        {() => <ProfileImageField label="الصورة الرمزية" fieldKey="avatarUrl" />}
                                    </form.AppField>
                                    <form.AppField name="name">
                                        {(field) => <field.TextField label="الاسم" />}
                                    </form.AppField>
                                    <form.AppField name="specialty">
                                        {(field) => <field.TextField label="التخصص" />}
                                    </form.AppField>
                                    <form.AppField name="bio">
                                        {(field) => <field.TextareaField label="نبذة تعريفية" rows={5} />}
                                    </form.AppField>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>المحتوى المتقدم</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <form.AppField name="teachingPhilosophy">
                                        {(field) => <field.TextareaField label="فلسفتي في التدريب" rows={4} />}
                                    </form.AppField>
                                    <form.AppField name="expertiseAreas">
                                        {(field) => (
                                            <field.TextField
                                                label="مجالات الخبرة (افصل بينها بفاصلة)"
                                            />
                                        )}
                                    </form.AppField>
                                    <form.AppField name="introVideoUrl">
                                        {(field) => (
                                            <field.TextField
                                                label="رابط فيديو تعريفي (يوتيوب)"
                                                type="url"
                                                dir="ltr"
                                            />
                                        )}
                                    </form.AppField>
                                </CardContent>
                            </Card>

                            <form.AppField name="publishedWorks">
                                {() => <PublishedWorksCard />}
                            </form.AppField>

                            <Card>
                                <CardHeader><CardTitle>تأكيد التغييرات</CardTitle></CardHeader>
                                <CardContent>
                                    <form.AppField name="justification">
                                        {(field) => (
                                            <field.TextareaField
                                                label="مبررات طلب التعديل (إلزامي)"
                                                placeholder="مثال: قمت بتحديث سيرتي الذاتية وإضافة أعمالي الجديدة."
                                                required
                                                rows={3}
                                            />
                                        )}
                                    </form.AppField>
                                    <FormError className="mt-3" />
                                    {submissionError && (
                                        <p className="mt-3 text-sm font-medium text-destructive" role="alert">
                                            {submissionError}
                                        </p>
                                    )}
                                    <div className="flex justify-end mt-4">
                                        <FormSubmitButton icon={<Save />}>
                                            إرسال طلب التحديث
                                        </FormSubmitButton>
                                    </div>
                                </CardContent>
                            </Card>
                        </fieldset>
                    )}
                </form.Subscribe>
            </form>
        </form.AppForm>
    );
};

export default InstructorProfileEditor;
