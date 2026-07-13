"use client";

import React from 'react';
import { useParams, useNavigate } from '@/lib/router-compat';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import PageLoader from '../../../components/ui/PageLoader';
import BookingCalendar from '../../../components/BookingCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { BookOpen, Mic, Star, Sparkles, PenSquare } from 'lucide-react';
import Image from '../../../components/ui/Image';
import type { PublishedWork } from '../../../lib/database.types';

const YouTubeEmbed: React.FC<{ url: string }> = ({ url }) => {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (!videoId) return <p>رابط فيديو غير صالح.</p>;
    return (
        <div className="aspect-video">
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
            ></iframe>
        </div>
    );
};

const PublishedWorkCard: React.FC<{ work: PublishedWork }> = ({ work }) => (
    <div className="text-center flex-shrink-0 w-40">
        <Image src={work.cover_url} alt={work.title} className="w-full aspect-[2/3] rounded-lg shadow-lg mb-2" />
        <p className="text-sm font-semibold text-foreground">{work.title}</p>
    </div>
);


const InstructorProfilePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { data, isLoading, error } = usePublicData();

    if (isLoading) {
        return <PageLoader text="جاري تحميل ملف المدرب..." />;
    }

    const instructor = data?.instructors.find(i => i.slug === slug);

    if (error) {
        return <div className="text-center text-red-500 py-12">{(error as Error).message}</div>;
    }

    if (!instructor) {
        return <div className="text-center py-12">لم يتم العثور على المدرب.</div>;
    }
    
    const handleDateTimeSelect = (date: Date, time: string) => {
        navigate('/creative-writing/booking', {
            state: {
                instructor: instructor,
                selectedDateTime: { date, time }
            }
        });
    };

    return (
        <div className="bg-muted/50 py-16 sm:py-20 animate-fadeIn">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Hero */}
                        <Card>
                            <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-8">
                                <Image
                                    src={instructor.avatar_url || '/images/male-avatar.png'}
                                    alt={instructor.name}
                                    className="w-40 h-40 rounded-full flex-shrink-0 object-cover ring-4 ring-primary/10 shadow-lg"
                                />
                                <div className="text-center md:text-right">
                                    <h1 className="text-4xl font-extrabold text-foreground">{instructor.name}</h1>
                                    <p className="text-primary font-semibold mt-1 text-lg">{instructor.specialty}</p>
                                    <p className="text-muted-foreground mt-4 leading-relaxed">{instructor.bio}</p>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {instructor.intro_video_url && (
                             <Card>
                                <CardHeader><CardTitle className="flex items-center gap-3"><Mic/> فيديو تعريفي</CardTitle></CardHeader>
                                <CardContent>
                                    <YouTubeEmbed url={instructor.intro_video_url} />
                                </CardContent>
                            </Card>
                        )}
                        
                        {instructor.teaching_philosophy && (
                             <Card>
                                <CardHeader><CardTitle className="flex items-center gap-3"><Sparkles/> فلسفتي في التدريب</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground leading-relaxed italic">"{instructor.teaching_philosophy}"</p>
                                </CardContent>
                            </Card>
                        )}

                        {instructor.expertise_areas && instructor.expertise_areas.length > 0 && (
                             <Card>
                                <CardHeader><CardTitle className="flex items-center gap-3"><Star/> مجالات الخبرة</CardTitle></CardHeader>
                                <CardContent className="flex flex-wrap gap-3">
                                    {instructor.expertise_areas.map(area => (
                                        <span key={area} className="bg-muted text-muted-foreground text-sm font-semibold px-4 py-2 rounded-full">{area}</span>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {instructor.published_works && instructor.published_works.length > 0 && (
                             <Card>
                                <CardHeader><CardTitle className="flex items-center gap-3"><BookOpen/> من أعمالي المنشورة</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4">
                                        {instructor.published_works.map(work => (
                                            <PublishedWorkCard key={work.title} work={work} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Booking Column */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3"><PenSquare/> احجز جلستك الأولى</CardTitle>
                            </CardHeader>
                            <CardContent>
                                 <BookingCalendar instructor={instructor} onDateTimeSelect={handleDateTimeSelect} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorProfilePage;