
import { DEFAULT_CONFIG } from '../lib/config';
import { supabase } from '../lib/supabaseClient';
import {
    captureApiError,
    compressImage,
    shouldIgnoreError,
} from '@alrehla/utils';

export interface CloudinaryAsset {
    url: string;
    public_id: string;
    width?: number;
    height?: number;
    format?: string;
}

// القيم الافتراضية من ملف التكوين
let CLOUD_NAME = DEFAULT_CONFIG.cloudinary.cloudName;
let UPLOAD_PRESET = DEFAULT_CONFIG.cloudinary.uploadPreset;

// دالة لتحديث الإعدادات من قاعدة البيانات (إذا وجد تعديل)
const refreshConfig = async () => {
    try {
        const { data } = await supabase.from('site_settings').select('value').eq('key', 'system_config').maybeSingle();
        if (data && (data as any).value?.cloudinary) {
            const dynamicConfig = (data as any).value.cloudinary;
            // نستخدم القيم من القاعدة فقط إذا كانت موجودة وغير فارغة
            if (dynamicConfig.cloudName && dynamicConfig.cloudName.trim() !== '') {
                CLOUD_NAME = dynamicConfig.cloudName;
            }
            if (dynamicConfig.uploadPreset && dynamicConfig.uploadPreset.trim() !== '') {
                UPLOAD_PRESET = dynamicConfig.uploadPreset;
            }
        }
    } catch (e) {
        // Fallback to defaults silently
        console.warn("Using default Cloudinary config due to fetch error.");
    }
};

// استدعاء أولي (اختياري)
refreshConfig();

export const cloudinaryService = {
    /**
     * الحصول على اسم السحابة الحالي
     */
    getCloudName(): string {
        return CLOUD_NAME || '';
    },

    /**
     * رفع ملف (صورة) إلى Cloudinary
     */
    async uploadImage(file: File, folder: string = 'alrehla_general'): Promise<CloudinaryAsset> {
        // تأكد من تحديث الإعدادات قبل الرفع
        await refreshConfig();

        if (!file) throw new Error("لا يوجد ملف لرفعه.");
        
        if (file.size > 10 * 1024 * 1024) {
            throw new Error("حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت.");
        }

        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
        const formData = new FormData();
        
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', folder);

        const startedAt = Date.now();
        let statusCode: number | undefined;
        let captured = false;

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });
            statusCode = response.status;

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error?.message || 'فشل رفع الصورة إلى Cloudinary';
                const uploadError = new Error(errorMsg);
                captureApiError(uploadError, {
                    url,
                    method: 'POST',
                    statusCode: response.status,
                    durationMs: Date.now() - startedAt,
                    metadata: { provider: 'cloudinary' },
                });
                captured = true;
                throw uploadError;
            }

            return {
                url: data.secure_url,
                public_id: data.public_id,
                width: data.width,
                height: data.height,
                format: data.format
            };
        } catch (error: any) {
            if (!captured && !shouldIgnoreError(error)) {
                captureApiError(error, {
                    url,
                    method: 'POST',
                    statusCode,
                    durationMs: Date.now() - startedAt,
                    metadata: { provider: 'cloudinary' },
                });
            }
            throw error;
        }
    },

    /**
     * رفع صورة مع ضغطها تلقائياً على جانب العميل أولاً
     */
    async uploadImageWithCompression(file: File, folder: string = 'alrehla_general'): Promise<CloudinaryAsset> {
        let fileToUpload = file;
        if (file.type.startsWith('image/')) {
            try {
                // ضغط الصورة إلى حد أقصى 1600 بكسل بجودة 0.8
                const compressedDataUrl = await compressImage(file, 1600, 0.8);
                const res = await fetch(compressedDataUrl);
                const blob = await res.blob();
                fileToUpload = new File([blob], file.name, { type: 'image/jpeg' });
            } catch (err) {
                console.warn("Client-side image compression failed. Uploading original file.", err);
            }
        }
        return this.uploadImage(fileToUpload, folder);
    },

    /**
     * استخراج الـ public_id من رابط Cloudinary
     */
    getPublicIdFromUrl(url: string): string | null {
        if (!url || !url.includes('cloudinary.com')) return null;
        try {
            const parts = url.split('/upload/');
            if (parts.length < 2) return null;
            
            const pathAfterUpload = parts[1];
            // حذف بادئة الإصدار إن وجدت (مثال: v12345678/)
            const versionRegex = /^v\d+\//;
            const cleanPath = pathAfterUpload.replace(versionRegex, '');
            
            // حذف الامتداد للحصول على public_id بالكامل
            const dotIndex = cleanPath.lastIndexOf('.');
            if (dotIndex === -1) return cleanPath;
            return cleanPath.substring(0, dotIndex);
        } catch (e) {
            return null;
        }
    },

    /**
     * طلب حذف أصل من Cloudinary (يتطلب إعدادات خادومية في بيئة الإنتاج)
     */
    async deleteAsset(publicId: string): Promise<boolean> {
        console.log(`[Cloudinary Deletion] Requesting deletion of asset with public_id: ${publicId}`);
        // ملاحظة: الحذف المباشر من المتصفح غير آمن لأنه يتطلب API Secret.
        // في بيئة الإنتاج الحقيقية، يجب استدعاء Edge Function أو خادم وسيط يقوم بالعملية بشكل آمن.
        // مثال:
        // await fetch('/api/delete-asset', { method: 'POST', body: JSON.stringify({ publicId }) });
        return true;
    },

    /**
     * تحسين رابط الصورة تلقائياً
     */
    optimizeUrl(url: string, width?: number): string {
        if (!url) return '';
        
        // استثناء الروابط المحلية والبيانات المباشرة من المعالجة
        if (url.startsWith('blob:') || url.startsWith('data:') || url.includes('localhost') || url.includes('127.0.0.1')) {
            return url;
        }

        // إذا لم يكن رابط Cloudinary، أعده كما هو (للروابط الخارجية أو Placeholders)
       if (!url.match(/^https:\/\/res\.cloudinary\.com\//)) return url;
        
        // إذا كان الرابط محسناً بالفعل، لا تلمسه
        if (url.includes('f_auto,q_auto')) return url;

        // التأكد من استخدام Cloud Name الصحيح في الرابط إذا تغير
        const parts = url.split('/upload/');
        if (parts.length !== 2) return url;

        const transformations = ['f_auto', 'q_auto'];
        if (width) transformations.push(`w_${width}`);

        return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
    }
};
