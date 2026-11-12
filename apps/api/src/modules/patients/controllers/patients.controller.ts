import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { Roles } from '../../../common/decorators/roles.decorator';

import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

import { ListPatientsDto } from '../dto/list-patients.dto';

import { PatientsService } from '../services/patients.service';

@Controller('patients')
@Roles('doctor')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll(
    @CurrentUser() doctor: AuthenticatedUser,
    @Query() query: ListPatientsDto,
  ) {
    return this.patientsService.findAll(doctor, query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) patientId: string,
    @CurrentUser() doctor: AuthenticatedUser,
  ) {
    return this.patientsService.findOne(patientId, doctor);
  }
}
