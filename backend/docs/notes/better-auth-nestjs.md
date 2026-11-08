# Better Auth in this NestJS app

Reviewed and implemented on 2026-11-07.

## Integration shape

The Better Auth MCP page describes connecting a documentation server to an editor or agent. It does not configure authentication in the application. This app uses Better Auth's separate [NestJS integration](https://www.better-auth.com/docs/integrations/nestjs), which is community maintained. The Nest package mounts the Better Auth endpoints and registers a global auth guard; `@AllowAnonymous()` marks routes that should remain public. Nest's built-in body parser must be disabled so Better Auth can read request bodies.

The package documentation shows synchronous `AuthModule.forRoot({ auth })`. Its installed types also provide `AuthModule.forRootAsync`, which lets this app construct Better Auth with its injected `PrismaService` and `ConfigService`. `src/lib/auth/auth.ts` builds the runtime instance; `src/lib/auth/auth-options.ts` shares feature settings with the CLI schema config; and `src/lib/auth/auth.schema.ts` lets the Better Auth CLI generate Prisma models without constructing a Nest application or opening a database connection.

## Database and schema

The app already uses Prisma 7 with PostgreSQL through Neon. The [Better Auth Prisma guide](https://www.better-auth.com/docs/adapters/prisma) passes a Prisma Client to `prismaAdapter` with `provider: "postgresql"`; the existing Prisma service is injected rather than creating another client or pool. The CLI's [Prisma generation mode](https://www.better-auth.com/docs/concepts/cli#generate-without-a-database-connection) updates `prisma/schema.prisma` but does not apply a migration. Prisma Client was regenerated, and a reviewable migration is at `prisma/migrations/20261107180000_add_better_auth/migration.sql`. It has not been applied to the database.

## Environment

`BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are loaded through Nest's `ConfigService`. `BETTER_AUTH_TRUSTED_ORIGINS` is optional and accepts comma-separated frontend origins. `.env.local` is ignored by Git; `.env.example` lists the required variables without secret values.

## First-party sources

- [MCP documentation server](https://www.better-auth.com/docs/ai-resources/mcp) — connects MCP-capable clients to Better Auth documentation.
- [NestJS integration](https://www.better-auth.com/docs/integrations/nestjs) — Nest module, body parser setting, global guard, and anonymous route decorator.
- [Prisma adapter](https://www.better-auth.com/docs/adapters/prisma) — Prisma 7 PostgreSQL setup and adapter configuration.
- [Better Auth CLI](https://www.better-auth.com/docs/concepts/cli) — Prisma schema generation without a database connection.
- [Nest integration package README](https://github.com/ThallesP/nestjs-better-auth/blob/master/README.md) — community package implementation details.

## Frontend integration — 2026-11-08

The [Next.js app](../../../frontend) now uses the [Better Auth React client](https://better-auth.com/docs/concepts/client) with `NEXT_PUBLIC_BACKEND_URL` pointing at this API's origin. It provides `/sign-up`, `/login`, and a session-protected `/users` directory. The NestJS `GET /users?page=1` route uses the injected `PrismaService`, selects only display fields, and returns at most 20 users per page. Any authenticated user can view the directory. It never returns account records, password hashes, or session tokens.

`getTrustedOrigins` shares the frontend origin allowlist between credentialed CORS and Better Auth's origin checks. Local development defaults to frontend `http://localhost:3001` and backend `http://localhost:3000`; production requires explicit trusted origins. Cookies are handled by Better Auth, and the client includes credentials on API requests.

The configured database migration status was checked on 2026-11-08 and reports up to date. No schema changes or duplicate user table were needed for this frontend integration. Browser verification covered signup, persisted sessions after reload, wrong-password errors, logout, and login after logout. API checks confirmed 401 for unauthenticated directory access, rejection of untrusted CORS origins, 400 for invalid pagination, and an allowlist of returned user fields.
