import arcjet, { detectBot, fixedWindow, shield } from '@arcjet/node';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ArcjetService {
  private readonly logger = new Logger(ArcjetService.name);
  private readonly client: ReturnType<typeof arcjet>;

  constructor(configService: ConfigService) {
    const key = configService.getOrThrow<string>('ARCJET_KEY');

    if (key.startsWith('aj_prj_key_')) {
      throw new Error(
        'ARCJET_KEY is a project collector key. @arcjet/node requires a site or actor key starting with ajkey_.',
      );
    }

    if (!key.startsWith('ajkey_') || key === 'ajkey_yourkey') {
      throw new Error('Set ARCJET_KEY to a real Arcjet site or actor key before starting the app.');
    }

    this.client = arcjet({
      key,
      rules: [
        shield({ mode: 'LIVE' }),
        detectBot({ mode: 'LIVE', deny: ['CATEGORY:BOTNET'] }),
        fixedWindow({ mode: 'LIVE', window: '60s', max: 300 }),
      ],
    });
  }

  async protect(request: Request): Promise<void> {
    const decision = await this.client.protect(request);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
      }

      throw new ForbiddenException('Request denied by Arcjet');
    }

    if (decision.isErrored()) {
      this.logger.error(`Arcjet request evaluation failed: ${decision.reason.message}`);
    }
  }
}
