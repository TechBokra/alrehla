import { betterAuth } from 'better-auth';
import { authOptions } from './auth-options.js';

// Used by the Better Auth CLI to generate Prisma models without a database connection.
export const auth = betterAuth(authOptions);
