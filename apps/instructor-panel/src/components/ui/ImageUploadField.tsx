import React, { useState, useEffect } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Input } from '@alrehla/ui/input';
import FormField from '@alrehla/ui/form-field';
import Image from '@alrehla/ui/image';
import { cloudinaryService } from '../../services/cloudinaryService';
import { useToast } from '../../contexts/ToastContext';

interface ImageUploadFieldProps {
    label: string;
    fieldKey: string;
    currentUrl?: any; 
    onUrlChange: (fieldKey: string, value: string | File | null) => void;
    recommendedSize?: string; 
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ label, fieldKey, currentUrl, onUrlChange, recommendedSize }) => {
    const [preview, setPreview] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const { addToast } = useToast();

    const cloudName = cloudinaryService.getCloudName();

    useEffect(() => {
        if (currentUrl instanceof File) {
            setSelectedFile(currentUrl);
            const objectUrl = URL.createObjectURL(currentUrl);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (currentUrl) {
            setSelectedFile(null);
            if (typeof currentUrl === 'object' && currentUrl !== null && 'url' in currentUrl) {
                setPreview(currentUrl.url);
            } else if (typeof currentUrl === 'string') {
                if (currentUrl.startsWith('{') && currentUrl.endsWith('}')) {
                    try {
                        const parsed = JSON.parse(currentUrl);
                        setPreview(parsed?.url || '');
                    } catch (e) {
                        setPreview(currentUrl);
                    }
                } else {
                    setPreview(currentUrl);
                }
            }
        } else {
            setSelectedFile(null);
            setPreview('');
        }
    }, [currentUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setUploadError(null);
            
            if (file.size > 10 * 1024 * 1024) {
                setUploadError("حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت.");
                addToast("حجم الملف يتجاوز 10 ميجابايت", "error");
                return;
            }

            if (!file.type.startsWith('image/')) {
                setUploadError("نوع الملف غير صالح. يرجى اختيار صورة.");
                addToast("يرجى اختيار ملف صورة صالح", "error");
                return;
            }

            setSelectedFile(file);
            onUrlChange(fieldKey, file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedFile(null);
        setPreview('');
        setUploadError(null);
        onUrlChange(fieldKey, null);
    };

    return (
        <FormField 
            label={
                <span className="flex items-center gap-2">
                    {label}
                    {recommendedSize && (
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full dir-ltr">
                            {recommendedSize}
                        </span>
                    )}
                </span>
            } 
            htmlFor={fieldKey}
        >
            <div className={`flex items-center gap-4 p-4 border rounded-lg ${uploadError ? 'bg-red-50 border-red-200' : 'bg-muted/50'}`}>
                <div className="w-24 h-24 rounded-md bg-background flex-shrink-0 overflow-hidden border relative group">
                    <Image 
                        src={preview || ""} 
                        alt={`${label} Preview`} 
                        className="w-full h-full" 
                    />
                    {!preview && (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs text-center p-1">
                            {recommendedSize || "لا توجد صورة"}
                        </div>
                    )}
                </div>
                <div className="flex-grow space-y-3">
                    <div className="flex gap-2">
                        <label htmlFor={fieldKey} className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                            <Upload size={16} />
                            <span>{preview ? 'تغيير الصورة' : 'اختر صورة'}</span>
                        </label>
                        {preview && (
                            <button 
                                type="button" 
                                onClick={handleRemoveImage}
                                className="bg-white py-2 px-3 border border-red-200 text-red-600 rounded-md shadow-sm text-sm hover:bg-red-50"
                                title="إزالة الصورة"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <Input id={fieldKey} type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                    
                    {uploadError ? (
                        <p className="text-xs text-red-600 flex items-center gap-1 font-semibold">
                            <AlertCircle size={12} /> {uploadError}
                        </p>
                    ) : (
                        <p className="text-[10px] text-muted-foreground">
                            {recommendedSize ? `الأبعاد الموصى بها: ${recommendedSize}.` : ''} سيتم الرفع إلى سحابة {cloudName || 'Cloudinary'} عند الحفظ.
                        </p>
                    )}
                </div>
            </div>
        </FormField>
    );
};

export default ImageUploadField;
