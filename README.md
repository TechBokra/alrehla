# Alrehla Workspace

Alrehla is an Arabic educational marketplace and learning platform organized as a pnpm monorepo. The public marketplace now runs on Next.js App Router, while the admin panel remains a separate Vite app. Shared UI, API, auth, types, config, and utility code live in workspace packages.

## Workspace Structure

```text
alrehla-workspace/
├── apps/
│   ├── marketplace/      # Next.js public site, store, checkout, parent/student flows
│   └── admin-panel/      # Separate React/Vite admin, reporting, settings, and ops app
├── packages/
│   ├── ui/               # Shared presentational components only
│   ├── api/              # Supabase client and database/API services
│   ├── auth/             # Roles, permissions, RBAC helpers
│   ├── types/            # Shared domain and generated database types
│   ├── config/           # Shared constants and app configuration
│   └── utils/            # Date, money, text, slug, validation helpers
├── supabase/             # Reusable setup and seed SQL files
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

The marketplace is a Next.js App Router application with React, TypeScript, Tailwind CSS, TanStack Query, Supabase Auth, and shared workspace packages. It contains the public Arabic portal, blog/content pages, Enha Lak store, personalized story ordering flow, creative writing booking flow, cart and checkout, parent account area, and student/session pages.

The marketplace does not own admin routes. Staff/admin links should open the separate admin panel using `NEXT_PUBLIC_ADMIN_PANEL_URL`.

### `apps/admin-panel`

The admin panel remains a separate React/Vite application on its own port. It contains admin, instructor, publisher, reporting, audit, settings, scheduling, financial, and product management pages. Frontend route guards use shared RBAC helpers from `packages/auth`; Supabase RLS and backend policies remain the source of truth for data authorization.

## Shared Packages

- `@alrehla/ui`: shared Button, Input, Modal, Table, Badge/Card-style primitives, Toast, loading/error components, and other presentational UI. No Supabase or business data access belongs here.
- `@alrehla/api`: Supabase client plus auth, user, order, booking, content, reporting, settings, storage, communication, and admin-facing services.
- `@alrehla/auth`: role definitions, permission matrix, and helpers such as `hasPermission`, `isAdminRole`, and `canAccessAdmin`.
- `@alrehla/types`: generated Supabase database types and shared domain models.
- `@alrehla/config`: shared constants, environment-backed config, and reusable seed/mock configuration.
- `@alrehla/utils`: formatting, validation, pricing, Arabic text, date, and helper functions.

## Environment Files

Each app owns its own environment file:

```text
apps/marketplace/.env.local
apps/admin-panel/.env
```

Marketplace Next.js variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
NEXT_PUBLIC_ADMIN_PANEL_URL=http://localhost:3001
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

An example file is provided at `apps/marketplace/.env.local.example`.

Admin panel Vite variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

## Setup

Use pnpm for the workspace:

```bash
pnpm install
```

## Scripts

```bash
pnpm dev                # run all dev apps through Turbo
pnpm dev:marketplace    # Next marketplace on port 3000
pnpm dev:admin          # Vite admin panel on port 3001
pnpm build              # build all apps/packages
pnpm lint               # lint all apps/packages
pnpm typecheck          # typecheck all apps/packages
```

You can also run scripts inside a specific app:

```bash
pnpm --filter @alrehla/marketplace dev
pnpm --filter @alrehla/admin-panel dev
```

## Marketplace Migration Notes

The previous Vite marketplace was preserved under `backups/marketplace-vite-2026-07-05`. The active marketplace no longer uses `index.html`, `vite.config.ts`, `src/index.tsx`, or React Router route declarations. Routes live under `apps/marketplace/src/app`, and migrated feature pages live under `apps/marketplace/src/features`.

Supabase and service access should stay in `packages/api`. Keep marketplace components focused on UI, hooks, and route composition.

## Database

Supabase SQL files live in `supabase/`:

- `00_setup.sql`: reusable schema, functions, policies, and storage setup
- `01_seed.sql`: reusable seed content and demo data
- `02_clerk_auth.sql`: Clerk third-party JWT mapping, profile sync, and Clerk-compatible RLS policies

For a Clerk-enabled Supabase project, run `00_setup.sql`, then `01_seed.sql`,
then `02_clerk_auth.sql`. The last migration is required because Clerk subject
IDs are strings while Alrehla keeps UUIDs for internal profile relationships.
Use the same Clerk instance and Supabase project variables in marketplace and
student-panel; each app has its own `.env.local.example` template.

Do not enforce admin security only in React. Supabase RLS and database policies remain the source of truth for data access.
# alrehla
