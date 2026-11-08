import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ArcjetInfrastructureModule } from './lib/arcjet/arcjet.module.js';
import { AuthInfrastructureModule } from './lib/auth/auth.module.js';
import { PrismaModule } from './lib/database/prisma.module.js';
import { UsersModule } from './module/users/users.module.js';

@Module({
  imports: [
    ArcjetInfrastructureModule,
    PrismaModule,
    AuthInfrastructureModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
