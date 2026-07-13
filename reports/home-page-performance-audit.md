# Alrehla Marketplace Home Page Audit

Date: 2026-07-13  
Scope: `apps/marketplace` Home route and the components, providers, services, styles, Supabase calls, and app configuration used by the Home page.  
Method: source inspection plus a production build attempt. Lighthouse was not run because the production build currently fails.

## 1. Executive Summary

The Home page is structurally close to a good Next.js architecture because `PortalPage` is an async Server Component, but most of the benefit is lost because the app wraps every route in a broad client-side provider stack and a client `MarketplaceShell`. The result is extra hydration, duplicated Supabase requests, more JavaScript than needed for an anonymous public landing page, and weaker cacheability.

The most urgent issue is that the marketplace production build currently fails in `PortalPage.tsx` because `siteBranding` can be `null`. Until that is fixed, Lighthouse, production deployment validation, and reliable regression testing are blocked.

Highest-impact fixes:

1. Fix the Home build error and remove the duplicate branding query.
2. Remove `force-dynamic` from `/` and make Home cacheable with ISR or explicit server caching.
3. Split the global client shell into server-rendered layout plus small client islands.
4. Replace `getAllPublicData()` on Home with a narrow `getHomePageData()` service that selects only rendered fields.
5. Add real Metadata API coverage, structured data, dynamic sitemap, and canonical URLs.
6. Fix menu/dropdown keyboard accessibility and invalid nested interactive controls.

## 2. Estimated Lighthouse Scores

These are estimates, not measured Lighthouse scores, because `pnpm --filter @alrehla/marketplace build` fails at type checking.

| Category | Mobile estimate | Desktop estimate | Target | Why |
|---|---:|---:|---:|---|
| Performance | 48 | 68 | 90+ | Raw LCP image, disabled image optimization, large client shell, duplicated Supabase data, forced dynamic Home route. |
| Accessibility | 76 | 78 | 95+ | Missing skip link, weak menu focus handling, invalid nested controls, generic image alt text, reduced-motion gaps. |
| Best Practices | 70 | 72 | 95+ | Build failure, broad `suppressHydrationWarning`, debug logging, missing security headers, manual script injection. |
| SEO | 70 | 74 | 95+ | Minimal metadata, no canonical/OG/Twitter metadata, no JSON-LD, static sitemap/robots gaps. |

## 3. Critical Findings

