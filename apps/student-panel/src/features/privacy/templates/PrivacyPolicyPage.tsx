"use client";


import React from 'react';
import { Card, CardContent } from '@alrehla/ui/card';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import { ShieldCheck, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from '@/lib/router-compat';

const PrivacyPolicyPage: React.FC = () => {
  const { data, isLoading } = usePublicData();
  const privacy = data?.siteContent?.privacyPage;

  if (isLoading) return <PageLoader text="جاري تحميل السياسة..." />;

  const lastUpdated = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  // Function to render text with paragraphs
  const renderContent = (content: string) => {
    // Handle both \n and \r\n, and multiple newlines
    return content.split(/\r?\n/).map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-4" />; // Spacer for empty lines
        
        // Check for headers (simple heuristic: starts with number or *)
        const isHeader = /^\d+\./.test(trimmed) || trimmed.startsWith('**');
        const cleanText = trimmed.replace(/\*\*/g, '');
        
        if (isHeader) {
            return (
                 <h3 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3 border-b pb-2 border-green-100 w-fit">
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
                <div className="p-3 bg-green-100 text-green-700 rounded-xl">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                    {privacy?.title || "سياسة الخصوصية"}
                </h1>
            </div>
            <p className="text-gray-500 flex items-center gap-2 text-sm mt-2">
                <Calendar size={14} /> آخر تحديث: {lastUpdated}
            </p>
        </div>

        <Card className="shadow-lg border-t-4 border-t-green-500 bg-white">
            <CardContent className="p-8 sm:p-12 text-justify">
                {privacy?.content ? (
                    <div className="prose prose-lg max-w-none text-right">
                         {renderContent(privacy.content)}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <p>جاري تحميل نص السياسة...</p>
                    </div>
                )}
                
                <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500">
                        إذا كان لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا عبر <Link to="/support" className="text-primary font-bold hover:underline">مركز الدعم</Link>.
                    </p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
