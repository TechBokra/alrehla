"use client";


import React, { useMemo } from 'react';
import { Link } from '@/lib/router-compat';
import { useUserAccountData, type EnrichedBooking, type SessionAttachment } from '../../hooks/queries/user/useUserDataQuery';
import { useAuth } from '../../contexts/AuthContext';
import PageLoader from '@alrehla/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@alrehla/ui/card';
import { FileText, Download, GalleryVertical, Users, Star } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { Button } from '@alrehla/ui/button';

type PortfolioItem = SessionAttachment & {
    journeyName: string;
    childName: string;
    uploader: string;
};

const PortfolioPanel: React.FC = () => {
    const { data, isLoading, error } = useUserAccountData();
    const { currentUser } = useAuth();

    const itemsByChild = useMemo((): Record<string, PortfolioItem[]> => {
        if (!data?.attachments || !data.userBookings) {
            return {};
        }
        
        const validAttachments: SessionAttachment[] = Array.isArray(data.attachments) ? data.attachments : [];
        const validJourneys: EnrichedBooking[] = Array.isArray(data.userBookings) ? data.userBookings : [];

        // Create a map for quick journey lookups to improve performance
        const journeyMap = new Map<string, EnrichedBooking>(validJourneys.map(j => [j.id, j]));

        const portfolioItems: PortfolioItem[] = validAttachments
            // Filter: Only include files uploaded by the STUDENT
            .filter(att => att.uploader_role === 'student')
            .map((att): PortfolioItem | null => {
                const journey = journeyMap.get(att.booking_id);

                if (!journey || !journey.child_profiles) {
                    return null;
                }
                
                return {
                    ...att,
                    journeyName: journey.packageDetails?.name || 'رحلة تدريبية',
                    childName: journey.child_profiles.name,
                    uploader: journey.child_profiles.name, // It's always the child now
                };
            })
            .filter((item): item is PortfolioItem => item !== null);

        // Group the valid items by child name
        const groupedByChild = portfolioItems.reduce<Record<string, PortfolioItem[]>>((acc, item) => {
            const childName = item.childName;
            if (!acc[childName]) {
                acc[childName] = [];
            }
            acc[childName].push(item);
            return acc;
        }, {});
        
        // Sort items within each child's group
        for (const childName in groupedByChild) {
            groupedByChild[childName].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        return groupedByChild;
    }, [data, currentUser]);


    if (isLoading) {
        return <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg"><PageLoader text="جاري تحميل معرض الأعمال..." /></div>;
    }

    if (error || !data) {
        const errorMessage = (error as Error)?.message || 'حدث خطأ في تحميل بياناتك.';
        return <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg text-center text-red-500 py-20">{errorMessage}</div>;
    }

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <GalleryVertical className="text-primary" /> معرض إبداعات العائلة
            </h2>
            <p className="text-muted-foreground mb-8 text-sm">
                هنا تجد الأعمال الإبداعية (قصص، مسودات، ملفات) التي قام أطفالك بإنشائها ورفعها خلال رحلاتهم التدريبية.
            </p>

            {Object.keys(itemsByChild).length > 0 ? (
                <div className="space-y-10">
                    {Object.entries(itemsByChild).map(([childName, portfolioItemsForChild]) => (
                        <div key={childName} className="animate-fadeIn">
                            <h3 className="text-lg font-bold text-gray-700 mb-4 bg-gray-50 p-2 rounded-lg inline-flex items-center gap-2 border">
                                <Users size={18} className="text-blue-500" /> إبداعات {childName}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.isArray(portfolioItemsForChild) && portfolioItemsForChild.map((item) => (
                                    <Card key={item.id} className="flex flex-col transform hover:-translate-y-1 transition-transform duration-300 group">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                                     <FileText size={20} />
                                                </div>
                                                <CardTitle className="truncate text-base leading-tight" title={item.file_name}>{item.file_name}</CardTitle>
                                            </div>
                                            <CardDescription className="text-xs mt-1">
                                                ضمن: {item.journeyName}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                                <Star size={12} className="text-yellow-500" />
                                                <span>تم الرفع: {formatDate(item.created_at)}</span>
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <a 
                                                href={item.file_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-primary hover:text-primary-foreground h-9 px-4 py-2 w-full shadow-sm"
                                            >
                                                <Download size={16} className="ml-2" />
                                                عرض العمل
                                            </a>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <GalleryVertical className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">المعرض فارغ حالياً</h3>
                    <p className="mt-2 text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
                        لم يقم أطفالك برفع أي ملفات إبداعية بعد.
                        <br/>
                        شجعهم على استخدام "مساحة العمل" في حساب الطالب لرفع قصصهم ومسوداتهم!
                    </p>
                </div>
            )}
        </div>
    );
};

export default PortfolioPanel;