| Severity | Category | File / block | Description | User impact / CWV | Recommended fix |
|---|---|---|---|---|---|
| P0 | Build | `apps/marketplace/src/features/portal/templates/PortalPage.tsx:35` | Production build fails: `siteBranding` is possibly `null`. | Blocks production build and Lighthouse measurement. | Normalize branding once, e.g. `const siteBranding = data.siteBranding ?? {};`, and remove the duplicate Supabase query. |
| P0 | Performance / caching | `apps/marketplace/src/app/page.tsx:1` | `export const dynamic = 'force-dynamic';` makes Home always dynamic. | Higher TTFB, no static/ISR cache, weaker CDN behavior. Affects TTFB/LCP. | Remove `force-dynamic`; use `export const revalidate = 300` or cached service calls. |
| P1 | Performance / architecture | `apps/marketplace/src/app/layout.tsx:24-34`, `src/app/providers.tsx:1-39`, `MarketplaceShell.tsx:1-59` | All pages, including anonymous Home, hydrate `QueryClient`, auth, product, cart, toast, shell, header, footer, guards, GA, banners, and floating buttons. | More JS parse/hydration work; worse INP and mobile performance. | Convert layout/header/footer to server components where possible; keep auth/cart/menu/notifications as small client islands. |
| P1 | Supabase / performance | `packages/api/src/services/publicService.ts:getAllPublicData()` block | Home fetches broad table data with many `select('*')` calls, including data not rendered by Home. | Larger payloads, slower TTFB, more memory, unnecessary DB work. | Add `getHomePageData()` with narrow columns, filters, limits, and server cache. |
| P1 | Supabase duplication | `PortalPage.tsx:16-21`, `Footer.tsx`, `WhatsAppButton.tsx`, `DevelopmentBanner.tsx`, `ProductProvider` | Branding/settings/public data are fetched multiple times on server and client. | Duplicated network and DB work; slower hydration. | Fetch Home public settings once on the server and pass narrow props to footer/WhatsApp/banner. |
| P1 | LCP image | `HeroSection.tsx:13-19` | Hero uses raw `<img>` for the likely LCP element. | No Next image optimization, no responsive sizes, weaker preload behavior. Affects LCP. | Use `next/image` with `fill`, `priority`, `fetchPriority="high"`, `sizes="100vw"`, and decorative `alt=""`. |
| P1 | Images | `apps/marketplace/next.config.mjs` images config | `images.unoptimized = true` disables the Next image optimizer. | Larger image downloads and slower LCP/CLS recovery. | Set `unoptimized: false` and configure `remotePatterns` for Supabase/storage/image hosts. |
| P1 | Images / layout | `PortalPage.tsx:103-109`, `PortalPage.tsx:195-200`, `ProjectCard.tsx:39-44` | Several `Image fill` usages miss `sizes` and/or a stable positioned parent with dimensions. | Oversized downloads and possible CLS/collapsed images. | Add `sizes`, `relative`, and fixed/aspect-ratio wrappers. |
| P1 | SEO | `layout.tsx:15-18`, public `robots.txt`/`sitemap.xml` | Metadata is only title/description; sitemap appears static. | Lower rich preview quality and weaker crawl signals. | Add `metadataBase`, canonical, Open Graph, Twitter metadata, icons, manifest, JSON-LD, and dynamic sitemap. |
| P2 | Accessibility | `Header.tsx`, `UserDropdown`, `NotificationDropdown` | Menus/dropdowns rely on click state and include nested interactive controls in places. | Keyboard and screen-reader users can get stuck or receive invalid semantics. | Use accessible dialog/menu patterns, Escape handling, focus return, `aria-expanded`, and no nested buttons/links. |
| P2 | Fonts | `layout.tsx:9-12` | Cairo loads eight font weights. | Extra font CSS and font files; slower first render. | Keep only used weights, likely `400`, `600`, `700`. |
| P2 | Best practices / privacy | `PortalPage.tsx:32`, `apps/marketplace/src/app/api/send-email/route.ts` | Debug logging remains in server/page code; email API logs request data. | Noisy logs and possible sensitive data exposure. | Remove debug logs and redact request logging. |
| P2 | Security / best practices | `next.config.mjs` | No obvious security headers are configured. | Weaker default browser protections. | Add CSP where feasible, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`, and frame policy. |

## 4. Quick Wins

1. Fix `siteBranding` nullability and remove the direct branding Supabase query from `PortalPage`.
2. Remove `force-dynamic` from Home and add `revalidate`.
3. Replace the hero raw `<img>` with `next/image`.
4. Change Cairo weights from eight weights to three.
5. Add `sizes` to `ProjectCard` and publisher/about images.
6. Remove `console.log({ siteBranding })`.
7. Add a skip link and `id="main-content"`.
8. Add metadataBase/canonical/OG/Twitter metadata.
9. Limit Home blog posts to 3 and publisher logos to a small number.
10. Disable `ProductProvider` data prefetch on public routes that do not need product pricing immediately.

## 5. Detailed Findings

### Performance

- `apps/marketplace/src/app/page.tsx:1` forces Home to dynamic rendering. This removes the default static/ISR advantage of a public landing page.
- `layout.tsx:24-34` and `providers.tsx:27-36` hydrate a large provider tree globally. Home should not need full auth/product/cart state before the user interacts.
- `MarketplaceShell.tsx:22-37` subscribes to auth changes and initializes analytics on every route. That belongs in a small client island, not around the whole page.
- `PortalPage.tsx:16-21` fetches data sequentially and duplicates settings already returned by `getAllPublicData()`.
- `PortalPage.tsx:83` references a third-party texture URL. This adds an extra request and creates an avoidable dependency for paint.

### Core Web Vitals

- LCP: `HeroSection.tsx:13-19` uses raw `<img>` for the hero background. Use `next/image` and make it the only priority image on the page.
- CLS: `Image fill` components need stable parent dimensions. The publisher logo and about image blocks should use `relative` wrappers with fixed size or `aspect-*` classes.
- INP: The global client shell, auth subscription, notification listener, scroll listeners, cart state, product state, and dropdown state all increase hydration and event work on first load.
- TTFB: `force-dynamic` plus broad Supabase reads makes the page harder to cache.

### Supabase

- `getAllPublicData()` fetches instructors, blog posts, products, packages, subscriptions, services, settings, badges, comparison items, and publishers for Home. Home does not render most of this above the fold.
- Several queries use `select('*')`, which makes payloads fragile and unnecessarily large.
- Public settings are fetched on the server and again from client hooks/providers.
- Notifications should select only `id`, `type`, `message`, `link`, `is_read`, `created_at` and limit the first payload.
- Server Components should use a server-safe Supabase/data layer with explicit caching. Browser session persistence should not be the default client used by server-only public reads.

### Images / Media

- Enable Next image optimization in `next.config.mjs`.
- Hero, logo, blog cards, and many custom `Image` wrapper usages bypass Next image optimization.
- Add `sizes` to every `next/image` with `fill`.
- Use stable aspect-ratio wrappers for cards and about sections.
- Replace third-party placeholder and texture images with local assets or Supabase-hosted optimized assets.

### Fonts

- `next/font/google` is good, but loading Cairo weights `200-900` is excessive.
- Use only weights actually referenced by Tailwind classes. A strong default is `400`, `600`, `700`.
- Keep `display: 'swap'`.

### Accessibility

- Add a skip-to-content link before the header.
- Convert mobile nav, user menu, and notification dropdown to accessible menu/dialog patterns.
- Avoid nested interactive elements such as buttons inside links or clickable spans inside buttons.
- Add `aria-label` to icon-only social links and floating action buttons.
- Hero background image should be decorative with `alt=""` and `aria-hidden="true"`.
- Add Escape key handling and focus return for dropdowns.
- Respect `prefers-reduced-motion` for animated reveal/hover effects.

### SEO

- Expand root metadata beyond title/description.
- Add canonical URL, Open Graph, Twitter card, icons, manifest, robots metadata, and `metadataBase`.
- Add JSON-LD for `Organization`, `WebSite`, and key product/service offerings.
- Replace static sitemap with `app/sitemap.ts` that includes dynamic blog/product/content routes.
- Ensure robots points to the production domain, not a Vercel preview URL.

### Best Practices / Security

- Remove `suppressHydrationWarning` unless there is a specific unavoidable mismatch.
- Move GA loading to `next/script` with `strategy="afterInteractive"` and consent-aware behavior if required.
- Add security headers in `next.config.mjs` or platform config.
- Remove server debug logs and avoid logging email request payloads.
- Add route-level `loading.tsx` and `error.tsx` instead of a root full-screen Suspense spinner.

### Responsive Design

- Hero uses `h-[calc(100vh-4rem)] min-h-[500px]`. Prefer `svh`/`dvh` behavior for mobile browser bars and avoid trapping the first viewport.
- Floating WhatsApp and scroll buttons should use logical/end positioning and safe-area spacing.
- Verify the publisher logo row and cards at 320px, 375px, 768px, 1024px, and 1440px.

### RTL / Localization

- `html lang="ar" dir="rtl"` is correct.
- Prefer logical CSS classes/properties for spacing and positioning where possible.
- Keep accessible labels in Arabic on Arabic UI.
- If English routes exist later, add `alternates.languages` and route-level `lang`/`dir` handling.

## 6. Recommended Home Architecture

```text
apps/marketplace/src/app/
├── layout.tsx                         # Server: html, font, metadata, skip link
├── page.tsx                           # Server: ISR, fetch getHomePageData()
├── loading.tsx                        # Route loading state
├── error.tsx                          # Route error boundary
├── sitemap.ts                         # Dynamic sitemap
└── robots.ts                          # Robots metadata

