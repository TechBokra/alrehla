import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { getMarketplaceShellData } from '../services/marketplaceShellService';

const Footer = async () => {
  const { socialLinks, siteContent } = await getMarketplaceShellData();

  // دالة للتحقق من وجود رابط حقيقي وغير فارغ
  const hasLink = (url: string | null | undefined) => url && url.trim() !== '' && url !== '#';
  const copyrightYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">منصة الرحلة</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {siteContent?.footer?.description || 'نؤمن أن كل طفل هو بطل حكايته الخاصة.'}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  رحلتنا
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  المدونة
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  الدعم
                </Link>
              </li>
              <li>
                <Link
                  href="/join-us"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  انضم إلينا
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">أقسامنا</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/enha-lak"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  قصص "إنها لك"
                </Link>
              </li>
              <li>
                <Link
                  href="/creative-writing"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  برنامج "بداية الرحلة"
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">تابعنا</h3>
            <div className="flex gap-4">
                {hasLink(socialLinks?.facebook_url) && (
                  <a
                    href={socialLinks!.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-blue-600 transition-colors"
                    title="فيسبوك"
                  >
                    <Facebook size={24} />
                  </a>
                )}
                {hasLink(socialLinks?.twitter_url) && (
                  <a
                    href={socialLinks!.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-sky-500 transition-colors"
                    title="تويتر"
                  >
                    <Twitter size={24} />
                  </a>
                )}
                {hasLink(socialLinks?.instagram_url) && (
                  <a
                    href={socialLinks!.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-pink-600 transition-colors"
                    title="انستجرام"
                  >
                    <Instagram size={24} />
                  </a>
                )}
                {!hasLink(socialLinks?.facebook_url) &&
                  !hasLink(socialLinks?.twitter_url) &&
                  !hasLink(socialLinks?.instagram_url) && (
                    <span className="text-xs text-muted-foreground italic">
                      لم يتم ربط حسابات تواصل
                    </span>
                  )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
          <p>
            &copy; {copyrightYear}{' '}
            {siteContent?.footer?.copyrightText || 'منصة الرحلة. جميع الحقوق محفوظة.'}
          </p>
          <div className="flex gap-4 items-center">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              الخصوصية
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              الشروط
            </Link>
            <span className="text-border">|</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
