import { z } from 'zod';
import type { Instructor } from '../../lib/database.types';

const fileValueSchema = z.custom<File>(
  (value) => typeof File !== 'undefined' && value instanceof File,
  { message: 'يرجى اختيار صورة صالحة.' },
);

const editableImageSchema = z.union([z.string(), fileValueSchema, z.null()]);

export const instructorProfileSchema = z.object({
  name: z.string(),
  specialty: z.string(),
  bio: z.string(),
  avatarUrl: editableImageSchema,
  teachingPhilosophy: z.string(),
  expertiseAreas: z.string(),
  introVideoUrl: z.string().url('يرجى إدخال رابط فيديو صحيح.').or(z.literal('')),
  publishedWorks: z.array(
    z.object({
      title: z.string(),
      coverUrl: editableImageSchema,
    }),
  ),
  justification: z.string().min(1, 'مبررات طلب التعديل مطلوبة.'),
});

export type InstructorProfileFormValues = z.infer<typeof instructorProfileSchema>;

export interface InstructorProfileUpdatePayload {
  name: string;
  specialty: string;
  bio: string;
  avatar_url: string | null;
  teaching_philosophy: string;
  expertise_areas: string[];
  intro_video_url: string;
  published_works: Array<{
    title: string;
    cover_url: string | null;
  }>;
}

export const getInstructorProfileDefaultValues = (
  instructor: Instructor,
): InstructorProfileFormValues => ({
  name: instructor.name || '',
  specialty: instructor.specialty || '',
  bio: instructor.bio || '',
  avatarUrl: instructor.avatar_url || '',
  teachingPhilosophy: instructor.teaching_philosophy || '',
  expertiseAreas: (instructor.expertise_areas || []).join(', '),
  introVideoUrl: instructor.intro_video_url || '',
  publishedWorks: (instructor.published_works || []).map((work) => ({
    title: work.title || '',
    coverUrl: work.cover_url || '',
  })),
  justification: '',
});
