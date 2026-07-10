
import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineBanner: React.FC = () => {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="bg-gray-900 text-white px-4 py-3 shadow-md fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 animate-slideUp">
            <WifiOff size={20} className="text-red-400" />
            <span className="font-medium text-sm">
                لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة لديك.
            </span>
        </div>
    );
};

export default OfflineBanner;
