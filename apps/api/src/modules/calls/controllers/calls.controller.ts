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

import { InitiateCallDto } from '../dto/initiate-call.dto';

import { CallsService } from '../services/calls.service';

@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  @Roles('doctor')
  initiate(
    @CurrentUser() doctor: AuthenticatedUser,
    @Body() dto: InitiateCallDto,
  ) {
    return this.callsService.initiate(doctor, dto);
  }

  @Get('current')
  @Roles('patient')
  currentPatientCall(@CurrentUser() patient: AuthenticatedUser) {
    return this.callsService.getCurrentForPatient(patient);
  }

  @Get('patients/:patientId/current')
  @Roles('doctor')
  currentDoctorCall(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() doctor: AuthenticatedUser,
  ) {
    return this.callsService.getCurrentForDoctor(doctor, patientId);
  }

  @Post(':id/accept')
  @Roles('patient')
  accept(
    @Param('id', ParseUUIDPipe) callId: string,
    @CurrentUser() patient: AuthenticatedUser,
  ) {
    return this.callsService.accept(callId, patient);
  }

  @Post(':id/decline')
  @Roles('patient')
  decline(
    @Param('id', ParseUUIDPipe) callId: string,
    @CurrentUser() patient: AuthenticatedUser,
  ) {
    return this.callsService.decline(callId, patient);
  }

  @Post(':id/end')
  @Roles('doctor', 'patient')
  end(
    @Param('id', ParseUUIDPipe) callId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.callsService.end(callId, user);
  }

  @Post(':id/token')
  @Roles('doctor', 'patient')
  participantToken(
    @Param('id', ParseUUIDPipe) callId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.callsService.getParticipantToken(callId, user);
  }

  @Get('patients/:patientId/history')
  @Roles('doctor')
  getPatientCallHistory(
    @Param('patientId', ParseUUIDPipe)
    patientId: string,

    @CurrentUser()
    doctor: AuthenticatedUser,
  ) {
    return this.callsService.getPatientCallHistory(patientId, doctor);
  }
}
