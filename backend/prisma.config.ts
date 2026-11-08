import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadEnv({ path: '.env.local' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma CLI schema changes use Neon’s direct URL; the app uses pooled DATABASE_URL.
    // Keep this optional so `prisma generate` can run before local DB URLs are configured.
    url: process.env.DATABASE_URL_UNPOOLED ?? '',
  },
});
