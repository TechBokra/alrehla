import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ArcjetService } from '../../lib/arcjet/arcjet.service.js';
import type { Request } from 'express';

@Injectable()
export class ArcjetRequestGuard implements CanActivate {
  constructor(private readonly arcjetService: ArcjetService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    await this.arcjetService.protect(request);

    return true;
  }
}
