
import type { 
    UserProfile, ChildProfile, Notification, Order, Subscription, CreativeWritingBooking, 
    PersonalizedProduct, CreativeWritingPackage, Instructor, SiteBranding, Prices, ShippingCosts, 
    SocialLinks, BlogPost, SupportTicket, JoinRequest, AdditionalService, SiteContent, ScheduledSession, SessionMessage, SessionAttachment, SupportSessionRequest,
    SubscriptionPlan,
    StandaloneService,
    ServiceOrder,
    InstructorPayout,
    PricingSettings,
    Badge,
    ChildBadge,
    CommunicationSettings,
    JitsiSettings,
    UserRole,
    ComparisonItem,
    MaintenanceSettings,
    LibraryPricingSettings,
    PublisherProfile
} from '@alrehla/types';
import { permissionsByRole } from '@alrehla/auth';

// Supported Countries Configuration
export const supportedCountries = [
    { code: 'EG', name: 'مصر', currency: 'EGP', timezone: 'Africa/Cairo', label: 'ج.م' },
    { code: 'SA', name: 'المملكة العربية السعودية', currency: 'SAR', timezone: 'Asia/Riyadh', label: 'ر.س' },
    { code: 'AE', name: 'الإمارات العربية المتحدة', currency: 'AED', timezone: 'Asia/Dubai', label: 'د.إ' },
    { code: 'KW', name: 'الكويت', currency: 'KWD', timezone: 'Asia/Kuwait', label: 'د.ك' },
    { code: 'QA', name: 'قطر', currency: 'QAR', timezone: 'Asia/Qatar', label: 'ر.ق' },
    { code: 'OM', name: 'سلطنة عمان', currency: 'OMR', timezone: 'Asia/Muscat', label: 'ر.ع' },
    { code: 'BH', name: 'البحرين', currency: 'BHD', timezone: 'Asia/Bahrain', label: 'د.ب' },
    { code: 'JO', name: 'الأردن', currency: 'JOD', timezone: 'Asia/Amman', label: 'د.أ' },
    { code: 'other', name: 'دولة أخرى', currency: 'USD', timezone: 'UTC', label: '$' }
];

export const exchangeRates: Record<string, number> = {
    'EGP': 1,
    'SAR': 0.08,
    'AED': 0.075,
    'KWD': 0.006,
    'QAR': 0.075,
    'OMR': 0.008,
    'BHD': 0.008,
    'JOD': 0.015,
    'USD': 0.02
};

export const mockComparisonItems: ComparisonItem[] = [
    { id: 'level_compare', label: 'المستوى التعليمي', type: 'text', sort_order: 1 },
    { id: 'target_age_compare', label: 'الفئة العمرية', type: 'text', sort_order: 2 },
    { id: 'digital_portfolio', label: 'محفظة رقمية للأعمال', type: 'boolean', sort_order: 3 },
    { id: 'certificate', label: 'شهادة إتمام', type: 'boolean', sort_order: 4 },
    { id: 'publication', label: 'نشر عمل في المجلة', type: 'boolean', sort_order: 5 },
    { id: 'mentoring', label: 'جلسات إرشاد إضافية', type: 'boolean', sort_order: 6 },
];

export const mockUsers: UserProfile[] = [];
export const mockChildProfiles: ChildProfile[] = [];
export const mockBadges: Badge[] = [];
export const mockChildBadges: ChildBadge[] = [];
export const mockNotifications: Notification[] = [];
export const mockOrders: Order[] = [];
export const mockSubscriptions: Subscription[] = [];
export const mockSubscriptionPlans: SubscriptionPlan[] = [];
export const mockBookings: CreativeWritingBooking[] = [];
export const mockPersonalizedProducts: PersonalizedProduct[] = [];
export const mockInstructors: Instructor[] = [];
export const mockCreativeWritingPackages: CreativeWritingPackage[] = [];
export const mockStandaloneServices: StandaloneService[] = [];
export const mockScheduledSessions: ScheduledSession[] = [];
export const mockSessionMessages: SessionMessage[] = [];
export const mockSessionAttachments: SessionAttachment[] = [];
export const mockSupportSessionRequests: SupportSessionRequest[] = [];

