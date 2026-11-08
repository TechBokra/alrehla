import type { ConfigService } from '@nestjs/config';

// Share the allowlist between Better Auth's CSRF checks and browser CORS.
export function getTrustedOrigins(config: ConfigService): string[] {
  const configured = config
    .get<string>('BETTER_AUTH_TRUSTED_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return configured?.length
    ? configured
    : config.get<string>('NODE_ENV') === 'production'
      ? []
      : ['http://localhost:3001'];
}
