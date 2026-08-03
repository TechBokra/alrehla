# Alrehla Marketplace architecture and production-readiness review

Review date: 2026-08-01  
Scope: `apps/marketplace` plus the workspace packages and Supabase SQL directly used by it. The admin and student applications were inspected for shared-package compatibility, but were not redesigned.

Observed stack: Next.js 16.2.10 App Router, React 18.3.1 (the repository is not on React 19), TypeScript, Clerk, Supabase, TanStack Query, Cloudinary, Sentry 10.69.0, pnpm workspaces, and Turbo 2.10.3.

This report separates repository evidence from deployment facts that cannot be verified without a reachable Supabase project, Cloudinary account, Clerk Dashboard, Vercel configuration, and production traffic.

## ✅ Correctly Implemented

- The Marketplace is an App Router application with server layouts/pages and explicit client boundaries; it is not using `react-router-dom`, `BrowserRouter`, or raw `<img>` tags.
- Clerk is the active authentication authority. Marketplace Server Actions now resolve the request-scoped Clerk session, derive the linked Supabase profile, validate Zod input, enforce role/ownership, and return safe expected errors.
- The browser Supabase client is explicit and separate from the server-only entry point. Server actions use a request-scoped Clerk access-token provider, avoiding a shared mutable auth token.
- Supabase transport instrumentation records database, RPC, Storage, Auth, Realtime, and network failures as Sentry errors/spans without recording request bodies.
- `create_order_secure` and `create_booking_secure` remain authoritative database boundaries. The review fixes also align order pricing with `deliveryType`/`isPrinted`, validated add-ons, nested/flat shipping settings, instructor service/package rates, linked-student authorization, and normalized booking times.
- Checkout persistence is sequential, allowing deterministic cleanup of uploads when a later item fails. The former independent subscription insert was removed from the checkout path.
- All Marketplace mutation actions reachable from the app are now thin, validated Server Actions with targeted cache-tag invalidation. Direct notification mutations were moved behind actions.
- Public DTOs use explicit columns for instructors, packages, services, plans, publishers, and personalized products. The public publisher view is used for safe profile joins.
- Public blog/publisher reads are server-side, cached, parameterized, and use `notFound()`/record-specific metadata where implemented. The marketplace layout now server-bootstraps authenticated profile state before hydration, so the personalized marketplace shell is rendered dynamically rather than using the former homepage five-minute ISR path.
- Marketplace authentication is server-first: `(marketplace)/layout.tsx` and the sibling session layout call Clerk `auth()`, resolve the linked Supabase profile and child data through a server-only helper, and pass only a safe `AuthBootstrapState` DTO to one client `AuthProvider` per route tree. The protected layout no longer creates a second auth context, and the client skips the duplicate initial profile sync when the Clerk subject matches.
- Dynamic `robots.txt` and `sitemap.xml` are generated from `SITE_URL`/Vercel URL configuration and include published blog routes. The old hard-coded Vercel-host sitemap/robots files were removed.
- Missing metadata and loading states were added for blog and publisher detail routes; auth/account/diagnostic paths are excluded from crawling.
- Cloudinary child-profile authorization is now server-signed, purpose-scoped, profile-folder constrained, response-signature checked, and configured without exposing the API secret. Content-image uploads use a server-side signed uploader.
- Shared Sentry scrubbing removes authorization, cookies, secrets, JWTs, tokens, request bodies, sensitive headers, and email addresses from events, breadcrumbs, URLs, and contexts. User context is allow-listed to `id`, `email`, and `role`.
- Marketplace Sentry now has one browser initializer (`src/instrumentation-client.ts`); the duplicate `sentry.client.config.ts` initializer was removed. Server and Edge initialization is loaded by `src/instrumentation.ts`.
- Session Replay is instantiated only when the Sentry environment is explicitly `production`; all inputs/text/media are masked or blocked, and offline transport is enabled.
- Development Sentry is disabled unless `SENTRY_DEBUG=true`/`NEXT_PUBLIC_SENTRY_DEBUG=true` is explicitly opted in. Production/preview/staging events require a configured DSN and environment.
- Sentry source-map integration is present in `next.config.mjs`, deletes uploaded maps, supports release/org/project/auth-token variables, and has a non-fatal build error handler.
- The Marketplace no longer imports Clerk's deprecated `createRouteMatcher`; its proxy now only initializes Clerk request context, while protected pages enforce identity at the resource boundary.
- A Supabase `PGRST301` JWT-key failure observed during local development is now handled as a safe anonymous fallback instead of a 500 on public pages; the underlying Clerk Third-Party Auth dashboard configuration still requires correction before authenticated data can work.
- Production diagnostics and email simulation are disabled unless explicitly enabled in a non-production environment. Diagnostic pages are marked non-indexable.
- Turbo now has a root task graph with build/lint/typecheck dependencies and relevant environment inputs.
- Removed unreferenced Marketplace service/hook/component residue only after repository-wide import checks. Redundant client directives were removed from re-export barrels and static presentation modules.
- The review build completed successfully with Next/Turbopack, TypeScript, static generation, and route optimization.

## ⚠ Issues Found

### Critical / High

| Severity | File or deployment artifact | Explanation | Impact |
| --- | --- | --- | --- |
| High | `supabase/05_marketplace_integrity_hardening.sql` | This migration adds the missing `subscriptions.receipt_url`, normalizes booking times, replaces the broad subscription owner policy, and tightens notification/message/attachment relationships, but SQL deployment cannot be verified from this workspace. | Until migrations 03–05 are applied and checked in the target project, direct REST/RLS behavior may still be unsafe and subscription receipt uploads may fail. |
| High | `packages/api/src/services/storageService.ts`, `packages/api/src/services/bookingService.ts`, `packages/api/src/services/orderService.ts` | Receipts and session attachments are still persisted as signed URLs valid for `315360000` seconds. | A leaked bearer URL can remain usable for about ten years. A coordinated object-path/short-lived-signing migration across Marketplace/admin/student is still required. |
| High | `supabase/02_clerk_auth.sql` instructor policy/view | PostgreSQL RLS filters rows, not columns. The base `instructors_public_read` policy still allows full instructor rows to be selected directly, even though Marketplace DTOs now narrow the app query and `public_profiles` is safe. | Direct authenticated/anonymous REST clients may read email, user IDs, pending state, or rate metadata not intended for public users. A production-safe column-level view/RPC and grants change is still required. |
| High | `supabase/02_clerk_auth.sql` and checkout actions | Checkout now calculates more fields authoritatively, but there is no durable idempotency key or one database transaction spanning every cart item, upload, order, subscription, and booking. | Retries/double-clicks can still create duplicate business rows or leave partial cart state. Implement an idempotent checkout intent and one transactional RPC before enabling high-volume payments. |
| High | `apps/marketplace/src/features/checkout/templates/CheckoutPage.tsx` | Student requests now pass linked-student authorization to the secure RPC, but the database migration and end-to-end parent approval workflow cannot be exercised without the live backend. | A student request could still be rejected or fail to produce a reviewable parent request if the deployed SQL is older than this repository. |
| High | `supabase/00_setup.sql`, `supabase/02_clerk_auth.sql` | Owner `UPDATE` policies on orders/bookings/service orders are broader than the receipt/status operations the Marketplace needs. The new action checks reduce exposure, but direct REST mutation remains a database concern until column/state triggers or narrower RPC-only policies are deployed. | A user may attempt financial, ownership, or status mutations outside the UI. |
| High | `supabase/00_setup.sql`, `supabase/02_clerk_auth.sql` | Public support/join inserts use permissive `WITH CHECK (TRUE)` policies. Application actions validate fields, but direct anonymous REST requests bypass application rate limits. | Spam, abuse, and oversized/public payloads remain possible without platform rate limiting and a server-only intake path. |
| High | Supabase project / Clerk Third-Party Auth integration | Local development produced `PGRST301: No suitable key was found to decode the JWT` while resolving the server-bootstrapped profile. This is an external project configuration mismatch, not a token/template fallback that should be patched into the app. | Authenticated profile, child, and RLS-backed data cannot resolve until the Supabase project trusts the exact Clerk instance used by the app. Public pages now degrade safely to anonymous rendering, but signed-in features remain unavailable. |

### Medium / Low

| Severity | File or deployment artifact | Explanation | Impact |
| --- | --- | --- | --- |
| Medium | `apps/marketplace/src/hooks/queries/user/*`, `hooks/queries/public/useJitsiSettingsQuery.ts` | Private account/journey reads and a small amount of public settings/Jitsi data still use browser Supabase queries. | Initial private rendering remains client-waterfall based and depends on RLS correctness; it is not yet a pure Server Component → server service path. |
| Medium | `apps/marketplace/src/app/(marketplace)/layout.tsx` | The single server-first auth bootstrap calls Clerk `auth()` for the complete marketplace shell, including public pages. | All routes under this group are dynamic, so the previous homepage/public ISR benefit is lost. If public caching is required, split the public shell from an authenticated shell and keep user-aware UI behind the latter. |
| Medium | `apps/marketplace/src/lib/router-compat.tsx` (40 importers) | Compatibility navigation remains active for legacy interactive flows. | URL/search-param state and direct deep-link semantics are harder to reason about, and the layer keeps some templates client-bound. |
| Medium | Marketplace client boundary set | Final scan contains 85 explicit client modules in Marketplace and 14 in directly used `packages/ui`. Thirty-one route pages still declare `force-dynamic`, mostly private/interactive or backend-dependent routes. | Hydration and JavaScript cost remain higher than a fully server-seeded architecture. |
| Medium | `packages/api/src/services/publicService.ts` | `getBlogPosts()` and several admin/reporting services still use `select('*')`; the broad public aggregate has been narrowed for most domains but remains a large multi-domain request at 22 call sites. | Over-fetching and DTO drift remain for some routes and staff-only code paths. |
| Medium | `apps/marketplace/src/components/shared/AlrehlaImage` callers | All current images have alt text, but 28 of the inspected 37 image tags lack explicit intrinsic dimensions/sizes. | Some images may choose oversized responsive candidates or shift layout. |
| Medium | `apps/marketplace/src/features/checkout/templates/CheckoutPage.tsx` | Upload rollback is deterministic for failed items, but uploaded objects still use the long-lived URL contract and successful checkout does not have a compensating transaction for all persisted records. | Orphaned/overexposed payment assets remain possible during partial failures. |
| Medium | `apps/marketplace/.env` and deployment settings | Local environment values exist, but production DSN/org/project/auth-token, `SITE_URL`, Cloudinary signed secret/preset, WAF/rate limits, and Clerk/Supabase JWT settings are not verifiable from source. | Source review cannot prove production source-map upload, canonical URLs, signed upload operation, RLS behavior, or external auth configuration. |
| Low | Framework baseline | The repository uses React 18.3.1, despite the requested project context naming React 19. | React 19 compatibility and the latest React-specific Sentry behavior are not being exercised. Upgrade only with a separate dependency/test plan. |
| Low | Monorepo scope | Admin-panel Sentry files and unrelated pre-existing dirty-worktree changes were not rewritten as part of this Marketplace review. | A separate admin/student production-readiness pass is still needed. |
| Medium | `supabase/00_setup_and_auth.sql` | This parallel combined SQL file contains overlapping schema/auth/RPC definitions and is not the documented deployment path (`00_setup.sql` → `01_seed.sql` → `02_clerk_auth.sql` → 03–05). | Deploying the legacy file alone can diverge from the hardened functions and policies reviewed here; it must be retired or brought to parity before anyone uses it. |

## 🔧 Required Fixes

### Implemented in this review