export const mockPublishers: PublisherProfile[] = [
    {
        id: 1,
        user_id: 'mock-pub-1',
        store_name: 'دار الشروق',
        slug: 'dar-el-shourouk',
        logo_url: '',
        // logo_url: 'https://upload.wikimedia.org/wikipedia/ar/7/7a/Dar_El_Shorouk_Logo.png',
        description: 'من أعرق دور النشر في العالم العربي، تقدم محتوى متميز للأطفال واليافعين.',
        website: 'https://www.shorouk.com'
    },
    {
        id: 2,
        user_id: 'mock-pub-2',
        store_name: 'نهضة مصر',
        slug: 'nahdet-misr',
        logo_url: 'https://yt3.googleusercontent.com/ytc/AIdro_nGEy_QJO_sXFk_d4lTjWv5vC9Q_gC9_qC9_qC9=s900-c-k-c0x00ffffff-no-rj',
        description: 'رواد في مجال النشر التعليمي والثقافي لأكثر من 80 عاماً.',
        website: 'https://www.nahdetmisr.com'
    },
    {
        id: 3,
        user_id: 'mock-pub-3',
        store_name: 'دار نشر الرحلة',
        slug: 'alrehla-publisher',
        logo_url: 'https://i.ibb.co/C0bSJJT/favicon.png', 
        description: 'الدار الرسمية لمنصة الرحلة، نقدم قصصاً مخصصة ومنتجات تربوية فريدة.',
        website: 'https://alrehla.com'
    }
];

export const mockSiteBranding: SiteBranding = {
    logoUrl: "https://placehold.co/500x150?text=Logo",
    heroImageUrl: "https://placehold.co/1920x800?text=Hero+Image",
    aboutHeroImageUrl: "https://placehold.co/1920x600?text=About+Hero",
    aboutPortalImageUrl: "https://placehold.co/600x600?text=About+Card",
    joinUsImageUrl: "https://placehold.co/1920x600?text=Join+Us",
    creativeWritingPortalImageUrl: "https://placehold.co/600x400?text=Creative+Writing",
    enhaLakPortalImageUrl: "https://placehold.co/600x400?text=Enha+Lak"
};

export const mockBlogPosts: BlogPost[] = [];

// --- Rich Content for Policies (This will seed the DB) ---
// Note: We use \n for line breaks which the frontend renderer will respect
const privacyContent = `تاريخ السريان: 1 يناير 2024

تولي "منصة الرحلة" ("نحن"، "المنصة") أهمية قصوى لخصوصية زوارها ومشتركيها، وبشكل خاص الأطفال. تهدف هذه السياسة إلى توضيح نوع البيانات التي نجمعها، وكيفية استخدامها، وحقوقك فيما يتعلق بها.

1. المعلومات التي نجمعها
نقوم بجمع المعلومات لغرضين أساسيين: تقديم خدمات مخصصة عالية الجودة، وضمان تجربة تعليمية آمنة.
* **بيانات ولي الأمر:** الاسم، البريد الإلكتروني، رقم الهاتف، وعنوان الشحن.
* **بيانات الطفل (لأغراض التخصيص):** الاسم الأول، العمر، الجنس، الاهتمامات.
* **الصور الشخصية:** في حال طلب منتج "قصة مخصصة"، قد نطلب صورة للطفل لرسم الشخصية الرئيسية لتشبهه. يتم استخدام هذه الصور حصراً لهذا الغرض الفني.
* **محتوى الجلسات:** قد يتم تسجيل جلسات الفيديو التعليمية (في برنامج "بداية الرحلة") لأغراض ضمان الجودة، تدريب المدربين، وسلامة الأطفال.

2. كيف نستخدم معلوماتك
* **تخصيص المنتجات:** تأليف ورسم قصص يكون طفلك بطلها بناءً على البيانات المقدمة.
* **تنفيذ الطلبات:** شحن المنتجات المطبوعة والتواصل معك بخصوص حالة الطلب.
* **تحسين الخدمة:** تحليل كيفية استخدام المنصة لتطوير المحتوى والبرامج التعليمية.
* **الأمان:** مراقبة الجلسات لضمان بيئة آمنة وخالية من التنمر أو المحتوى غير اللائق.

3. مشاركة المعلومات
نحن لا نبيع ولا نؤجر بياناتك لأي طرف ثالث. قد نشارك بيانات محدودة مع:
* **شركات الشحن:** لتوصيل الطلبات.
* **المدربين:** يتم مشاركة اسم الطفل وعمره واهتماماته مع المدرب المعين فقط لغرض التعليم.

4. أمن البيانات
نستخدم تقنيات تشفير متقدمة (SSL) لحماية بياناتك أثناء النقل والتخزين. يتم تخزين الصور والملفات الشخصية في خوادم مؤمنة ولا يتم الوصول إليها إلا من قبل الموظفين المصرح لهم.

5. حقوقك
لك الحق في طلب الاطلاع على بياناتك، تصحيحها، أو حذفها في أي وقت. يمكنك القيام بذلك عبر إعدادات الحساب أو التواصل مع الدعم الفني.`;

