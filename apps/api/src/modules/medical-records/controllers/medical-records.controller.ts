import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

import { MedicalRecordsService } from '../services/medical-records.service';

@Controller('patients/:patientId/records')
@Roles('doctor')
export class MedicalRecordsController {
  constructor(private readonly recordsService: MedicalRecordsService) {}

  @Get()
  findByPatient(
    @Param('patientId', ParseUUIDPipe)
    patientId: string,

    @CurrentUser()
    doctor: AuthenticatedUser,
  ) {
    return this.recordsService.findByPatient(patientId, doctor);
  }
}
