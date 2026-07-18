"use client";


import React from 'react';
import { useStudentDashboardData } from '../../../hooks/queries/user/useJourneyDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@alrehla/ui/card';
import { FileText, Download, GalleryVertical } from 'lucide-react';
import { formatDate } from '../../../utils/helpers';
import { Button } from '@alrehla/ui/button';

const StudentPortfolioPage: React.FC = () => {
    const { data, isLoading, error } = useStudentDashboardData();

    if (isLoading) {
        return <PageLoader text="جاري تحميل معرض أعمالك..." />;
    }

    if (error || !data) {
        const errorMessage = (error as Error)?.message || 'حدث خطأ في تحميل بياناتك.';
        return <div className="text-center text-red-500 py-20">{errorMessage}</div>;
    }

    const { attachments = [], journeys = [] } = data;

    const portfolioItems = attachments
        .filter((att: any) => att.uploader_role === 'student')
        .map((att: any) => {
            const journey = journeys.find((j: any) => j.id === att.booking_id);
            return {
                ...att,
                journeyName: journey?.package_name || 'رحلة تدريبية',
            };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="animate-fadeIn space-y-8">
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3"><GalleryVertical /> معرض أعمالي</h1>
            
            {portfolioItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolioItems.map((item: any) => (
                        <Card key={item.id} className="flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <FileText className="text-primary flex-shrink-0" />
                                    <CardTitle className="truncate text-lg">{item.file_name}</CardTitle>
                                </div>
                                <CardDescription>
                                    ضمن رحلة: {item.journeyName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">
                                    تاريخ الرفع: {formatDate(item.created_at)}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <a 
                                    href={item.file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
                                >
                                    <Download size={16} className="ml-2" />
                                    عرض / تحميل
                                </a>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="text-center py-20">
                         <GalleryVertical className="mx-auto h-16 w-16 text-muted-foreground/50" />
                        <h2 className="mt-4 text-xl font-semibold text-foreground">لم تقم برفع أي أعمال بعد</h2>
                        <p className="mt-2 text-muted-foreground">عندما ترفع مسوداتك وقصصك في مساحات العمل، ستظهر هنا.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default StudentPortfolioPage;