const termsContent = `مرحباً بك في منصة الرحلة. باستخدامك لهذا الموقع، فإنك توافق على الالتزام بالشروط والأحكام التالية. يرجى قراءتها بعناية.

1. شروط الاشتراك والعضوية
* يجب أن يتم إنشاء الحسابات وإدارتها من قبل ولي الأمر أو الوصي القانوني لمن هم دون سن 18 عاماً.
* أنت مسؤول عن الحفاظ على سرية بيانات الدخول الخاصة بحسابك.

2. المنتجات المخصصة (إنها لك)
* نظراً لطبيعة المنتجات المخصصة (التي يتم طباعتها خصيصاً لطفلك)، لا يمكن إلغاء الطلب أو استرداد المبلغ بعد مرور 24 ساعة من تأكيد الطلب.
* في حال وجود خطأ مطبعي أو عيب في المنتج ناتج عن المنصة، نلتزم بإعادة طباعة المنتج وإرساله مجاناً.

3. برامج الكتابة الإبداعية (بداية الرحلة)
* **الالتزام بالمواعيد:** يجب حضور الجلسات في موعدها المحدد. في حال الرغبة في التأجيل، يجب إبلاغنا قبل 24 ساعة على الأقل.
* **سلوك الطالب:** نتوقع من جميع الطلاب الالتزام بآداب السلوك والاحترام خلال الجلسات الجماعية أو الفردية. يحق للمنصة إنهاء اشتراك أي طالب يخالف قواعد السلوك دون استرداد الرسوم.

4. حقوق الملكية الفكرية
* جميع المحتويات الموجودة على المنصة (نصوص، رسومات، شعارات، مناهج) هي ملكية حصرية لمنصة الرحلة ومحمية بموجب قوانين حقوق النشر.
* يمنع نسخ أو إعادة نشر أو توزيع أي جزء من المحتوى دون إذن كتابي مسبق.
* بالنسبة لكتابات الطلاب: يحتفظ الطالب بملكية حقوق التأليف لقصصه، وتمنح المنصة رخصة غير حصرية لعرضها في "معرض الأعمال" أو المواد التسويقية بموافقة ولي الأمر.

5. التعديلات
نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل الموقع.`;

