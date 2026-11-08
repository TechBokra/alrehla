import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ArcjetRequestGuard } from '../../common/guards/arcjet-request.guard.js';
import { ArcjetService } from './arcjet.service.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
  ],
  providers: [
    ArcjetService,
    {
      provide: APP_GUARD,
      useClass: ArcjetRequestGuard,
    },
  ],
  exports: [ArcjetService],
})
export class ArcjetInfrastructureModule {}
