"use client";


import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;

        if (selectedFile) {
            if (!['image/png', 'image/jpeg'].includes(selectedFile.type)) {
                addToast('صور التخصيص يجب أن تكون بصيغة PNG أو JPG.', 'error');
                e.currentTarget.value = '';
                return;
            }
            if (selectedFile.size <= 0 || selectedFile.size > 10 * 1024 * 1024) {
                addToast('حجم الصورة يجب ألا يتجاوز 10 ميجابايت.', 'error');
                e.currentTarget.value = '';
                return;
            }
        }

        // Keep the original File in RHF. The only preview URL is a browser-
        // local object URL; the file is uploaded by the checkout server action.
        onFileChange(id, selectedFile);
    };

    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
            <div className="mt-1 flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative border border-gray-200">
                    {preview ? (
                        <Image src={preview} alt="Preview" className="h-full w-full" loading="lazy" />
                    ) : (
                        <ImageIcon className="text-gray-400" />
                    )}
                </div>
                <label htmlFor={id} className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                    <span>{file ? 'تغيير الصورة' : 'رفع صورة'}</span>
                    <input id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} accept="image/png,image/jpeg" />
                </label>
            </div>
        </div>
    );
};

export default ImageUpload;