export const mockSiteContent: SiteContent = {
    portalPage: {
        heroTitle: 'رحلة كل طفل تبدأ بقصة... وقصته تبدأ هنا',
        heroSubtitle: 'منصة تربوية عربية متكاملة تصنع قصصاً مخصصة تجعل طفلك بطلاً، وتطلق مواهبه في الكتابة الإبداعية',
        heroButtonText1: 'اطلب قصتك المخصصة الآن',
        heroButtonText2: 'اكتشف برنامج الكتابة الإبداعية',
        projectsTitle: 'أقسامنا الرئيسية',
        projectsSubtitle: 'بوابتان لعالم من الإبداع والنمو',
        enhaLakTitle: 'إنها لك',
        enhaLakDescription: 'قصص مخصصة ومنتجات تربوية فريدة تجعل طفلك بطلاً.',
        enhaLakBtnText: 'اكتشف القصص',
        creativeWritingTitle: 'بداية الرحلة',
        creativeWritingDescription: 'برنامج متكامل لتنمية مهارات الكتابة الإبداعية.',
        creativeWritingBtnText: 'ابدأ الرحلة',
        aboutSectionTitle: 'قصتنا: من فكرة إلى رحلة',
        aboutSectionContent: 'نحن منصة تسعى لتمكين الأطفال من خلال القصص والكتابة...',
        aboutBtnText: 'تعرف علينا أكثر',
        testimonialsTitle: 'ماذا تقول عائلاتنا؟',
        testimonialsSubtitle: 'آراء نفخر بها',
        blogTitle: 'من مدونتنا',
        blogSubtitle: 'مقالات ونصائح تربوية',
        finalCtaTitle: 'هل أنت جاهز لبدء الرحلة؟',
        finalCtaSubtitle: 'اختر المسار الذي يناسب طفلك اليوم',
        finalCtaBtn1: 'تصفح منتجات "إنها لك"',
        finalCtaBtn2: 'احجز جلسة "بداية الرحلة"',
        showProjectsSection: true,
        showStepsSection: true,
        showAboutSection: true,
        showTestimonialsSection: true,
        showBlogSection: true,
        showFinalCtaSection: true,
        steps: [
            { title: '1. اكتشف', description: 'تصفح قصصنا المخصصة وبرامجنا الإبداعية المصممة بعناية لتناسب كل طفل.' },
            { title: '2. خصص', description: 'أضف لمستك الخاصة. املأ تفاصيل طفلك واختر الأهداف والقيم التي ترغب في غرسها.' },
            { title: '3. استمتع', description: 'استلم منتجاً فريداً ومبهراً ينمي شغف طفلك ويطلق العنان لخياله الواسع.' }
        ]
    },
    aboutPage: {
        heroTitle: 'رحلتنا: من فكرة إلى رؤية',
        heroSubtitle: 'نتطلع لمستقبل مشرق لأطفالنا',
        missionStatement: 'نؤمن أن كل طفل هو بطل حكايته الخاصة.',
        ourStory: 'في عالم يتسارع نحو الرقمنة...',
        ourVision: 'أن نكون المنصة الرائدة والوجهة الأولى لكل أسرة عربية.',
        valuesTitle: 'قيمنا الأساسية',
        teamMembers: [],
        teamTitle: 'تعرف على بعض أفراد الفريق',
        showTeamSection: true
    },
    enhaLakPage: {
        main: {
            heroTitle: 'قصة فريدة... بطلها طفلك',
            heroSubtitle: 'منتجات تربوية مخصصة تعزز الهوية وتنمي القيم.',
            heroBtnText: 'تصفح المنتجات واطلب الآن',
            productsTitle: 'منتجاتنا المميزة',
            howItWorksTitle: 'كيف تعمل؟',
            testimonialsTitle: 'آراء العملاء',
            testimonialsSubtitle: 'ماذا قالوا عنا',
            finalCtaTitle: 'جاهز للطلب؟',
            finalCtaSubtitle: 'ابدأ الآن بتخصيص قصة لطفلك.',
        },
        store: {
            heroTitle: 'متجر القصص',
            heroSubtitle: 'اختر القصة التي تناسب طفلك.',
            subscriptionBannerTitle: 'اشترك في صندوق الرحلة',
            addonProductsTitle: 'إضافات'
        },
        subscription: {
            heroTitle: 'صندوق الرحلة الشهري',
            heroSubtitle: 'هدية متجددة كل شهر.',
            features: ['قصة جديدة', 'أنشطة', 'هدية']
        }
    },
    creativeWritingPage: {
        main: {
            heroTitle: 'بداية الرحلة: أطلق العنان لخيال طفلك',
            heroSubtitle: 'برنامج تدريبي لتنمية مهارات الكتابة.',
            methodologyTitle: 'منهجيتنا',
            methodologySubtitle: 'كيف نعلم الكتابة',
            transformationTitle: 'رحلة التحول',
            packagesTitle: 'باقات الاشتراك',
            packagesSubtitle: 'اختر الباقة المناسبة',
            servicesTitle: 'خدمات إضافية',
            servicesSubtitle: 'دعم إضافي للكاتب الصغير',
            instructorsTitle: 'مدربونا',
            instructorsSubtitle: 'نخبة من الخبراء',
            testimonialsTitle: 'قصص نجاح',
            testimonialsSubtitle: 'طلابنا المبدعون',
            finalCtaTitle: 'احجز الآن',
            finalCtaSubtitle: 'ابدأ الرحلة اليوم'
        },
        about: {
            heroTitle: 'عن البرنامج',
            heroSubtitle: 'فلسفتنا في التعليم',
            mainTitle: 'لماذا بداية الرحلة؟',
            mainContent: 'لأننا نؤمن...',
            philosophyTitle: 'فلسفتنا',
            heroImageUrl: 'https://placehold.co/800x800?text=CW+Philosophy'
        },
        curriculum: {
            heroTitle: 'المنهج الدراسي',
            heroSubtitle: 'ماذا سيتعلم طفلك',
            treasuresTitle: 'كنوز الرحلة',
            treasuresSubtitle: 'ما يحصل عليه الطالب'
        },
        instructors: {
            heroTitle: 'فريق التدريب',
            heroSubtitle: 'تعرف على المدربين'
        }
    },
    supportPage: {
        heroTitle: 'كيف يمكننا مساعدتك؟',
        heroSubtitle: 'نحن هنا للإجابة على استفساراتك',
        faqs: [
             { question: 'كيف يمكنني تتبع طلبي؟', answer: 'يمكنك تتبع طلبك من خلال لوحة التحكم الخاصة بك في قسم "مكتبتي".', category: 'إنها لك' },
             { question: 'كم يستغرق شحن القصة المخصصة؟', answer: 'تستغرق عملية الطباعة والتجهيز من 3 إلى 5 أيام عمل، ثم يتم الشحن خلال 2-3 أيام حسب المحافظة.', category: 'إنها لك' },
             { question: 'هل يمكنني تعديل القصة بعد الطلب؟', answer: 'نظراً لأن القصة تطبع خصيصاً لطفلك، لا يمكن التعديل بعد مرور 24 ساعة من الطلب. يرجى مراجعة البيانات بدقة قبل التأكيد.', category: 'إنها لك' },
             
             { question: 'ما هي طرق الدفع المتاحة؟', answer: 'نقبل الدفع عبر Instapay، المحافظ الإلكترونية (فودافون كاش وغيرها)، والبطاقات البنكية.', category: 'عامة' },
             { question: 'هل يمكنني استرداد المبلغ؟', answer: 'بالنسبة للمنتجات الرقمية والخدمات التي تم تقديمها، لا يمكن استرداد المبلغ. المنتجات المطبوعة التي بها عيب مصنعي يتم استبدالها مجاناً.', category: 'عامة' },
             
             { question: 'هل يمكنني تغيير موعد الجلسة؟', answer: 'نعم، يمكنك طلب تغيير الموعد قبل 24 ساعة من خلال التواصل مع المدرب أو الإدارة عبر لوحة التحكم.', category: 'بداية الرحلة' },
             { question: 'كيف تتم الجلسات الأونلاين؟', answer: 'تتم الجلسات عبر منصة فيديو مدمجة في موقعنا. لا تحتاج لتحميل أي برامج، فقط اضغط على "انضم للجلسة" في موعدها.', category: 'بداية الرحلة' },
             
             { question: 'كيف يمكنني الانضمام كمدرب؟', answer: 'يمكنك تقديم طلب انضمام عبر صفحة "انضم إلينا" وسنقوم بمراجعة طلبك.', category: 'الشركاء' },
             { question: 'أنا دار نشر، كيف أعرض كتبي لديكم؟', answer: 'نرحب بالشراكات مع دور النشر المتميزة. يرجى التواصل معنا عبر نموذج "الشراكات" لإنشاء حساب ناشر خاص بكم.', category: 'الشركاء' }
        ]
    },
    privacyPage: { title: 'سياسة الخصوصية', content: privacyContent },
    termsPage: { title: 'شروط الاستخدام', content: termsContent },
    footer: {
        copyrightText: "منصة الرحلة. جميع الحقوق محفوظة.",
        description: "نؤمن أن كل طفل هو بطل حكايته الخاصة."
    }
};

