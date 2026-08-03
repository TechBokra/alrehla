# Alrehla Workspace

Alrehla is an Arabic educational marketplace and learning platform organized as a pnpm monorepo. The public marketplace, admin panel, and student panel run on Next.js App Router. Shared UI, API, auth, Supabase clients, types, config, and utility code live in workspace packages.

## Workspace Structure

```text
alrehla-workspace/
├── apps/
│   ├── marketplace/      # Next.js public site, store, checkout, parent/student flows (port 3000)
│   ├── admin-panel/      # Next.js admin, reporting, settings, and ops app (port 3001)
│   └── student-panel/    # Next.js student dashboard and session portal (port 3002)
├── packages/
│   ├── ui/               # Shared presentational components only
│   ├── api/              # Supabase client and database/API services
│   ├── supabase/         # Public, Clerk-server, and secret-key client boundaries
│   ├── auth/             # Roles, permissions, RBAC helpers
│   ├── types/            # Shared domain and generated database types
│   ├── config/           # Shared constants and app configuration
│   └── utils/            # Date, money, text, slug, validation helpers
├── supabase/             # Reusable setup, seed, and Clerk SQL files
├── backups/              # Local migration backups, ignored by git
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── eslint.config.js
└── prettier.config.js
```

## Apps

### `apps/marketplace`

The marketplace is a Next.js App Router application (port 3000) built with React, TypeScript, Tailwind CSS, TanStack Query, Supabase, Clerk Auth, Sentry, and shared workspace packages. It contains the public Arabic portal, blog/content pages, Enha Lak store, personalized story ordering flow, creative writing booking flow, cart and checkout, parent account area, and student/session pages.

The marketplace does not own admin routes. Staff/admin links open the separate admin panel using `NEXT_PUBLIC_ADMIN_PANEL_URL`.

### `apps/admin-panel`

The admin panel is a separate Next.js application running on port 3001. It contains admin, instructor, publisher, reporting, audit, settings, scheduling, financial, and product management pages. Frontend route guards use shared RBAC helpers from `packages/auth`; Supabase RLS and backend policies remain the source of truth for data authorization.

### `apps/student-panel`

The student panel is a dedicated Next.js App Router application running on port 3002. It serves student learning dashboards, session bookings, and course materials, integrating Clerk authentication with Supabase backend data services.

## Shared Packages

- `@alrehla/ui`: shared Button, Input, Modal, Table, Badge/Card-style primitives, Toast, loading/error components, and other presentational UI. No Supabase or business data access belongs here.
- `@alrehla/api`: Supabase client plus auth, user, order, booking, content, reporting, settings, storage, communication, and admin-facing services.
- `@alrehla/supabase`: publishable browser client, Clerk-token server client, and secret-key-only admin client boundaries.
- `@alrehla/auth`: role definitions, permission matrix, and helpers such as `hasPermission`, `isAdminRole`, and `canAccessAdmin`.
- `@alrehla/types`: generated Supabase database types and shared domain models.
- `@alrehla/config`: shared constants, environment-backed config, and reusable seed/mock configuration.
- `@alrehla/utils`: formatting, validation, pricing, Arabic text, date, and helper functions.

## Environment Files

Each app owns its own environment file:

```text
apps/marketplace/.env.local
apps/admin-panel/.env
apps/student-panel/.env.local
```

### Marketplace (`apps/marketplace/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
NEXT_PUBLIC_ADMIN_PANEL_URL=http://localhost:3001
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
SUPABASE_SECRET_KEY=your_supabase_secret_key

# Sentry Monitoring
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=development
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

An example template is provided at `apps/marketplace/.env.local.example`.

### Admin Panel (`apps/admin-panel/.env`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
SUPABASE_SECRET_KEY=your_supabase_secret_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### Student Panel (`apps/student-panel/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_MARKETPLACE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_PANEL_URL=http://localhost:3001
NEXT_PUBLIC_STUDENT_PANEL_URL=http://localhost:3002

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

An example template is provided at `apps/student-panel/.env.local.example`.
The admin template is `apps/admin-panel/.env.local.example`.

## Setup

Use pnpm for the workspace:

```bash
pnpm install
```

## Scripts

```bash
pnpm dev                # run all dev apps through Turbo
pnpm dev:marketplace    # Next marketplace on port 3000
pnpm dev:admin          # Next admin panel on port 3001
pnpm dev:student        # Next student panel on port 3002
pnpm build              # build all apps/packages
pnpm build:marketplace  # build Next marketplace
pnpm build:admin        # build Next admin panel
pnpm build:student      # build Next student panel
pnpm lint               # lint all apps/packages
pnpm typecheck          # typecheck all apps/packages
```

You can also run scripts inside a specific app:

```bash
pnpm --filter @alrehla/marketplace dev
pnpm --filter @alrehla/admin-panel dev
pnpm --filter @alrehla/student-panel dev
```

## Sentry Monitoring

Sentry error tracking and performance monitoring are integrated into `@alrehla/marketplace`:
- **Client Configuration**: `apps/marketplace/sentry.client.config.ts` handles browser runtime error capturing and session replay.
- **Server Configuration**: `apps/marketplace/sentry.server.config.ts` handles server-side error capturing in Next.js Server Components and API routes.
- **Edge Configuration**: `apps/marketplace/sentry.edge.config.ts` handles Edge runtime error capture.
- **Build Integration**: `apps/marketplace/next.config.mjs` wraps the Next.js config with `withSentryConfig` for automatic source map upload when `SENTRY_AUTH_TOKEN` is supplied.

## Marketplace Migration Notes

The previous Vite marketplace was preserved under `backups/marketplace-vite-2026-07-05`. The active marketplace no longer uses `index.html`, `vite.config.ts`, `src/index.tsx`, or React Router route declarations. Routes live under `apps/marketplace/src/app`, and migrated feature pages live under `apps/marketplace/src/features`.

Supabase and service access should stay in `packages/api`. Keep marketplace components focused on UI, hooks, and route composition.

## Database & Authentication

Supabase SQL files live in `supabase/`:

- `schema.sql`: unified baseline schema, functions, RLS policies, Clerk auth integration, and role security hardening
- `seed.sql`: canonical catalog seed content and demo data
- `migrations/202608010001_identity_and_security_hardening.sql`: timestamped corrective migration for existing databases
- `migrations/202608020001_fix_parent_managed_student_profile_id.sql`: repairs legacy `profiles.id` defaults and explicitly generates managed-student profile UUIDs
- `migrations/202608020002_remove_create_order_secure_integer_overload.sql`: removes the legacy integer RPC overload that makes order creation ambiguous
- `tests/rls_identity.sql`: SQL assertions for RLS and protected identity/role privileges

For a fresh Clerk-enabled Supabase project, run `schema.sql` to initialize all tables, functions, and RLS policies, then run `seed.sql` to load default catalog data. For existing deployments that have already applied the legacy setup scripts (`00`–`05`), apply the corrective migrations in timestamp order.

Use the same Clerk instance and Supabase project variables in `marketplace` and `student-panel`. Configure Clerk’s Supabase Third-Party Auth integration for that project, then set `CLERK_WEBHOOK_SIGNING_SECRET` and `SUPABASE_SECRET_KEY` only in trusted server environments. Do not use `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, or a custom Supabase JWT template.

Do not enforce admin security only in React. Supabase RLS and database policies remain the source of truth for data access.
