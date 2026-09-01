import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const root = dirname(fileURLToPath(import.meta.url));
const fromRoot = (path: string) => resolve(root, path);

export default defineConfig({
  resolve: {
    alias: [
      { find: '@alrehla/admin-core/resource', replacement: fromRoot('../../packages/admin-core/src/resource/index.ts') },
      { find: '@alrehla/admin-core/navigation', replacement: fromRoot('../../packages/admin-core/src/navigation/index.ts') },
      { find: '@alrehla/admin-core', replacement: fromRoot('../../packages/admin-core/src/index.ts') },
      { find: '@alrehla/mutations', replacement: fromRoot('../../packages/mutations/src/index.ts') },
      { find: '@alrehla/types', replacement: fromRoot('../../packages/types/src/index.ts') },
      { find: '@alrehla/ui', replacement: fromRoot('../../packages/ui/src/index.ts') },
      { find: '@alrehla/api', replacement: fromRoot('../../packages/api/src/index.ts') },
      { find: '@alrehla/supabase/public', replacement: fromRoot('../../packages/supabase/src/public.ts') },
      { find: '@alrehla/utils', replacement: fromRoot('../../packages/utils/src/index.ts') },
      { find: '@', replacement: fromRoot('./src') },
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
  },
});
