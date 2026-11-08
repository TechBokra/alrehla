import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../../generated/prisma/client.js';
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly databaseUrl: string | undefined;

  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    super({
      adapter: new PrismaNeon({ connectionString: databaseUrl ?? '' }),
    });

    this.databaseUrl = databaseUrl;
  }

  async onModuleInit(): Promise<void> {
    if (!this.databaseUrl) {
      this.logger.warn(
        'DATABASE_URL is not set; Prisma connection was skipped. Add the Neon pooled URL before using database features.',
      );
      return;
    }

    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
