"use client";


import React from 'react';
import { Card, CardContent } from '@alrehla/ui/card';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import { FileText, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from '@/lib/router-compat';

const TermsOfUsePage: React.FC = () => {
  const { data, isLoading } = usePublicData();
  const terms = data?.siteContent?.termsPage;

  if (isLoading) return <PageLoader text="جاري تحميل الشروط..." />;

  const lastUpdated = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  // Function to render text with paragraphs
  const renderContent = (content: string) => {
    return content.split(/\r?\n/).map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-4" />;
        
        const isHeader = /^\d+\./.test(trimmed) || trimmed.startsWith('**');
        const cleanText = trimmed.replace(/\*\*/g, '');
        
        if (isHeader) {
             return (
                <h3 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3 border-b pb-2 border-blue-100 w-fit">
                    {cleanText}
                </h3>
            );
        }
        
        return (
            <p key={index} className="text-gray-700 leading-loose mb-2 text-lg">
                {trimmed}
            </p>
        );
    });
  };

  return (
    <div className="bg-gray-50/50 py-12 sm:py-20 animate-fadeIn min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        
        <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium mb-4">
                <ArrowLeft size={16} /> العودة للرئيسية
            </Link>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                    <FileText size={32} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                    {terms?.title || "شروط الاستخدام"}
                </h1>
            </div>
             <p className="text-gray-500 flex items-center gap-2 text-sm mt-2">
                <Calendar size={14} /> آخر تحديث: {lastUpdated}
            </p>
        </div>

        <Card className="shadow-lg border-t-4 border-t-blue-500 bg-white">
            <CardContent className="p-8 sm:p-12 text-justify">
                 {terms?.content ? (
                    <div className="prose prose-lg max-w-none text-right">
                        {renderContent(terms.content)}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <p>جاري تحميل نص الشروط...</p>
                    </div>
                 )}

                <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500">
                        باستخدامك لمنصة الرحلة، فإنك توافق على هذه الشروط. لأي استفسار، يرجى زيارة <Link to="/support" className="text-primary font-bold hover:underline">مركز الدعم</Link>.
                    </p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfUsePage;
