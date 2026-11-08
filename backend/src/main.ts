import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { getTrustedOrigins } from './lib/auth/trusted-origins.js';
import 'dotenv/config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);
  app.enableCors({
    origin: getTrustedOrigins(config),
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });
  app.enableShutdownHooks();
  await app.listen(config.get<string>('PORT') ?? 3000);
}
await bootstrap();
