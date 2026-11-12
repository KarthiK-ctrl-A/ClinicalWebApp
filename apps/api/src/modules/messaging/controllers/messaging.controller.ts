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

import { SendMessageDto } from '../dto/send-message.dto';

import { MessagingService } from '../services/messaging.service';

@Controller('messages')
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
  ) {}

  @Get('patients/:patientId')
  @Roles('doctor')
  getDoctorConversation(
    @Param('patientId', ParseUUIDPipe)
    patientId: string,

    @CurrentUser()
    doctor: AuthenticatedUser,
  ) {
    return this.messagingService.getDoctorConversation(
      patientId,
      doctor,
    );
  }

  @Post('patients/:patientId')
  @Roles('doctor')
  sendDoctorMessage(
    @Param('patientId', ParseUUIDPipe)
    patientId: string,

    @CurrentUser()
    doctor: AuthenticatedUser,

    @Body()
    dto: SendMessageDto,
  ) {
    return this.messagingService.sendAsDoctor(
      patientId,
      doctor,
      dto,
    );
  }

  @Get('me')
  @Roles('patient')
  getPatientConversation(
    @CurrentUser()
    patient: AuthenticatedUser,
  ) {
    return this.messagingService.getPatientConversation(
      patient,
    );
  }

  @Post('me')
  @Roles('patient')
  sendPatientMessage(
    @CurrentUser()
    patient: AuthenticatedUser,

    @Body()
    dto: SendMessageDto,
  ) {
    return this.messagingService.sendAsPatient(
      patient,
      dto,
    );
  }
}