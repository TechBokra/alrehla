
import { getCurrentAppProfileId, supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const FILE_EXTENSIONS_BY_MIME: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
};

const normalizeFolderPath = (folderPath: string) => {
    return folderPath
        .split('/')
        .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, '_'))
        .filter(Boolean)
        .join('/');
};

export interface UploadedStorageFile {
    url: string;
    path: string;
}

const uploadFileWithPath = async (
    file: File,
    bucket: string,
    folderPath: string,
): Promise<UploadedStorageFile> => {
    const fileExt = FILE_EXTENSIONS_BY_MIME[file.type];
    if (!fileExt) throw new Error('نوع الملف غير مدعوم. استخدم PNG أو JPG أو PDF.');
    if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
        throw new Error('حجم الملف يجب أن يكون أكبر من صفر وألا يتجاوز 10 ميجابايت.');
    }

    const ownerId = await getCurrentAppProfileId();
    if (!ownerId) throw new Error('يجب تسجيل الدخول قبل رفع الملفات.');

    const fileName = `${uuidv4()}.${fileExt}`;
    const normalizedFolder = normalizeFolderPath(folderPath);
    const filePath = [ownerId, normalizedFolder, fileName].filter(Boolean).join('/');

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error("Supabase Storage Error:", error);
        throw error;
    }

    const { data: signedData, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(data.path, 315360000);

    if (signError) {
        console.error("Supabase Storage Sign Error:", signError);
        const { error: cleanupError } = await supabase.storage
            .from(bucket)
            .remove([data.path]);
        if (cleanupError) {
            console.error("Supabase Storage cleanup after signing failure:", cleanupError);
        }
        throw signError;
    }

    return { url: signedData.signedUrl, path: data.path };
};

export const storageService = {
    async uploadFile(file: File, bucket: string, folderPath: string): Promise<string> {
        try {
            return (await uploadFileWithPath(file, bucket, folderPath)).url;
        } catch (error: any) {
            console.error("File Upload Exception:", error);
            throw new Error(`فشل رفع الملف إلى الخادم: ${error.message}`);
        }
    },

    async uploadFileWithPath(
        file: File,
        bucket: string,
        folderPath: string,
    ): Promise<UploadedStorageFile> {
        try {
            return await uploadFileWithPath(file, bucket, folderPath);
        } catch (error: any) {
            console.error("File Upload Exception:", error);
            throw new Error(`فشل رفع الملف إلى الخادم: ${error.message}`);
        }
    },

    async removeFiles(bucket: string, paths: string[]): Promise<void> {
        const uniquePaths = [...new Set(paths.filter(Boolean))];
        if (uniquePaths.length === 0) return;

        const { error } = await supabase.storage.from(bucket).remove(uniquePaths);
        if (error) {
            console.error("Supabase Storage Remove Error:", error);
            throw new Error('تعذر تنظيف الملفات غير المستخدمة من التخزين.');
        }
    }
};
