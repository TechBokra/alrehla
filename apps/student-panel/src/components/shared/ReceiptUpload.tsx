"use client";


import React, { useState, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';
import { useToast } from '../../contexts/ToastContext';
import Image from '@alrehla/ui/next-image';

interface ReceiptUploadProps {
    file: File | null;
    setFile: (file: File | null) => void;
    disabled?: boolean;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ file, setFile, disabled }) => {
    const [preview, setPreview] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (!file) {
            setPreview('');
            return;
        }

        if (file.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setPreview('');
        }
    }, [file]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        if (selectedFile) {
            // Only compress images
            if (selectedFile.type.startsWith('image/')) {
                setIsProcessing(true);
                try {
                    const compressedDataUrl = await compressImage(selectedFile);
                    const res = await fetch(compressedDataUrl);
                    const blob = await res.blob();
                    const compressedFile = new File([blob], selectedFile.name, { type: 'image/jpeg' });
                    setFile(compressedFile);
                } catch (error) {
                    console.error("Receipt processing error:", error);
                    addToast("خطأ في معالجة الصورة", "error");
                } finally {
                    setIsProcessing(false);
                }
            } else {
                setFile(selectedFile); // PDF or other docs
            }
        } else {
            setFile(null);
        }
    };

    return (
        <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-colors ${!disabled && 'hover:border-blue-400'}`}>
            <div className="space-y-1 text-center relative">
                {isProcessing ? (
                    <div className="h-24 flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary h-8 w-8" />
                        <span className="mr-2 text-sm text-muted-foreground">جاري المعالجة...</span>
                    </div>
                ) : preview ? (
                     <Image src={preview} alt="Preview" className="h-24 w-24 mx-auto rounded-md shadow-sm" loading="lazy" />
                ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                )}
                
                <div className="flex text-sm text-gray-600 justify-center mt-2">
                    <label htmlFor="receipt-file-upload" className={`relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 ${disabled || isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
                        <span>{file ? 'تغيير الملف' : 'اختر ملفًا'}</span>
                        <input id="receipt-file-upload" name="receipt-file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" required disabled={disabled || isProcessing} />
                    </label>
                    <p className="ps-1">{file ? file.name : 'أو اسحبه هنا'}</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF (الصور سيتم ضغطها تلقائياً)</p>
            </div>
        </div>
    );
};

export default ReceiptUpload;