1. Added `turbo.json` and documented the workspace task graph.
2. Added request-scoped Clerk/Supabase action security, Zod schemas, safe errors, ownership checks, and cache-tag invalidation across Marketplace actions.
3. Converted selected public routes to server reads/metadata/loading states, added canonical URL helpers, dynamic sitemap/robots, and removed stale static SEO files.
4. Removed redundant client directives and unreachable Marketplace residue after repository-wide import verification.
5. Replaced active Vite environment fallbacks in directly used Next/shared packages.
6. Added server-signed Cloudinary upload authorization and validated Cloudinary response metadata/signatures.
7. Added the missing secure subscription create/status/receipt RPCs and corrected server pricing inputs for printed/electronic delivery, add-ons, nested shipping settings, instructor service/package rates, and linked student checkout/booking authorization.
8. Normalized booking times in action validation and the database, and added a normalized active-slot unique index.
9. Added `supabase/05_marketplace_integrity_hardening.sql` for subscription receipt schema and relationship/RLS hardening; updated README deployment order.
10. Removed duplicate Marketplace browser Sentry initialization, upgraded workspace Sentry packages to stable 10.69.0, restricted Replay to production, disabled local event sending unless explicitly opted in, and retained scrubbing/offline transport/source-map configuration.
11. Hardened dashboard redirect validation and development-only email simulation.
12. Added server-first Marketplace auth bootstrap with a server-only Clerk/Supabase resolver, safe client DTO, one `AuthProvider` per route tree, and duplicate-sync/session-switch protection.
13. Added a server bootstrap fallback for Supabase JWT-key configuration failures, added the session route-group provider, and removed Marketplace's deprecated `createRouteMatcher` import.

### Required before production sign-off

