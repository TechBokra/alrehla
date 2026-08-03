import React from 'react';
import Link from 'next/link';
import { Map, Home, Search, ArrowRight } from 'lucide-react';
import { Button } from '@alrehla/ui/button';

const NotFoundPage: React.FC = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-fadeIn bg-gray-50/50">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-100 rounded-full opacity-50 blur-xl animate-pulse"></div>
                <div className="relative bg-white p-6 rounded-full shadow-xl border-4 border-blue-50">
                    <Map size={64} className="text-blue-500" />
                </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4">404</h1>
            <h2 className="text-xl md:text-2xl font-bold text-gray-700 mb-4">عذراً، يبدو أننا ضللنا الطريق!</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها. لا تقلق، يمكنك العودة لمسارك الصحيح بسهولة.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button as={Link} href="/" size="lg" className="shadow-lg hover:shadow-xl transition-all">
                    <Home size={18} className="ml-2" />
                    العودة للرئيسية
                </Button>
                <Button as={Link} href="/support" variant="outline" size="lg">
                    <Search size={18} className="ml-2" />
                    مركز المساعدة
                </Button>
            </div>
        </div>
    );
};

export default NotFoundPage;
