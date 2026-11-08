import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { PrismaModule } from '../database/prisma.module.js';
import { PrismaService } from '../database/prisma.service.js';
import { createAuth } from './auth.js';

@Global()
@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      imports: [ConfigModule, PrismaModule],
      inject: [PrismaService, ConfigService],
      useFactory: (prisma: PrismaService, configService: ConfigService) => ({
        auth: createAuth(prisma, configService),
      }),
      isGlobal: true,
    }),
  ],
  exports: [BetterAuthModule],
})
export class AuthInfrastructureModule {}
