import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';

import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

import { PrescriptionsService } from '../services/prescriptions.service';

@Controller('prescriptions')
@Roles('patient')
export class PatientPrescriptionsController {
  constructor(
    private readonly prescriptionsService: PrescriptionsService,
  ) {}

  @Get('me')
  async getMyPrescriptions(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prescriptionsService.getMyPrescriptions(user);
  }
}