features/portal/
├── templates/HomePage.tsx             # Server component, receives narrow DTO
├── components/HeroSection.tsx         # Server, next/image priority hero
├── components/ProjectCard.tsx         # Server, next/image sizes
├── components/PublisherStrip.tsx      # Server, limited logos
├── components/BlogPreviewGrid.tsx     # Server cards where possible
└── components/HomeClientActions.tsx   # Small client islands only if needed

components/layout/
├── Header.server.tsx                  # Static logo/nav
├── HeaderClientMenu.tsx               # Mobile/user menu island
├── CartBadge.tsx                      # Client island
├── NotificationBell.tsx               # Client island, authenticated only
├── Footer.server.tsx                  # Server footer with props
└── FloatingActions.client.tsx         # WhatsApp/scroll buttons only

packages/api/src/services/
├── homeService.ts                     # getHomePageData(), narrow selects
├── publicSettingsService.ts           # typed settings helpers
└── serverSupabase.ts                  # server-safe Supabase read client
```

## 7. Supabase Query Plan

| Current query/source | Problem | Replacement query/service | Cache / validation |
|---|---|---|---|
| `publicService.getAllPublicData()` | Fetches many unrelated tables and `select('*')`. | `homeService.getHomePageData()` returning only hero, portal content, project cards, 3 blog posts, limited publishers, social/contact settings. | Cache with `revalidate: 300`; validate DTO defaults. |
| `PortalPage` direct `public_settings` branding query | Duplicate of settings data. | Use branding from Home DTO. | No second query. |
| `Footer`, `WhatsAppButton`, `DevelopmentBanner` `usePublicData()` | Client re-fetches full public data bundle. | Server footer/banner props from Home DTO; WhatsApp receives one phone/link prop. | Zero client public-data fetch on Home. |
| `ProductProvider` `usePrices`, `useSiteBranding`, `useShippingCosts` | Eager client queries on pages that may not need them. | Lazy-load provider only inside product/order flows or prehydrate narrow values per route. | Verify cart/order flows still receive prices. |
| `blog_posts select('*')` | Overfetch and no Home limit. | `select('id,slug,title,excerpt,cover_image_url,published_at').eq('status','published').order('published_at',{ascending:false}).limit(3)`. | Ensure status/deleted filters match schema. |
| `publisher_profiles select('*')` | Overfetch and unbounded. | `select('id,slug,store_name,logo_url').eq('is_active',true).limit(8)`. | Adjust filter to real approval/is_active columns. |
| notifications in Header | Potentially broad first payload. | Select minimal fields and `.limit(20)`. | Only subscribe after authenticated user exists. |

## 8. Implementation Plan

### Phase 0: Unblock Build

Files: `PortalPage.tsx`, `app/page.tsx`  
Changes: remove duplicate branding query, normalize settings defaults, remove debug log, remove `force-dynamic`.  
Benefit: production build and Lighthouse can run.  
Risk: low; verify branding image fallbacks.  
Validation: `pnpm --filter @alrehla/marketplace typecheck` and `pnpm --filter @alrehla/marketplace build`.

### Phase 1: Data and Cache Refactor

Files: `packages/api/src/services/homeService.ts`, `publicService.ts`, `PortalPage.tsx`, footer/WhatsApp/banner components.  
Changes: introduce `getHomePageData()`, narrow selects, limits, server DTO, and ISR/cache.  
Benefit: lower TTFB, less DB work, less client network.  
Risk: medium; map current content/settings carefully.  
Validation: compare rendered Home content before/after and inspect network for duplicate public-data calls.

### Phase 2: Images, Fonts, and LCP

Files: `HeroSection.tsx`, `ProjectCard.tsx`, `PortalPage.tsx`, `next.config.mjs`, `layout.tsx`.  
Changes: `next/image` for hero, enable optimizer, remote patterns, `sizes`, stable aspect ratios, reduce Cairo weights.  
Benefit: better LCP and lower transfer size.  
Risk: medium if remote image hosts are incomplete.  
Validation: browser network image sizes, Lighthouse LCP element, mobile screenshots.

### Phase 3: Client-Shell Reduction

Files: `layout.tsx`, `MarketplaceShell.tsx`, `Header.tsx`, `Footer.tsx`, providers/contexts.  
Changes: make chrome server-first; isolate cart/auth/menu/notifications/GA/scroll buttons as client islands.  
Benefit: lower JS/hydration and better INP.  
Risk: medium-high; route behavior and auth redirects must be tested.  
Validation: bundle analyzer or Next build output, React Profiler, route smoke tests.

### Phase 4: Accessibility and SEO

Files: layout/header/dropdowns, metadata, sitemap/robots, structured data.  
Changes: skip link, keyboard menus, no nested interactive controls, metadata, JSON-LD, dynamic sitemap.  
Benefit: target 95+ accessibility and SEO.  
Risk: low-medium.  
Validation: keyboard-only pass, axe/Lighthouse, rich result testing.

### Phase 5: Measurement

Run build, start production server, Lighthouse mobile/desktop, console/network checks, and responsive snapshots. Use before/after metrics for LCP, CLS, INP/TBT, JS transfer, image transfer, and request count.

## 9. Proposed Patches

These are focused patches to apply in the implementation pass. They are not applied yet.

### Patch A: Make Home cacheable and fix branding nullability

```diff
diff --git a/apps/marketplace/src/app/page.tsx b/apps/marketplace/src/app/page.tsx
@@
-export const dynamic = 'force-dynamic';
+export const revalidate = 300;
 
 import PortalPage from '@/features/portal';
