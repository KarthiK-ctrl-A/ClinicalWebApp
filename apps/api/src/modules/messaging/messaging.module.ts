import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { PatientsModule } from '../patients/patients.module';

import { MessagingController } from './controllers/messaging.controller';

import { MessagingService } from './services/messaging.service';

import { MessagingRepository } from './repositories/messaging.repository';

@Module({
  imports: [DatabaseModule, PatientsModule],

  controllers: [MessagingController],

  providers: [MessagingService, MessagingRepository],
})
export class MessagingModule {}