1. Apply SQL files 03, 04, and 05 to a staging project, resolve any duplicate-slot preflight, and run authenticated/anonymous RLS tests for profiles, instructors, subscriptions, orders, bookings, messages, attachments, notifications, storage, support, and join requests.
2. Replace persisted signed URLs with object paths plus short-lived ownership-checked delivery; backfill existing receipt/session attachment records and coordinate all panels.
3. Introduce checkout intent/idempotency keys and one transactional server/RPC workflow with compensating cleanup for uploads.
4. Replace the public instructor table policy with a safe column-limited view/RPC and revoke direct public table reads.
5. Add server-side rate limiting/anti-abuse controls for public support/join intake and upload endpoints.
6. Configure and verify production `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, `SITE_URL`, Cloudinary secret/preset, Clerk third-party JWT settings, Supabase RLS, WAF, CSP, and CDN behavior.
7. In the Supabase Dashboard, add/verify the native Clerk Third-Party Auth integration for the exact Clerk instance and Supabase project used by Marketplace; do not introduce a legacy JWT template or Supabase JWT secret workaround.
8. Run real staging checkout, subscription receipt, booking conflict, linked-student approval, Cloudinary, Storage, Realtime, email, and Sentry smoke tests.

## 💡 Recommended Improvements

- Migrate remaining `router-compat` callers to `next/link`, `next/navigation`, and URL state; preserve existing workflow state during each route migration.
- Add Clerk's resource-protection ESLint rule to CI so newly added protected pages, Route Handlers, and Server Actions cannot omit their own auth checks.
- Server-seed account/journey data and retain TanStack Query only for live Realtime/polling and mutation UX. Include profile identity in every private query key and clear private caches on identity changes.
- If public ISR becomes a priority again, split the dynamic authenticated shell from static public route layouts instead of reintroducing a client-side auth waterfall.
- Split `getAllPublicData` into domain DTOs and replace remaining public/admin `select('*')` queries with explicit columns.
- Add accurate image dimensions/sizes and a server-compatible image component; model Cloudinary assets as typed records instead of mixed URL/JSON strings.
- Add route-level `loading.tsx`, `error.tsx`, and metadata to remaining high-traffic public pages.
- Add automated SQL/RLS tests and Playwright smoke tests for auth redirects, 404s, checkout retries, booking conflicts, uploads, and student/parent flows.
- Add dependency update automation and a lockfile policy that rejects mixed Sentry SDK versions.
- Upgrade React only after validating Clerk, Sentry, Radix, TanStack Query, and all shared UI packages together.

## ⭐ Best Practices

- Keep authentication and authorization on the server; treat Clerk identity, database role, ownership, and RLS as separate checks.
- Treat all browser values, totals, file names, URLs, and role hints as untrusted input.
- Use short-lived private asset delivery and never persist bearer URLs when an object path is sufficient.
- Use explicit cache tags for public data and never place user, cart, order, child, session, permission, or payment data in shared caches.
- Keep Sentry `sendDefaultPii: false`, allow-list user context, scrub request headers/query/body/breadcrumbs, and fail closed if sanitization fails.
- Use one Sentry initializer per runtime, production-only Replay with full input/text/media masking, offline transport, bounded sampling, and a documented local debug opt-in.
- Upload source maps only from trusted CI with an auth token; delete local build maps after upload and verify a production event resolves to source lines.
- Make diagnostic routes unreachable in production and keep analytics behavior independent from monitoring transport failures.
- Add idempotency to payment/order mutations and database uniqueness to every externally bookable slot.

## Verification record

The following checks were run after the focused changes:

| Check | Result |
| --- | --- |
| `pnpm --filter @alrehla/marketplace lint` | Passed (exit 0). |
| `pnpm --filter @alrehla/marketplace typecheck` | Passed (exit 0). |
| `pnpm --filter @alrehla/marketplace build` | Passed (Next 16.2.10/Turbopack; TypeScript and static generation completed). |
| `pnpm exec turbo run lint --filter=@alrehla/marketplace --dry=json` | Passed; 7 tasks resolved from the new root graph. |
| `git diff --check` | Passed after fixing trailing whitespace in checkout/order files. |
| Marketplace client count | 85 explicit client modules; 14 directly used shared UI client modules. |
| Marketplace route scan | 31 pages still force dynamic; 40 router-compat importers; 22 public-data call sites. |
| Image scan | No raw `<img>`/direct `next/image`; 37 shared image tags, all with alt text; 28 need explicit dimensions/sizes. |
| Active Vite scan | No `import.meta.env`/`VITE_*` in Marketplace, `packages/api`, or `packages/config` active source. |
| Dependency check | `npm view` reported `@sentry/nextjs`, `@sentry/browser`, and `@sentry/core` 10.69.0; workspace manifests and lockfile were aligned to 10.69.0. |
| Production HTTP smoke test | Previously verified `/` and `/blog` 200, protected `/account` and `/checkout` redirects, diagnostics 404, and Cloudinary signature GET 405. The reported local development request now returns `/` 200 after the PGRST301-safe fallback; authenticated profile resolution remains deployment-blocked until Clerk Third-Party Auth is configured. |
| External integrations | Supabase host resolution failed in this environment; live RLS, Clerk, Cloudinary, Storage, email, Realtime, Sentry ingestion, source-map resolution, production cache, WAF, CSP, and analytics behavior could not be verified. The local runtime did reach Supabase far enough to report `PGRST301`, proving the current project/key trust configuration is not usable for the Clerk session. No local `psql`/Supabase CLI was available to execute the SQL migrations. |

## Architecture checklist (24 requested items)

1. **Repository inspection:** root/workspace files, Marketplace App Router, shared packages, Supabase SQL, Sentry, Cloudinary, actions, hooks, services, images, and public assets were inspected.
2. **Legacy patterns:** Vite fallbacks and redundant client barrels were removed; `router-compat` remains and is explicitly tracked.
3. **Server Components converted:** public blog/publisher and selected public shells now fetch on the server; private/interactive routes remain client-capable where needed.
4. **Client components and reasons:** forms, dialogs, cart/checkout, booking, uploads, Clerk callbacks, Realtime, Jitsi, clipboard/offline behavior, and error boundaries remain client; static barrels/presentation were demoted.
5. **Server initial fetching:** Clerk identity, linked profile, and child data are now server-bootstrapped in the marketplace layout; blog/publisher reads use server services and cache/metadata where available; account/journey/private feature data still has browser-query gaps.
6. **Direct browser Supabase:** still present for private account/journey and Jitsi/settings reads; business mutations are now action-backed.
7. **Server Actions:** Marketplace mutations are authenticated, role-checked, Zod-validated, ownership-checked, and safely invalidated.
8. **Route Handlers:** Cloudinary signature is authenticated/no-store; email simulation and Sentry diagnostics are non-production gated; no business mutation bypass was accepted.
9. **Auth/authz:** Clerk request identity, linked profile, role, ownership, secure RPC checks, and RLS are layered; deployment must apply migrations.
10. **Cache policy:** public data functions still use `unstable_cache`/tags where applicable, but the enclosing marketplace layout is request-dynamic because it reads auth state; private/payment/session data is not intentionally shared. A public/authenticated layout split is the follow-up if ISR must be restored.
11. **Tags/invalidation:** Server Actions call `revalidateTag` for affected domains; exact production cache hit behavior is not verifiable.
12. **Private data sharing:** no deliberate shared cache of account/cart/orders/children/sessions/permissions/payment data was found; browser caches still need identity-key hardening in remaining hooks.
13. **TanStack usage:** retained for client mutation/live UX; still used too broadly for initial private/public reads.
14. **Cloudinary/image components:** signed authorization and response validation are implemented; shared image wrappers are used.
15. **Raw images:** no raw `<img>` or direct `next/image` in Marketplace source; dimensions/sizes remain incomplete.
16. **Upload security:** Cloudinary signed uploads and server validation are improved; Supabase Storage currently uses long-lived signed URLs and needs migration.
17. **Secrets/public env:** only public DSNs/cloud name/publishable values are client-eligible; Clerk secret, Cloudinary secret, Sentry auth token, and Supabase server token are server/CI-only. Actual deployment exposure cannot be verified.
18. **SEO:** dynamic robots/sitemap, canonical helper, metadata/loading/notFound work are present; production canonical output requires `SITE_URL`.
19. **Performance:** Turbo/build, route splitting, image wrapper, and removed residue help; server-first auth removes the initial profile waterfall but makes the marketplace shell dynamic, while broad queries, 85 client modules, 31 source-level `force-dynamic` pages, and router compatibility remain.
20. **Files:** unreferenced Marketplace residue was removed after import checks; active service/action and package paths are documented by this report.
21. **Verification commands:** lint, typecheck, build, Turbo dry graph, dependency version check, scans, and earlier HTTP smoke checks are recorded above.
22. **Every command result:** failures/limits are recorded rather than inferred; `git diff --check` had fixable whitespace findings; network-backed install initially failed in sandbox and succeeded with approved escalation.
23. **Remaining risks:** deployment SQL, Storage URL migration, instructor public columns, checkout idempotency/atomicity, public intake rate limits, Clerk/Supabase Third-Party Auth trust configuration, CI enforcement for future resource checks, external settings, and React 19 compatibility remain.
24. **Next steps:** apply/test migrations in staging, complete secure asset/idempotent checkout migrations, configure production env/WAF/CSP, run end-to-end smoke tests, then repeat the review against deployed behavior.

## Client-component disposition

### Must remain client

`app/error.tsx`, `app/global-error.tsx`, `app/providers.tsx`, `app/sso-callback/page.tsx`, `AuthContext`, `CartContext`, `ToastContext`, `router-compat` callers, auth/account forms and dialogs, cart/checkout/order/booking workflows, uploads, notifications/Realtime, Jitsi/session UI, offline/clipboard/share controls, Clerk components, Radix/RHF primitives, the Sentry error boundary, and stateful image/toast components.

### Server shells or server-rendered candidates

Public read-only/about/blog/creative-writing/instructor/publisher/Enha Lak/privacy/terms pages, footer/WhatsApp/configuration content, protected profile resolution, and interactive account/checkout/booking/store/subscription/service shells should continue moving toward server shells with small client islands.

### Redundant directives removed

Feature re-export barrels and static presentation modules including `account/ChildCard.tsx`, `account/EmptyState.tsx`, `creative-writing/booking/CalendarSelection.tsx`, `header/MobileMenu.tsx`, `header/NavItem.tsx`, `header/NotificationDropdown.tsx`, `order/AddonsSection.tsx`, `order/InteractivePreview.tsx`, `shared/SupportForm.tsx`, and `subscription/SubscriptionSummary.tsx` no longer carry unnecessary client directives. The import topology caveat remains: a server parent importing a client child still creates a client boundary.
