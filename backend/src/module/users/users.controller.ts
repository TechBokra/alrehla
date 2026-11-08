import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Header,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Protected by the global Better Auth guard. A valid session is required.
  @Get()
  @Header('Cache-Control', 'no-store')
  list(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) {
    if (page < 1 || page > 10000) {
      throw new BadRequestException('page must be between 1 and 10000');
    }
    return this.usersService.list(page);
  }
}
