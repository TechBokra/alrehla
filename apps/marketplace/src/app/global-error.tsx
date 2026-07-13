'use client';

import { useEffect } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full text-center border border-gray-100">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <AlertOctagon size={48} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">عذراً، حدث خطأ جسيم</h1>
            <p className="text-gray-500 mb-8 leading-relaxed text-lg">
              نأسف جداً، لقد واجهنا مشكلة تقنية حرجة منعت تحميل التطبيق. يرجى محاولة تحديث الصفحة
              بالكامل.
            </p>

            {/* Error Technical Details */}
            {process.env.NODE_ENV !== 'production' && error.message && (
              <div className="mb-8 text-right">
                <details className="text-sm text-gray-500 cursor-pointer">
                  <summary className="font-medium outline-none">التفاصيل التقنية للخطأ</summary>
                  <pre
                    className="mt-3 p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl overflow-auto max-h-48 font-mono text-left text-xs"
                    dir="ltr"
                  >
                    {error.stack || error.message}
                  </pre>
                </details>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-md text-lg"
              >
                <RefreshCw size={20} />
                إعادة تحميل التطبيق
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
