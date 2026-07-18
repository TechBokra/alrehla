"use client";


import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';
import { useToast } from '../../contexts/ToastContext';
import Image from '@alrehla/ui/next-image';

interface ImageUploadProps {
    id: string;
    label: string;
    onFileChange: (id: string, file: File | null) => void;
    file: File | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ id, label, onFileChange, file }) => {
    const [preview, setPreview] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (!file) {
            setPreview('');
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        
        if (selectedFile) {
            setIsProcessing(true);
            try {
                // Compress image to base64 string
                const compressedDataUrl = await compressImage(selectedFile);
                
                // Convert base64 back to File object for the parent component's consistency
                const res = await fetch(compressedDataUrl);
                const blob = await res.blob();
                const compressedFile = new File([blob], selectedFile.name, { type: 'image/jpeg' });
                
                onFileChange(id, compressedFile);
            } catch (error) {
                console.error("Image processing error:", error);
                addToast("حدث خطأ أثناء معالجة الصورة.", "error");
            } finally {
                setIsProcessing(false);
            }
        } else {
            onFileChange(id, null);
        }
    };

    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
            <div className="mt-1 flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative border border-gray-200">
                    {isProcessing ? (
                        <Loader2 className="animate-spin text-primary" />
                    ) : preview ? (
                        <Image src={preview} alt="Preview" className="h-full w-full" loading="lazy" />
                    ) : (
                        <ImageIcon className="text-gray-400" />
                    )}
                </div>
                <label htmlFor={id} className={`cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <span>{file ? 'تغيير الصورة' : 'رفع صورة'}</span>
                    <input id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isProcessing} />
                </label>
            </div>
        </div>
    );
};

export default ImageUpload;
