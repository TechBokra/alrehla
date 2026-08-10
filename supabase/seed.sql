-- =============================================================================
-- ALREHLA UNIFIED DATABASE SEED DATA
-- Canonical seed script for database initialization and reset
-- =============================================================================

-- =========================================================
-- Alrehla reusable seed data
-- Run after 00_setup.sql.
-- Safe to re-run: uses ON CONFLICT / guarded DO blocks.
-- =========================================================

-- Public-safe settings. Do not seed private API secrets here.
INSERT INTO public.site_settings (key, value, updated_at) VALUES
('branding', '{"logoUrl":"https://placehold.co/500x150?text=Logo","heroImageUrl":"https://placehold.co/1920x800?text=Hero+Image"}'::jsonb, NOW()),
('prices', '{"currency":"EGP","tax_rate":0}'::jsonb, NOW()),
('shipping_costs', '{"default":50,"باقي المحافظات":50}'::jsonb, NOW()),
('social_links', '{"facebook_url":"","twitter_url":"","instagram_url":""}'::jsonb, NOW()),
('communication_settings', '{"support_email":"support@alrehla.com","join_us_email":"join@alrehla.com","whatsapp_number":"","whatsapp_default_message":"مرحباً، أحتاج مساعدة من منصة الرحلة","instapay_url":"","instapay_qr_url":"","instapay_number":""}'::jsonb, NOW()),
('pricing_config', '{"company_percentage":1.2,"fixed_fee":50}'::jsonb, NOW()),
('library_pricing_config', '{"company_percentage":30,"fixed_fee":0}'::jsonb, NOW()),
('jitsi_settings', '{"domain":"meet.jit.si","room_prefix":"alrehla","join_minutes_before":10,"expire_minutes_after":30,"start_with_audio_muted":true,"start_with_video_muted":true}'::jsonb, NOW()),
('maintenance_settings', '{"isActive":false,"message":""}'::jsonb, NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO public.comparison_items (id, label, type, sort_order) VALUES
('level_compare', 'المستوى التعليمي', 'text', 1),
('target_age_compare', 'الفئة العمرية', 'text', 2),
('digital_portfolio', 'محفظة رقمية للأعمال', 'boolean', 3),
('certificate', 'شهادة إتمام', 'boolean', 4),
('publication', 'نشر عمل في المجلة', 'boolean', 5),
('mentoring', 'جلسات إرشاد إضافية', 'boolean', 6)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order;

INSERT INTO public.badges (name, description, icon_name) VALUES
('المبدع الصغير', 'أتم الطالب رحلته الأولى في الكتابة الإبداعية', 'star'),
('البطل القصصي', 'ظهر الطالب كبطل في قصة مخصصة', 'book-open'),
('المحفز المستمر', 'أكمل 5 جلسات كتابة إبداعية', 'flame')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, icon_name = EXCLUDED.icon_name;

INSERT INTO public.creative_writing_packages (
  name, sessions, price, price_per_session, description, detailed_description, features,
  target_age, level, icon_name, popular, comparison_values, is_active
) VALUES
('الجلسة التعريفية', '1', 0, 0, 'جلسة تعريفية قصيرة لاكتشاف البرنامج والمدرب المناسب.', 'جلسة مجانية تساعد ولي الأمر والطفل على فهم البرنامج.', '["تعرف على المدرب", "تقييم أولي", "خطة مقترحة"]'::jsonb, '7-14', 'مبتدئ', 'sparkles', false, '{"level_compare":"تعريفي","target_age_compare":"7-14","digital_portfolio":false,"certificate":false,"publication":false,"mentoring":false}'::jsonb, true),
('رحلة الكاتب الصغير', '4', 1200, 300, 'باقة تأسيسية لتنمية الخيال وبناء القصة.', 'أربع جلسات تطبيقية مع تمارين وأعمال قصيرة.', '["4 جلسات مباشرة", "تدريبات عملية", "متابعة تقدم"]'::jsonb, '8-12', 'مبتدئ', 'pen-tool', true, '{"level_compare":"مبتدئ","target_age_compare":"8-12","digital_portfolio":true,"certificate":true,"publication":false,"mentoring":false}'::jsonb, true),
('رحلة الإتقان', '8', 2200, 275, 'باقة ممتدة للطلاب الراغبين في تطوير مشروع قصصي كامل.', 'ثماني جلسات لإنجاز قصة متكاملة مع مراجعة تفصيلية.', '["8 جلسات مباشرة", "مشروع قصة كامل", "شهادة إتمام", "محفظة رقمية"]'::jsonb, '10-16', 'متوسط', 'book-open', false, '{"level_compare":"متوسط","target_age_compare":"10-16","digital_portfolio":true,"certificate":true,"publication":true,"mentoring":true}'::jsonb, true)
ON CONFLICT (name) DO UPDATE SET
  sessions = EXCLUDED.sessions,
  price = EXCLUDED.price,
  price_per_session = EXCLUDED.price_per_session,
  description = EXCLUDED.description,
  detailed_description = EXCLUDED.detailed_description,
  features = EXCLUDED.features,
  target_age = EXCLUDED.target_age,
  level = EXCLUDED.level,
  icon_name = EXCLUDED.icon_name,
  popular = EXCLUDED.popular,
  comparison_values = EXCLUDED.comparison_values,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO public.standalone_services (name, price, description, category, icon_name, requires_file_upload, provider_type, is_active) VALUES
('مراجعة قصة قصيرة', 250, 'مراجعة لغوية وإبداعية لقصة قصيرة كتبها الطفل.', 'editing', 'file-pen', true, 'instructor', true),
('جلسة عصف ذهني', 300, 'جلسة فردية لتوليد أفكار قصصية وبناء الشخصيات.', 'coaching', 'lightbulb', false, 'instructor', true),
('تقرير تطور كتابي', 200, 'تقرير مختصر عن نقاط القوة وفرص التطوير.', 'report', 'clipboard-list', true, 'company', true)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon_name = EXCLUDED.icon_name,
  requires_file_upload = EXCLUDED.requires_file_upload,
  provider_type = EXCLUDED.provider_type,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO public.subscription_plans (name, duration_months, price, price_per_month, savings_text, is_best_value, is_active) VALUES
('شهري', 1, 450, 450, NULL, false, true),
('ربع سنوي', 3, 1200, 400, 'وفر 150 ج.م', true, true),
('نصف سنوي', 6, 2100, 350, 'وفر 600 ج.م', false, true)
ON CONFLICT (name) DO UPDATE SET
  duration_months = EXCLUDED.duration_months,
  price = EXCLUDED.price,
  price_per_month = EXCLUDED.price_per_month,
  savings_text = EXCLUDED.savings_text,
  is_best_value = EXCLUDED.is_best_value,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO public.personalized_products (
  key, title, product_type, description, image_url, features, sort_order,
  is_featured, is_addon, is_active, has_printed_version, price_printed,
  price_electronic, goal_config, image_slots, text_fields
) VALUES (
  'subscription_box',
  'صندوق الرحلة الشهري',
  'subscription_box',
  'صندوق تربوي شهري يحتوي على قصة وأنشطة وهدايا تعليمية.',
  'https://i.ibb.co/C0bSJJT/favicon.png',
  '["قصة جديدة", "أنشطة تفاعلية", "هدية تعليمية"]'::jsonb,
  -1,
  true,
  false,
  true,
  true,
  450,
  NULL,
  'none',
  '[]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  product_type = EXCLUDED.product_type,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  is_featured = EXCLUDED.is_featured,
  is_addon = EXCLUDED.is_addon,
  is_active = EXCLUDED.is_active,
  has_printed_version = EXCLUDED.has_printed_version,
  price_printed = EXCLUDED.price_printed,
  price_electronic = EXCLUDED.price_electronic,
  goal_config = EXCLUDED.goal_config,
  image_slots = EXCLUDED.image_slots,
  text_fields = EXCLUDED.text_fields,
  updated_at = NOW();


-- ---------------------------------------------------------
-- Existing rich content seed
-- ---------------------------------------------------------
-- ملف تغذية محتوى الموقع (Seed Content)
-- يحتوي على: نصوص الصفحات الرئيسية، سياسة الخصوصية، شروط الاستخدام، والأسئلة الشائعة.

INSERT INTO public.site_settings (key, value, updated_at)
VALUES 
(
    'global_content',
    jsonb_build_object(
        'portalPage', jsonb_build_object(
            'heroTitle', 'رحلة كل طفل تبدأ بقصة... وقصته تبدأ هنا',
            'heroSubtitle', 'منصة تربوية عربية متكاملة تصنع قصصاً مخصصة تجعل طفلك بطلاً، وتطلق مواهبه في الكتابة الإبداعية',
            'heroButtonText1', 'اطلب قصتك المخصصة الآن',
            'heroButtonText2', 'اكتشف برنامج الكتابة الإبداعية',
            'projectsTitle', 'أقسامنا الرئيسية',
            'projectsSubtitle', 'بوابتان لعالم من الإبداع والنمو',
            'enhaLakTitle', 'إنها لك',
            'enhaLakDescription', 'قصص مخصصة ومنتجات تربوية فريدة تجعل طفلك بطلاً.',
            'enhaLakBtnText', 'اكتشف القصص',
            'creativeWritingTitle', 'بداية الرحلة',
            'creativeWritingDescription', 'برنامج متكامل لتنمية مهارات الكتابة الإبداعية.',
            'creativeWritingBtnText', 'ابدأ الرحلة',
            'aboutSectionTitle', 'قصتنا: من فكرة إلى رحلة',
            'aboutSectionContent', 'نحن منصة تسعى لتمكين الأطفال من خلال القصص والكتابة. نؤمن بأن كل طفل يحمل في داخله مبدعاً صغيراً يحتاج فقط إلى الفرصة والأدوات المناسبة للانطلاق.',
            'aboutBtnText', 'تعرف علينا أكثر',
            'testimonialsTitle', 'ماذا تقول عائلاتنا؟',
            'testimonialsSubtitle', 'آراء نفخر بها',
            'blogTitle', 'من مدونتنا',
            'blogSubtitle', 'مقالات ونصائح تربوية',
            'finalCtaTitle', 'هل أنت جاهز لبدء الرحلة؟',
            'finalCtaSubtitle', 'اختر المسار الذي يناسب طفلك اليوم',
            'finalCtaBtn1', 'تصفح منتجات "إنها لك"',
            'finalCtaBtn2', 'احجز جلسة "بداية الرحلة"',
            'showProjectsSection', true,
            'showStepsSection', true,
            'showAboutSection', true,
            'showTestimonialsSection', true,
            'showBlogSection', true,
            'showFinalCtaSection', true,
            'steps', jsonb_build_array(
                jsonb_build_object('title', '1. اكتشف', 'description', 'تصفح قصصنا المخصصة وبرامجنا الإبداعية المصممة بعناية لتناسب كل طفل.'),
                jsonb_build_object('title', '2. خصص', 'description', 'أضف لمستك الخاصة. املأ تفاصيل طفلك واختر الأهداف والقيم التي ترغب في غرسها.'),
                jsonb_build_object('title', '3. استمتع', 'description', 'استلم منتجاً فريداً ومبهراً ينمي شغف طفلك ويطلق العنان لخياله الواسع.')
            )
        ),
        'privacyPage', jsonb_build_object(
            'title', 'سياسة الخصوصية',
            'content', E'تاريخ السريان: 1 يناير 2024\n\nتولي "منصة الرحلة" ("نحن"، "المنصة") أهمية قصوى لخصوصية زوارها ومشتركيها، وبشكل خاص الأطفال. تهدف هذه السياسة إلى توضيح نوع البيانات التي نجمعها، وكيفية استخدامها، وحقوقك فيما يتعلق بها.\n\n1. المعلومات التي نجمعها\nنقوم بجمع المعلومات لغرضين أساسيين: تقديم خدمات مخصصة عالية الجودة، وضمان تجربة تعليمية آمنة.\n* **بيانات ولي الأمر:** الاسم، البريد الإلكتروني، رقم الهاتف، وعنوان الشحن.\n* **بيانات الطفل (لأغراض التخصيص):** الاسم الأول، العمر، الجنس، الاهتمامات.\n* **الصور الشخصية:** في حال طلب منتج "قصة مخصصة"، قد نطلب صورة للطفل لرسم الشخصية الرئيسية لتشبهه. يتم استخدام هذه الصور حصراً لهذا الغرض الفني.\n* **محتوى الجلسات:** قد يتم تسجيل جلسات الفيديو التعليمية (في برنامج "بداية الرحلة") لأغراض ضمان الجودة، تدريب المدربين، وسلامة الأطفال.\n\n2. كيف نستخدم معلوماتك\n* **تخصيص المنتجات:** تأليف ورسم قصص يكون طفلك بطلها بناءً على البيانات المقدمة.\n* **تنفيذ الطلبات:** شحن المنتجات المطبوعة والتواصل معك بخصوص حالة الطلب.\n* **تحسين الخدمة:** تحليل كيفية استخدام المنصة لتطوير المحتوى والبرامج التعليمية.\n* **الأمان:** مراقبة الجلسات لضمان بيئة آمنة وخالية من التنمر أو المحتوى غير اللائق.\n\n3. مشاركة المعلومات\nنحن لا نبيع ولا نؤجر بياناتك لأي طرف ثالث. قد نشارك بيانات محدودة مع:\n* **شركات الشحن:** لتوصيل الطلبات.\n* **المدربين:** يتم مشاركة اسم الطفل وعمره واهتماماته مع المدرب المعين فقط لغرض التعليم.\n\n4. أمن البيانات\nنستخدم تقنيات تشفير متقدمة (SSL) لحماية بياناتك أثناء النقل والتخزين. يتم تخزين الصور والملفات الشخصية في خوادم مؤمنة ولا يتم الوصول إليها إلا من قبل الموظفين المصرح لهم.\n\n5. حقوقك\nلك الحق في طلب الاطلاع على بياناتك، تصحيحها، أو حذفها في أي وقت. يمكنك القيام بذلك عبر إعدادات الحساب أو التواصل مع الدعم الفني.'
        ),
        'termsPage', jsonb_build_object(
            'title', 'شروط الاستخدام',
            'content', E'مرحباً بك في منصة الرحلة. باستخدامك لهذا الموقع، فإنك توافق على الالتزام بالشروط والأحكام التالية. يرجى قراءتها بعناية.\n\n1. شروط الاشتراك والعضوية\n* يجب أن يتم إنشاء الحسابات وإدارتها من قبل ولي الأمر أو الوصي القانوني لمن هم دون سن 18 عاماً.\n* أنت مسؤول عن الحفاظ على سرية بيانات الدخول الخاصة بحسابك.\n\n2. المنتجات المخصصة (إنها لك)\n* نظراً لطبيعة المنتجات المخصصة (التي يتم طباعتها خصيصاً لطفلك)، لا يمكن إلغاء الطلب أو استرداد المبلغ بعد مرور 24 ساعة من تأكيد الطلب.\n* في حال وجود خطأ مطبعي أو عيب في المنتج ناتج عن المنصة، نلتزم بإعادة طباعة المنتج وإرساله مجاناً.\n\n3. برامج الكتابة الإبداعية (بداية الرحلة)\n* **الالتزام بالمواعيد:** يجب حضور الجلسات في موعدها المحدد. في حال الرغبة في التأجيل، يجب إبلاغنا قبل 24 ساعة على الأقل.\n* **سلوك الطالب:** نتوقع من جميع الطلاب الالتزام بآداب السلوك والاحترام خلال الجلسات الجماعية أو الفردية. يحق للمنصة إنهاء اشتراك أي طالب يخالف قواعد السلوك دون استرداد الرسوم.\n\n4. حقوق الملكية الفكرية\n* جميع المحتويات الموجودة على المنصة (نصوص، رسومات، شعارات، مناهج) هي ملكية حصرية لمنصة الرحلة ومحمية بموجب قوانين حقوق النشر.\n* يمنع نسخ أو إعادة نشر أو توزيع أي جزء من المحتوى دون إذن كتابي مسبق.\n* بالنسبة لكتابات الطلاب: يحتفظ الطالب بملكية حقوق التأليف لقصصه، وتمنح المنصة رخصة غير حصرية لعرضها في "معرض الأعمال" أو المواد التسويقية بموافقة ولي الأمر.\n\n5. التعديلات\nنحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل الموقع.'
        ),
        'supportPage', jsonb_build_object(
            'heroTitle', 'كيف يمكننا مساعدتك؟',
            'heroSubtitle', 'نحن هنا للإجابة على استفساراتك',
            'faqs', jsonb_build_array(
                jsonb_build_object('question', 'كيف يمكنني تتبع طلبي؟', 'answer', 'يمكنك تتبع طلبك من خلال لوحة التحكم الخاصة بك في قسم "مكتبتي".', 'category', 'إنها لك'),
                jsonb_build_object('question', 'كم يستغرق شحن القصة المخصصة؟', 'answer', 'تستغرق عملية الطباعة والتجهيز من 3 إلى 5 أيام عمل، ثم يتم الشحن خلال 2-3 أيام حسب المحافظة.', 'category', 'إنها لك'),
                jsonb_build_object('question', 'هل يمكنني تعديل القصة بعد الطلب؟', 'answer', 'نظراً لأن القصة تطبع خصيصاً لطفلك، لا يمكن التعديل بعد مرور 24 ساعة من الطلب. يرجى مراجعة البيانات بدقة قبل التأكيد.', 'category', 'إنها لك'),
                jsonb_build_object('question', 'ما هي طرق الدفع المتاحة؟', 'answer', 'نقبل الدفع عبر Instapay، المحافظ الإلكترونية (فودافون كاش وغيرها)، والبطاقات البنكية.', 'category', 'عامة'),
                jsonb_build_object('question', 'هل يمكنني استرداد المبلغ؟', 'answer', 'بالنسبة للمنتجات الرقمية والخدمات التي تم تقديمها، لا يمكن استرداد المبلغ. المنتجات المطبوعة التي بها عيب مصنعي يتم استبدالها مجاناً.', 'category', 'عامة'),
                jsonb_build_object('question', 'هل يمكنني تغيير موعد الجلسة؟', 'answer', 'نعم، يمكنك طلب تغيير الموعد قبل 24 ساعة من خلال التواصل مع المدرب أو الإدارة عبر لوحة التحكم.', 'category', 'بداية الرحلة'),
                jsonb_build_object('question', 'كيف تتم الجلسات الأونلاين؟', 'answer', 'تتم الجلسات عبر منصة فيديو مدمجة في موقعنا. لا تحتاج لتحميل أي برامج، فقط اضغط على "انضم للجلسة" في موعدها.', 'category', 'بداية الرحلة'),
                jsonb_build_object('question', 'كيف يمكنني الانضمام كمدرب؟', 'answer', 'يمكنك تقديم طلب انضمام عبر صفحة "انضم إلينا" وسنقوم بمراجعة طلبك.', 'category', 'الشركاء'),
                jsonb_build_object('question', 'أنا دار نشر، كيف أعرض كتبي لديكم؟', 'answer', 'نرحب بالشراكات مع دور النشر المتميزة. يرجى التواصل معنا عبر نموذج "الشراكات" لإنشاء حساب ناشر خاص بكم.', 'category', 'الشركاء')
            )
        ),
        'aboutPage', jsonb_build_object(
            'heroTitle', 'رحلتنا: من فكرة إلى رؤية',
            'heroSubtitle', 'نتطلع لمستقبل مشرق لأطفالنا',
            'missionStatement', 'نؤمن أن كل طفل هو بطل حكايته الخاصة.',
            'ourStory', 'في عالم يتسارع نحو الرقمنة...',
            'ourVision', 'أن نكون المنصة الرائدة والوجهة الأولى لكل أسرة عربية.',
            'valuesTitle', 'قيمنا الأساسية',
            'teamTitle', 'تعرف على بعض أفراد الفريق'
        ),
        'enhaLakPage', jsonb_build_object(
            'main', jsonb_build_object(
                'heroTitle', 'قصة فريدة... بطلها طفلك',
                'heroSubtitle', 'منتجات تربوية مخصصة تعزز الهوية وتنمي القيم.',
                'heroBtnText', 'تصفح المنتجات واطلب الآن',
                'productsTitle', 'منتجاتنا المميزة',
                'howItWorksTitle', 'كيف تعمل؟',
                'testimonialsTitle', 'آراء العملاء',
                'testimonialsSubtitle', 'ماذا قالوا عنا',
                'finalCtaTitle', 'جاهز للطلب؟',
                'finalCtaSubtitle', 'ابدأ الآن بتخصيص قصة لطفلك.'
            ),
            'store', jsonb_build_object(
                'heroTitle', 'متجر القصص',
                'heroSubtitle', 'اختر القصة التي تناسب طفلك.',
                'subscriptionBannerTitle', 'اشترك في صندوق الرحلة',
                'addonProductsTitle', 'إضافات'
            ),
            'subscription', jsonb_build_object(
                'heroTitle', 'صندوق الرحلة الشهري',
                'heroSubtitle', 'هدية متجددة كل شهر.',
                'features', jsonb_build_array('قصة مخصصة جديدة', 'أنشطة تفاعلية', 'هدية إضافية')
            )
        ),
        'creativeWritingPage', jsonb_build_object(
            'main', jsonb_build_object(
                'heroTitle', 'بداية الرحلة: أطلق العنان لخيال طفلك',
                'heroSubtitle', 'برنامج تدريبي لتنمية مهارات الكتابة.',
                'methodologyTitle', 'منهجيتنا',
                'methodologySubtitle', 'كيف نعلم الكتابة',
                'transformationTitle', 'رحلة التحول',
                'packagesTitle', 'باقات الاشتراك',
                'servicesTitle', 'خدمات إضافية',
                'instructorsTitle', 'مدربونا'
            ),
            'about', jsonb_build_object(
                'heroTitle', 'عن البرنامج',
                'heroSubtitle', 'فلسفتنا في التعليم',
                'mainTitle', 'لماذا بداية الرحلة؟',
                'mainContent', 'لأننا نؤمن...',
                'philosophyTitle', 'فلسفتنا'
            ),
            'curriculum', jsonb_build_object(
                'heroTitle', 'المنهج الدراسي',
                'heroSubtitle', 'ماذا سيتعلم طفلك',
                'treasuresTitle', 'كنوز الرحلة',
                'treasuresSubtitle', 'ما يحصل عليه الطالب'
            ),
            'instructors', jsonb_build_object(
                'heroTitle', 'فريق التدريب',
                'heroSubtitle', 'تعرف على المدربين'
            )
        ),
        'footer', jsonb_build_object(
            'copyrightText', 'منصة الرحلة. جميع الحقوق محفوظة.',
            'description', 'نؤمن أن كل طفل هو بطل حكايته الخاصة.'
        )
    ),
    NOW()
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- تحديث الكاش لتفعيل البيانات فوراً
NOTIFY pgrst, 'reload config';

-- ---------------------------------------------------------
-- Existing product seed
-- ---------------------------------------------------------
-- 1. HERO STORIES (Upsert)
INSERT INTO public.personalized_products (
    key, title, product_type, description, image_url, features, sort_order, 
    is_featured, is_addon, is_active, has_printed_version, price_printed, 
    price_electronic, goal_config, story_goals, image_slots, text_fields
) VALUES
(
    'space_adventure',
    'مغامرة في الفضاء',
    'hero_story',
    'رحلة خيالية يأخذ فيها طفلك دور رائد فضاء شجاع يكتشف الكواكب والنجوم، ويتعلم أهمية العلم والاستكشاف.',
    'https://i.ibb.co/wznz4Xk/space-cover.jpg',
    '["بطل القصة هو طفلك (الاسم والصورة)", "تعزيز حب الاستكشاف والعلوم", "رسومات عالية الجودة وألوان زاهية"]'::jsonb,
    1, true, false, true, true, 450, 200,
    'predefined',
    '[{"key": "courage", "title": "الشجاعة"}, {"key": "curiosity", "title": "حب المعرفة"}, {"key": "teamwork", "title": "العمل الجماعي"}]'::jsonb,
    '[{"id": "child_photo", "label": "صورة البطل (وجه واضح)", "required": true}]'::jsonb,
    '[{"id": "dedication", "label": "إهداء (اختياري)", "type": "textarea", "required": false, "placeholder": "اكتب إهداء خاص ليطبع في الصفحة الأولى..."}]'::jsonb
),
(
    'jungle_king',
    'ملك الغابة الصغير',
    'hero_story',
    'قصة ممتعة في قلب الغابة، حيث يتعلم طفلك كيف يكون قائداً رحيماً ويساعد الحيوانات في حل مشاكلهم.',
    'https://i.ibb.co/3r0QyXz/jungle-cover.jpg',
    '["تعليم قيم القيادة والرحمة", "مغامرة ممتعة مع الحيوانات", "تخصيص كامل لملامح الطفل"]'::jsonb,
    2, false, false, true, true, 450, 200,
    'predefined_and_custom',
    '[{"key": "kindness", "title": "الرفق بالحيوان"}, {"key": "responsibility", "title": "تحمل المسؤولية"}]'::jsonb,
    '[{"id": "child_photo", "label": "صورة الطفل", "required": true}]'::jsonb,
    '[{"id": "favorite_animal", "label": "الحيوان المفضل للطفل", "type": "input", "required": true, "placeholder": "أسد، فيل، قرد..."}]'::jsonb
),
(
    'ocean_secret',
    'سر المحيط العميق',
    'hero_story',
    'غوص في أعماق البحار لاكتشاف عالم مليء بالألوان والعجائب، وتعلم درس مهم عن الحفاظ على البيئة.',
    'https://i.ibb.co/xqJ9zYh/ocean-cover.jpg',
    '["تنمية الوعي البيئي", "قصة مشوقة ومليئة بالخيال", "هدية مثالية لمحبي السباحة"]'::jsonb,
    3, false, false, true, true, 450, 200,
    'custom',
    '[]'::jsonb,
    '[{"id": "child_photo", "label": "صورة الطفل", "required": true}]'::jsonb,
    '[]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
    title = EXCLUDED.title,
    product_type = EXCLUDED.product_type,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    is_featured = EXCLUDED.is_featured,
    is_addon = EXCLUDED.is_addon,
    is_active = EXCLUDED.is_active,
    has_printed_version = EXCLUDED.has_printed_version,
    price_printed = EXCLUDED.price_printed,
    price_electronic = EXCLUDED.price_electronic,
    goal_config = EXCLUDED.goal_config,
    story_goals = EXCLUDED.story_goals,
    image_slots = EXCLUDED.image_slots,
    text_fields = EXCLUDED.text_fields;

-- 2. LIBRARY BOOKS (Upsert) - Updated image_slots to be consistent
INSERT INTO public.personalized_products (
    key, title, product_type, description, image_url, features, sort_order, 
    is_featured, is_addon, is_active, has_printed_version, price_printed, 
    price_electronic, goal_config, image_slots
) VALUES
(
    'prophet_stories',
    'قصص الأنبياء للأطفال',
    'library_book',
    'مجموعة مختارة من قصص الأنبياء بأسلوب مبسط ومناسب للأطفال، مع رسومات توضيحية جميلة (بدون تجسيد).',
    'https://i.ibb.co/hMdJqKy/prophets-book.jpg',
    '["لغة عربية سهلة وسليمة", "دروس وعبر قيمة", "غلاف مخصص باسم طفلك"]'::jsonb,
    10, false, false, true, true, 350, 150,
    'none',
    '[{"id": "face_image", "label": "صورة وجه الطفل (إلزامي للغلاف)", "required": true}, {"id": "extra_image", "label": "صورة أخرى / إهداء (اختياري)", "required": false}]'::jsonb
),
(
    'science_encyclopedia',
    'موسوعة المستكشف الصغير',
    'library_book',
    'رحلة في عالم العلوم، الفضاء، جسم الإنسان، والطبيعة. مليئة بالحقائق المدهشة والصور.',
    'https://i.ibb.co/KjqF8Lw/science-book.jpg',
    '["معلومات علمية دقيقة ومبسطة", "تنمي حب المعرفة", "طباعة فاخرة وغلاف مخصص"]'::jsonb,
    11, true, false, true, true, 400, null,
    'none',
    '[{"id": "face_image", "label": "صورة وجه الطفل (إلزامي للغلاف)", "required": true}, {"id": "extra_image", "label": "صورة أخرى / إهداء (اختياري)", "required": false}]'::jsonb
),
(
    'manners_book',
    'حديقة الأخلاق',
    'library_book',
    'قصص قصيرة تعلم الأطفال الآداب الإسلامية والأخلاق الحميدة في التعامل مع الأسرة والجيران والأصدقاء.',
    'https://i.ibb.co/tHPq9Yn/manners-book.jpg',
    '["تربية سلوكية ممتعة", "مواقف من الحياة اليومية", "غلاف يحمل اسم طفلك"]'::jsonb,
    12, false, false, true, true, 300, 120,
    'none',
    '[{"id": "face_image", "label": "صورة وجه الطفل (إلزامي للغلاف)", "required": true}, {"id": "extra_image", "label": "صورة أخرى / إهداء (اختياري)", "required": false}]'::jsonb
),
(
    'bedtime_tales',
    'حكايات قبل النوم',
    'library_book',
    'مجموعة هادئة ولطيفة من القصص الخيالية القصيرة لتساعد طفلك على الاسترخاء والنوم بأحلام سعيدة.',
    'https://i.ibb.co/D8z2LqM/bedtime-book.jpg',
    '["نصوص مريحة وهادئة", "تعزز العلاقة بين الطفل والوالدين", "غلاف ليلي مميز باسم الطفل"]'::jsonb,
    13, false, false, true, true, 320, 130,
    'none',
    '[{"id": "face_image", "label": "صورة وجه الطفل (إلزامي للغلاف)", "required": true}, {"id": "extra_image", "label": "صورة أخرى / إهداء (اختياري)", "required": false}]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
    title = EXCLUDED.title,
    product_type = EXCLUDED.product_type,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    is_featured = EXCLUDED.is_featured,
    is_addon = EXCLUDED.is_addon,
    is_active = EXCLUDED.is_active,
    has_printed_version = EXCLUDED.has_printed_version,
    price_printed = EXCLUDED.price_printed,
    price_electronic = EXCLUDED.price_electronic,
    goal_config = EXCLUDED.goal_config,
    image_slots = EXCLUDED.image_slots;

-- 3. ADDONS (Upsert)
INSERT INTO public.personalized_products (
    key, title, product_type, description, image_url, features, sort_order, 
    is_featured, is_addon, is_active, has_printed_version, price_printed, 
    price_electronic, goal_config
) VALUES
(
    'coloring_book',
    'دفتر تلوين الأبطال',
    'hero_story', 
    'دفتر تلوين يحتوي على شخصيات القصة ومشاهد منها، ليقوم الطفل بتلوين مغامرته بنفسه.',
    'https://i.ibb.co/GxsJqXy/coloring-book.jpg',
    '["رسومات جاهزة للتلوين", "تنمي المهارات الفنية", "امتداد لتجربة القصة"]'::jsonb,
    50, false, true, true, true, 80, null, 'none'
),
(
    'sticker_pack',
    'ملصقات اسمي',
    'hero_story',
    'مجموعة ملصقات (Stickers) عالية الجودة تحمل اسم طفلك وشخصيات كرتونية لطيفة.',
    'https://i.ibb.co/C0bSJJT/favicon.png', 
    '["تستخدم للكتب والأدوات المدرسية", "تصاميم متنوعة وجذابة", "مقاومة للماء"]'::jsonb,
    51, false, true, true, true, 50, null, 'none'
)
ON CONFLICT (key) DO UPDATE SET
    title = EXCLUDED.title,
    product_type = EXCLUDED.product_type,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    is_featured = EXCLUDED.is_featured,
    is_addon = EXCLUDED.is_addon,
    is_active = EXCLUDED.is_active,
    has_printed_version = EXCLUDED.has_printed_version,
    price_printed = EXCLUDED.price_printed,
    price_electronic = EXCLUDED.price_electronic,
    goal_config = EXCLUDED.goal_config;

-- Ensure Subscription Box exists properly configured
UPDATE public.personalized_products
SET 
    product_type = 'subscription_box',
    is_active = true,
    sort_order = -1
WHERE key = 'subscription_box';


-- Optional demo publishers. These only seed publisher_profiles when matching auth users already exist.
DO $$
DECLARE
  shourouk UUID := 'adb2132c-3eaa-4764-9d08-3ede080304c7';
  nahda UUID := '59afd05f-7a28-4019-8089-16c462037631';
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = shourouk) THEN
    INSERT INTO public.profiles (id, email, name, role, created_at)
    VALUES (shourouk, 'shourouk@demo.com', 'دار الشروق', 'publisher', NOW())
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

    INSERT INTO public.publisher_profiles (user_id, store_name, slug, description, logo_url, website)
    --TODO Remove webwikipedia url
    VALUES (shourouk, 'دار الشروق', 'dar-el-shourouk', 'من أعرق دور النشر في مصر والعالم العربي، تقدم محتوى متميز للأطفال.', 'https://upload.wikimedia.org/wikipedia/ar/7/7a/Dar_El_Shorouk_Logo.png', 'https://shorouk.com')
    ON CONFLICT (user_id) DO UPDATE SET store_name = EXCLUDED.store_name, slug = EXCLUDED.slug, description = EXCLUDED.description, logo_url = EXCLUDED.logo_url, website = EXCLUDED.website;
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE id = nahda) THEN
    INSERT INTO public.profiles (id, email, name, role, created_at)
    VALUES (nahda, 'nahda@demo.com', 'نهضة مصر', 'publisher', NOW())
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

    INSERT INTO public.publisher_profiles (user_id, store_name, slug, description, logo_url, website)
    VALUES (nahda, 'نهضة مصر', 'nahdet-misr', 'مجموعة رائدة في مجال النشر التعليمي والثقافي لأكثر من 80 عاماً.', 'https://yt3.googleusercontent.com/ytc/AIdro_nGEy_QJO_sXFk_d4lTjWv5vC9Q_gC9_qC9_qC9=s900-c-k-c0x00ffffff-no-rj', 'https://www.nahdetmisr.com')
    ON CONFLICT (user_id) DO UPDATE SET store_name = EXCLUDED.store_name, slug = EXCLUDED.slug, description = EXCLUDED.description, logo_url = EXCLUDED.logo_url, website = EXCLUDED.website;
  END IF;
END $$;

NOTIFY pgrst, 'reload config';