export const mockSocialLinks: SocialLinks = {
    id: 1,
    facebook_url: 'https://facebook.com',
    twitter_url: 'https://twitter.com',
    instagram_url: 'https://instagram.com'
};

export const mockPricingSettings: PricingSettings = {
    id: 1,
    company_percentage: 1.2, 
    fixed_fee: 50 
};

export const mockLibraryPricingSettings: LibraryPricingSettings = {
    id: 1,
    company_percentage: 1.3, 
    fixed_fee: 30 
};

export const mockMaintenanceSettings: MaintenanceSettings = {
    isActive: false,
    message: "الموقع قيد التطوير حالياً، قد تواجه بعض الأخطاء أثناء التصفح."
};

export const mockRolePermissions: any = permissionsByRole; 

export const mockCommunicationSettings: CommunicationSettings = {
    support_email: 'support@alrehlah.com',
    join_us_email: 'careers@alrehlah.com',
    whatsapp_number: '+201000000000',
    whatsapp_default_message: 'مرحباً، لدي استفسار بخصوص...',
    instapay_url: 'https://ipn.eg/S/123',
    instapay_qr_url: 'https://placehold.co/400x400?text=QR+Code',
    instapay_number: '01000000000'
};

export const mockJitsiSettings: JitsiSettings = {
    id: 1,
    domain: 'meet.jit.si',
    room_prefix: 'AlRehlah-Session-',
    join_minutes_before: 10,
    expire_minutes_after: 120,
    start_with_audio_muted: true,
    start_with_video_muted: false
};

export const mockPrices: Prices = {
    'custom_story_base': 450,
    'subscription_monthly': 250
};

export const mockShippingCosts: ShippingCosts = {
    'مصر': {
        'القاهرة': 50,
        'الجيزة': 50,
        'الإسكندرية': 60,
        'أسوان': 100,
        'باقي المحافظات': 75
    }
};
