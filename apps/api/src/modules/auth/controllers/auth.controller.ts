import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

@Controller('me')
export class AuthController {
  @Get()
  getCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }
}