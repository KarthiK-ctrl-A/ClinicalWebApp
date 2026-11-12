import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

import { CreatePrescriptionDto } from '../dto/create-prescription.dto';

import { PrescriptionsService } from '../services/prescriptions.service';

@Controller('patients/:patientId/prescriptions')
@Roles('doctor')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  findByPatient(
    @Param('patientId', ParseUUIDPipe)
    patientId: string,

    @CurrentUser()
    doctor: AuthenticatedUser,
  ) {
    return this.prescriptionsService.findByPatient(patientId, doctor);
  }

  @Post()
  create(
    @Param('patientId', ParseUUIDPipe)
    patientId: string,

    @CurrentUser()
    doctor: AuthenticatedUser,

    @Body()
    dto: CreatePrescriptionDto,
  ) {
    return this.prescriptionsService.create(patientId, doctor, dto);
  }
}