```

```diff
diff --git a/apps/marketplace/src/features/portal/templates/PortalPage.tsx b/apps/marketplace/src/features/portal/templates/PortalPage.tsx
@@
-import { supabase } from '@/lib/supabaseClient';
@@
 const PortalPage = async () => {
   const data = await publicService.getAllPublicData();
-
-  const { data: siteBranding } = await supabase
-    .from('public_settings')
-    .select('value')
-    .eq('key', 'branding')
-    .single();
+  const siteBranding = data.siteBranding ?? {};
@@
-  console.log({ siteBranding });
@@
-    <HeroSection backgroundUrl={siteBranding?.value?.heroImageUrl?.url} content={siteContent.hero} />
+    <HeroSection backgroundUrl={siteBranding?.heroImageUrl?.url} content={siteContent.hero} />
@@
-      imageUrl={customStoryImg || siteBranding?.enhaLakPortalImageUrl}
+      imageUrl={customStoryImg || siteBranding?.enhaLakPortalImageUrl}
@@
-      imageUrl={siteBranding?.creativeWritingPortalImageUrl}
+      imageUrl={siteBranding?.creativeWritingPortalImageUrl}
```

### Patch B: Optimize the LCP hero image

```diff
diff --git a/apps/marketplace/src/features/portal/components/HeroSection.tsx b/apps/marketplace/src/features/portal/components/HeroSection.tsx
@@
+import Image from 'next/image';
@@
-      <img
-        src={backgroundUrl || 'https://placehold.co/1600x900/0f172a/ffffff?text=Alrehla'}
-        alt="hero-image"
-        className="absolute inset-0 w-full h-full object-cover"
-        fetchPriority="high"
-      />
+      <Image
+        src={backgroundUrl || '/images/hero-fallback.jpg'}
+        alt=""
+        aria-hidden="true"
+        fill
+        priority
+        fetchPriority="high"
+        sizes="100vw"
+        className="object-cover"
+      />
```

### Patch C: Enable image optimization

```diff
diff --git a/apps/marketplace/next.config.mjs b/apps/marketplace/next.config.mjs
@@
-  images: {
-    unoptimized: true,
-  },
+  images: {
+    unoptimized: false,
+    remotePatterns: [
+      { protocol: 'https', hostname: '*.supabase.co' },
+      { protocol: 'https', hostname: 'i.ibb.co' },
+      { protocol: 'https', hostname: 'placehold.co' },
+    ],
+  },
```

### Patch D: Add a narrow Home service

```ts
// packages/api/src/services/homeService.ts
export async function getHomePageData() {
  const [settings, posts, products, publishers] = await Promise.all([
    supabase
      .from('public_settings')
      .select('key,value')
      .in('key', ['portal_content', 'branding', 'communication_settings', 'social_links', 'maintenance_settings']),
    supabase
      .from('blog_posts')
      .select('id,slug,title,excerpt,cover_image_url,published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3),
    supabase
      .from('personalized_products')
      .select('id,key,title,image_url,is_active')
      .eq('is_active', true)
      .in('key', ['custom_story', 'subscription_box']),
    supabase
      .from('publisher_profiles')
      .select('id,slug,store_name,logo_url')
      .eq('is_active', true)
      .limit(8),
  ]);

  // Normalize errors and defaults here so components stay simple.
  return normalizeHomePageData({ settings, posts, products, publishers });
}
```

### Patch E: Add skip link and main landmark target

```diff
diff --git a/apps/marketplace/src/features/routing/MarketplaceShell.tsx b/apps/marketplace/src/features/routing/MarketplaceShell.tsx
@@
       <div className="flex flex-col min-h-screen" dir="rtl">
+        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-primary-700 focus:shadow-lg">
+          تخطي إلى المحتوى
+        </a>
@@
-        <main className="flex-grow">
+        <main id="main-content" className="flex-grow">
```

### Patch F: Expand root metadata

```ts
// apps/marketplace/src/app/layout.tsx
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alrehla.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'الرحلة | Alrehla',
    template: '%s | الرحلة',
  },
  description: 'منصة عربية تعليمية وإبداعية للقصص المخصصة وبرامج الكتابة الإبداعية.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: '/',
    siteName: 'الرحلة',
    title: 'الرحلة | Alrehla',
    description: 'منصة عربية تعليمية وإبداعية للقصص المخصصة وبرامج الكتابة الإبداعية.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'الرحلة | Alrehla',
    description: 'منصة عربية تعليمية وإبداعية للقصص المخصصة وبرامج الكتابة الإبداعية.',
  },
  robots: { index: true, follow: true },
};
```

## 10. Validation Checklist

### Build and Type Safety

- `pnpm --filter @alrehla/marketplace typecheck`
- `pnpm --filter @alrehla/marketplace build`
- Confirm no debug logs during build/render.

### Runtime

- `pnpm --filter @alrehla/marketplace start`
- Visit `/` in production mode.
- Check browser console for hydration errors and runtime errors.
- Check Network tab for duplicate `public_settings`/public data calls.

### Lighthouse / Core Web Vitals

- Run Lighthouse mobile and desktop after the build passes.
- Confirm LCP element is the optimized hero image.
- Confirm CLS is near zero.
- Compare JS transfer and image transfer before/after.

### Accessibility

- Keyboard-only navigation through header, menus, project cards, blog cards, footer, and floating actions.
- Escape closes menus and focus returns to trigger.
- Screen-reader labels exist for icon-only actions.
- Run axe or Lighthouse accessibility.

### SEO

- Inspect rendered HTML for canonical, OG, Twitter, lang, dir, and structured data.
- Validate sitemap and robots output.
- Test rich results for organization/site schema.

### Responsive / RTL

- Test 320, 375, 768, 1024, 1440px widths.
- Verify no floating buttons overlap key CTAs.
- Verify logical RTL spacing and focus outlines.

## Notes

No application source files were changed by this audit. The only recommended next step is Phase 0: fix the production build and make Home cacheable, then run real Lighthouse measurements.
