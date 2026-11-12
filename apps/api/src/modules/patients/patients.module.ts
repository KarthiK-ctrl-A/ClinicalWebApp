import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { PatientsController } from './controllers/patients.controller';

import { PatientsService } from './services/patients.service';

import { PatientsRepository } from './repositories/patients.repository';

@Module({
  imports: [DatabaseModule],

  controllers: [PatientsController],

  providers: [
    PatientsService,
    PatientsRepository,
  ],

  exports: [PatientsService],
})
export class PatientsModule {}