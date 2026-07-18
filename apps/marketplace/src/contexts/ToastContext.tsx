"use client";

import React, { ReactNode, useCallback } from 'react';
import { Toaster } from '@alrehla/ui/sonner';
import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <>
            {children}
            <Toaster position="top-right" richColors />
        </>
    );
};

export const useToast = (): ToastContextType => {
    const addToast = useCallback((message: string, type: ToastType) => {
        if (type === 'success') {
            toast.success(message);
        } else if (type === 'error') {
            toast.error(message);
        } else if (type === 'warning') {
            toast.warning(message);
        } else {
            toast.info(message);
        }
    }, []);

    return { addToast };
};
