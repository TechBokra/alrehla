
import React from 'react';
import { 
    Home as HomeIcon, 
    Info as InfoIcon, 
    ShoppingBag as ShoppingBagIcon, 
    BookOpen, 
    Settings as SettingsIcon, 
    Globe as GlobeIcon, 
    Phone as PhoneIcon,
    FileText,
    HelpCircle,
    Shield
} from 'lucide-react';

export type FieldType = 'input' | 'textarea' | 'image' | 'array' | 'object_array';

export interface FieldConfig {
    key: string;
    label: string;
    type: FieldType;
    rows?: number;
    placeholder?: string;
    itemLabel?: string; 
    objectSchema?: FieldConfig[]; 
}

export interface SectionConfig {
    key: string;
    title: string;
    description?: string;
    visibilityKey?: string;
    fields: FieldConfig[];
}

export interface PageConfig {
    key: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    sections: SectionConfig[];
}

export const pageConfigs: PageConfig[] = [
    {
        key: 'global',
        title: 'إعدادات عامة & تذييل الصفحة',
        description: 'الروابط الاجتماعية، معلومات الفوتر، وإعدادات السيو العامة.',
        icon: <SettingsIcon />,
        sections: [
            {
                key: 'branding',
                title: 'العلامة التجارية (صور الموقع)',
                fields: [
                    { key: 'siteBranding.logoUrl', label: 'شعار الموقع (Logo)', type: 'image' },
                    { key: 'siteBranding.heroImageUrl', label: 'صورة الهيرو الرئيسية', type: 'image' },
                ]
            },
            {
                key: 'footer',
                title: 'تذييل الصفحة (Footer)',
                fields: [
                    { key: 'footer.copyrightText', label: 'نص حقوق الملكية', type: 'input', placeholder: 'منصة الرحلة. جميع الحقوق محفوظة.' },
                    { key: 'footer.description', label: 'وصف مختصر (يظهر تحت الشعار)', type: 'textarea', rows: 2 },
                ]
            }
        ]
    },
    {
        key: 'legal',
        title: 'الصفحات القانونية',
        description: 'تحرير محتوى سياسة الخصوصية وشروط الاستخدام.',
        icon: <Shield />,
        sections: [
            {
                key: 'privacy',
                title: 'سياسة الخصوصية',
                fields: [
                    { key: 'privacyPage.title', label: 'عنوان الصفحة', type: 'input' },
                    { key: 'privacyPage.content', label: 'محتوى السياسة', type: 'textarea', rows: 15 },
                ]
            },
            {
                key: 'terms',
                title: 'شروط الاستخدام',
                fields: [
                    { key: 'termsPage.title', label: 'عنوان الصفحة', type: 'input' },
                    { key: 'termsPage.content', label: 'محتوى الشروط', type: 'textarea', rows: 15 },
                ]
            }
        ]
    },
    {
        key: 'portalPage',
        title: 'الصفحة الرئيسية (البوابة)',
        description: 'الواجهة الأولى للزوار، تحتوي على الهيرو والأقسام الرئيسية.',
        icon: <HomeIcon />,
        sections: [
            {
                key: 'hero',
                title: 'القسم الافتتاحي (Hero)',
                fields: [
                    { key: 'portalPage.heroTitle', label: 'العنوان الرئيسي', type: 'input' },
                    { key: 'portalPage.heroSubtitle', label: 'النص التعريفي', type: 'textarea', rows: 3 },
                    { key: 'portalPage.heroButtonText1', label: 'نص زر "إنها لك"', type: 'input' },
                    { key: 'portalPage.heroButtonText2', label: 'نص زر "بداية الرحلة"', type: 'input' },
                    { key: 'siteBranding.heroImageUrl', label: 'صورة الخلفية', type: 'image' }
                ]
            },
            {
                key: 'projects',
                title: 'قسم المشاريع (إنها لك & بداية الرحلة)',
                visibilityKey: 'portalPage.showProjectsSection',
                description: 'ملاحظة: صور بطاقات المشاريع تسحب تلقائياً من صور المنتجات المخصصة.',
                fields: [
                    { key: 'portalPage.projectsTitle', label: 'عنوان القسم', type: 'input' },
                    { key: 'portalPage.projectsSubtitle', label: 'وصف القسم', type: 'textarea', rows: 2 },
                    // Enha Lak Card
                    { key: 'portalPage.enhaLakTitle', label: 'عنوان بطاقة "إنها لك"', type: 'input' },
                    { key: 'portalPage.enhaLakDescription', label: 'وصف بطاقة "إنها لك"', type: 'textarea', rows: 2 },
                    { key: 'portalPage.enhaLakBtnText', label: 'نص زر "إنها لك"', type: 'input' },
                    // Creative Writing Card
                    { key: 'portalPage.creativeWritingTitle', label: 'عنوان بطاقة "بداية الرحلة"', type: 'input' },
                    { key: 'portalPage.creativeWritingDescription', label: 'وصف بطاقة "بداية الرحلة"', type: 'textarea', rows: 2 },
                    { key: 'portalPage.creativeWritingBtnText', label: 'نص زر "بداية الرحلة"', type: 'input' },
                    { key: 'siteBranding.creativeWritingPortalImageUrl', label: 'صورة خلفية بطاقة "بداية الرحلة"', type: 'image' }
                ]
            },
            {
                key: 'steps',
                title: 'قسم "كيف نعمل؟" (3 خطوات)',
                visibilityKey: 'portalPage.showStepsSection',
                fields: [
                    { key: 'portalPage.stepsTitle', label: 'عنوان القسم', type: 'input' },
                    { 
                        key: 'portalPage.steps', 
                        label: 'الخطوات', 
                        type: 'object_array',
                        itemLabel: 'خطوة',
                        objectSchema: [
                            { key: 'title', label: 'عنوان الخطوة', type: 'input' },
                            { key: 'description', label: 'الوصف', type: 'textarea' }
                        ]
                    }
                ]
            },
            {
                key: 'about_preview',
                title: "قسم 'عنا' (المختصر)",
                visibilityKey: 'portalPage.showAboutSection',
                fields: [
                    { key: 'portalPage.aboutSectionTitle', label: 'عنوان القسم', type: 'input' },
                    { key: 'portalPage.aboutSectionContent', label: 'محتوى القسم', type: 'textarea', rows: 4 },
                    { key: 'portalPage.aboutBtnText', label: 'نص الزر', type: 'input' },
                    { key: 'siteBranding.aboutImageUrl', label: 'الصورة الجانبية', type: 'image' }
                ]
            },
            {
                key: 'testimonials',
                title: 'قسم الآراء',
                visibilityKey: 'portalPage.showTestimonialsSection',
                fields: [
                    { key: 'portalPage.testimonialsTitle', label: 'العنوان', type: 'input' },
                    { key: 'portalPage.testimonialsSubtitle', label: 'وصف القسم', type: 'textarea', rows: 2 }
                ]
            },
            {
                key: 'blog_preview',
                title: 'قسم أحدث المقالات',
                visibilityKey: 'portalPage.showBlogSection',
                fields: [
                    { key: 'portalPage.blogTitle', label: 'العنوان', type: 'input' },
                    { key: 'portalPage.blogSubtitle', label: 'وصف القسم', type: 'textarea', rows: 2 }
                ]
            },
             {
                key: 'finalCta',
                title: "الدعوة النهائية (CTA)",
                visibilityKey: 'portalPage.showFinalCtaSection',
                fields: [
                    { key: 'portalPage.finalCtaTitle', label: 'العنوان', type: 'input' },
                    { key: 'portalPage.finalCtaSubtitle', label: 'النص التعريفي', type: 'textarea', rows: 2 },
                    { key: 'portalPage.finalCtaBtn1', label: 'نص زر 1', type: 'input' },
                    { key: 'portalPage.finalCtaBtn2', label: 'نص زر 2', type: 'input' }
                ]
            }
        ]
    },
    {
        key: 'aboutPage',
        title: 'صفحة "رحلتنا"',
        description: 'صفحة من نحن، الرؤية، الرسالة، وفريق العمل.',
        icon: <InfoIcon />,
        sections: [
            {
                key: 'main_info',
                title: 'المعلومات الأساسية',
                fields: [
                    { key: 'aboutPage.heroTitle', label: 'عنوان الهيرو', type: 'input' },
                    { key: 'aboutPage.missionStatement', label: 'الرسالة', type: 'textarea', rows: 3 },
                    { key: 'aboutPage.ourStory', label: 'الشرارة', type: 'textarea', rows: 5 },
                    { key: 'aboutPage.ourVision', label: 'الرؤية', type: 'textarea', rows: 3 },
                    { key: 'aboutPage.valuesTitle', label: 'عنوان قسم القيم', type: 'input' },
                    { key: 'siteBranding.aboutHeroImageUrl', label: 'صورة خلفية الهيرو', type: 'image' }
                ]
            },
            {
                key: 'team',
                title: 'فريق العمل',
                visibilityKey: 'aboutPage.showTeamSection',
                fields: [
                    { key: 'aboutPage.teamTitle', label: 'عنوان القسم', type: 'input' },
                    { 
                        key: 'aboutPage.teamMembers', 
                        label: 'أعضاء الفريق', 
                        type: 'object_array',
                        itemLabel: 'عضو فريق',
                        objectSchema: [
                            { key: 'name', label: 'الاسم', type: 'input' },
                            { key: 'role', label: 'الدور الوظيفي', type: 'input' },
                            { key: 'imageUrl', label: 'الصورة الشخصية', type: 'image' }
                        ]
                    }
                ]
            }
        ]
    },
    {
        key: 'enhaLakPage',
        title: 'قسم "إنها لك"',
        description: 'صفحات مشروع القصص المخصصة وصندوق الرحلة.',
        icon: <ShoppingBagIcon />,
        sections: [
            {
                key: 'main_landing',
                title: 'الصفحة التعريفية للمشروع',
                description: 'ملاحظة: صور عرض المنتجات (صندوق الرحلة والقصة) تسحب تلقائياً من إدارة المنتجات.',
                fields: [
                    { key: 'enhaLakPage.main.heroTitle', label: 'العنوان الرئيسي', type: 'input' },
                    { key: 'enhaLakPage.main.heroSubtitle', label: 'النص التعريفي', type: 'textarea', rows: 2 },
                    { key: 'enhaLakPage.main.heroBtnText', label: 'نص الزر الرئيسي', type: 'input' },
                    { key: 'enhaLakPage.main.productsTitle', label: 'عنوان قسم المنتجات', type: 'input' },
                    { key: 'enhaLakPage.main.howItWorksTitle', label: 'عنوان "كيف تعمل؟"', type: 'input' },
                    { key: 'enhaLakPage.main.testimonialsTitle', label: 'عنوان الآراء', type: 'input' }
                ]
            },
            {
                key: 'store',
                title: 'صفحة متجر القصص',
                fields: [
                     { key: 'enhaLakPage.store.heroTitle', label: 'عنوان المتجر', type: 'input' },
                     { key: 'enhaLakPage.store.heroSubtitle', label: 'وصف المتجر', type: 'textarea', rows: 2 },
                     { key: 'enhaLakPage.store.subscriptionBannerTitle', label: 'عنوان بانر الاشتراك', type: 'input' }
                ]
            },
            {
                key: 'subscription_page',
                title: 'صفحة الاشتراك الشهري',
                fields: [
                     { key: 'enhaLakPage.subscription.heroTitle', label: 'العنوان الرئيسي', type: 'input' },
                     { key: 'enhaLakPage.subscription.heroSubtitle', label: 'النص التعريفي', type: 'textarea', rows: 2 },
                     { key: 'enhaLakPage.subscription.features', label: 'مميزات الاشتراك', type: 'array' }
                ]
            }
        ]
    },
    {
        key: 'creativeWritingPage',
        title: 'قسم "بداية الرحلة"',
        description: 'صفحات برنامج الكتابة الإبداعية.',
        icon: <BookOpen />,
        sections: [
             {
                key: 'cw_landing',
                title: 'الصفحة الرئيسية للبرنامج',
                fields: [
                    { key: 'creativeWritingPage.main.heroTitle', label: 'العنوان الرئيسي', type: 'input' },
                    { key: 'creativeWritingPage.main.heroSubtitle', label: 'النص التعريفي', type: 'textarea', rows: 2 },
                    { key: 'creativeWritingPage.main.methodologyTitle', label: 'عنوان المنهجية', type: 'input' },
                    { key: 'creativeWritingPage.main.methodologySubtitle', label: 'وصف المنهجية', type: 'textarea', rows: 2 },
                    { key: 'creativeWritingPage.main.transformationTitle', label: 'عنوان التحول', type: 'input' },
                    { key: 'creativeWritingPage.main.packagesTitle', label: 'عنوان الباقات', type: 'input' },
                    { key: 'creativeWritingPage.main.servicesTitle', label: 'عنوان الخدمات', type: 'input' },
                    { key: 'creativeWritingPage.main.instructorsTitle', label: 'عنوان المدربين', type: 'input' }
                ]
            },
            {
                key: 'cw_about',
                title: "صفحة 'فلسفة البرنامج'",
                fields: [
                    { key: 'creativeWritingPage.about.heroTitle', label: 'العنوان الرئيسي', type: 'input' },
                    { key: 'creativeWritingPage.about.heroSubtitle', label: 'النص التعريفي', type: 'textarea', rows: 2 },
                    { key: 'creativeWritingPage.about.mainTitle', label: 'العنوان الداخلي', type: 'input' },
                    { key: 'creativeWritingPage.about.mainContent', label: 'المحتوى التفصيلي', type: 'textarea', rows: 6 },
                    { key: 'creativeWritingPage.about.heroImageUrl', label: 'صورة عرض الفلسفة', type: 'image' }
                ]
            }
        ]
    },
    {
        key: 'supportPage',
        title: 'صفحة الدعم والمساعدة',
        description: 'الأسئلة الشائعة وعناوين الصفحة.',
        icon: <HelpCircle />,
        sections: [
            {
                key: 'hero',
                title: 'القسم الافتتاحي (Hero)',
                fields: [
                    { key: 'supportPage.heroTitle', label: 'العنوان الرئيسي', type: 'input' },
                    { key: 'supportPage.heroSubtitle', label: 'النص التعريفي', type: 'textarea', rows: 2 },
                ]
            },
            {
                key: 'faqs',
                title: 'الأسئلة الشائعة (FAQs)',
                description: 'لتوزيع الأسئلة على التبويبات، استخدم الكلمات المفتاحية في حقل "التصنيف": (إنها لك، شحن، منتجات) للتبويب الأول، و (بداية الرحلة، مدرب، جلسة) للتبويب الثاني. أي شيء آخر سيظهر في "عام".',
                fields: [
                    { 
                        key: 'supportPage.faqs', 
                        label: 'قائمة الأسئلة', 
                        type: 'object_array',
                        itemLabel: 'سؤال',
                        objectSchema: [
                            { key: 'question', label: 'السؤال', type: 'input' },
                            { key: 'answer', label: 'الإجابة', type: 'textarea', rows: 3 },
                            { key: 'category', label: 'التصنيف (إنها لك / بداية الرحلة / عام)', type: 'input', placeholder: 'مثال: بداية الرحلة' }
                        ]
                    }
                ]
            }
        ]
    }
];
