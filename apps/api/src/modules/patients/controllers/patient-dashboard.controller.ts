import {
  Controller,
  Get,
} from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { Roles } from '../../../common/decorators/roles.decorator';

import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

import { PatientDashboardService } from '../services/patient-dashboard.service';

@Controller('patients/me/dashboard')
@Roles('patient')
export class PatientDashboardController {
  constructor(
    private readonly dashboardService: PatientDashboardService,
  ) {}

  @Get()
  getDashboard(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dashboardService.getDashboard(user);
  }
}