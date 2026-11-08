# Alrehla

Next.js frontend and NestJS API with Better Auth email/password authentication and a users directory backed by Prisma and PostgreSQL.

- [Frontend setup](frontend/README.md): signup, login, and users pages.
- [Backend setup](backend/README.md): NestJS, Prisma, Better Auth, and Arcjet.
- [Authentication integration](backend/docs/notes/better-auth-nestjs.md).

## Development

Install dependencies in each app (`npm install` in `frontend`, `pnpm install` in `backend`) and configure the local environment files using each app's `.env.example`.

Start the API with `pnpm start:dev` from `backend` (port 3000), then run `npm run dev` from `frontend` (port 3001).

## Production environment

Frontend, available at https://alrehla-web.alrehla.org:

```dotenv
NEXT_PUBLIC_BACKEND_URL=https://alrehla-api.alrehla.org
NODE_ENV=production
```

The public backend URL must be set before the Next.js build.

Backend, available at https://alrehla-api.alrehla.org:

```dotenv
BETTER_AUTH_URL=https://alrehla-api.alrehla.org
BETTER_AUTH_TRUSTED_ORIGINS=https://alrehla-web.alrehla.org/
NODE_ENV=production
```

Also configure `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `ARCJET_KEY` privately in the hosting environment. Never commit real environment files. Trusted-origin values have trailing slashes removed before CORS and Better Auth origin validation.

For cPanel AI App Hosting, deploy each app directory separately with Node.js 24. Use `pnpm build` / `node dist/main.js` for the backend and `npm run build` / `node server.js` for the frontend. Preserve the port supplied by the hosting platform.
