'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@alrehla/ui';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[70vh] bg-gray-50/50 p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
            <AlertTriangle size={40} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">عذراً، حدث خطأ في هذه الصفحة</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          نعتذر عن هذا الخلل. حاول تحديث الصفحة، أو العودة إلى الصفحة الرئيسية إذا استمرت المشكلة.
        </p>

        {/* Error Technical Details */}
        {process.env.NODE_ENV !== 'production' && error.message && (
          <div className="mb-6 text-right">
            <details className="text-xs text-gray-500 cursor-pointer">
              <summary className="font-medium outline-none">التفاصيل التقنية للخطأ</summary>
              <pre
                className="mt-2 p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg overflow-auto max-h-40 font-mono text-left"
                dir="ltr"
              >
                {error.message}
              </pre>
            </details>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button onClick={() => reset()} size="lg" variant="primary">
            <RefreshCw size={18} />
            المحاولة مجدداً
          </Button>
          <Button onClick={() => (window.location.href = '/')} size="lg" variant="secondary">
            <Home size={18} />
            الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
