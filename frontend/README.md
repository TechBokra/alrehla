# Alrehla frontend

Next.js frontend with three pages: `/sign-up`, `/login`, and `/users`. The root redirects to `/login`.

## Local setup

1. Install frontend dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` (a local file is already provided). Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:3000` to the NestJS backend origin, without `/api/auth`.
3. In the backend, set the database URLs, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3000`, and `BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3001`. The backend's existing Prisma migration creates Better Auth's `user`, `account`, `session`, and `verification` tables. Check migrations with `pnpm exec prisma migrate status`; apply pending migrations with `pnpm db:migrate:deploy`.
4. Start the backend with `pnpm start:dev` from `../backend`.
5. Run `npm run dev` here, then open http://localhost:3001/sign-up.

Signup creates a user through Better Auth and signs them in. Login opens the users directory. All signed-in users can see this directory; it is not an admin-only feature. The API returns names, email addresses, email verification status, and join dates, with 20 users per page. Account credentials and session tokens are never included in the directory response. Logout invalidates the backend session.

## Backend connection

- `lib/backend.ts`: backend origin and credentialed fetch helper.
- `lib/auth-client.ts`: Better Auth React client for the NestJS `/api/auth` endpoints.
- `lib/users.ts`: typed access to the protected `GET /users?page=1` route.

The browser sends HttpOnly session cookies with requests; no tokens are stored in local storage. The backend validates sessions for the users endpoint even if someone bypasses the UI.

## Deployment

Set `NEXT_PUBLIC_BACKEND_URL` before building; Next.js embeds it in the browser bundle. Set the backend's `BETTER_AUTH_URL` to its public HTTPS origin and `BETTER_AUTH_TRUSTED_ORIGINS` to the frontend HTTPS origin. Multiple trusted origins can be comma-separated. Use the same hostname locally (`localhost` on both ports). This direct cookie setup expects frontend and backend on the same site, such as `alrehla-web.alrehla.org` and `alrehla-api.alrehla.org`; unrelated domains require a same-site reverse proxy or a separate cookie policy.

`npm run build` builds the app. `npm start` uses the existing hosting entrypoint, which takes its port from `PORT` (defaults to 3000); set `PORT=3001` if running production builds locally alongside the backend.

## Documentation

- [Better Auth React client](https://better-auth.com/docs/concepts/client)
- [Email and password](https://better-auth.com/docs/authentication/email-password)
- [NestJS integration](https://better-auth.com/docs/integrations/nestjs)
- [Prisma adapter](https://better-auth.com/docs/adapters/prisma)
