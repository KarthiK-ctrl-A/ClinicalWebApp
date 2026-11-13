import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { PatientsController } from './controllers/patients.controller';

import { PatientsService } from './services/patients.service';

import { PatientsRepository } from './repositories/patients.repository';

import { PatientDashboardController } from './controllers/patient-dashboard.controller';

import { PatientDashboardService } from './services/patient-dashboard.service';

import { PatientDashboardRepository } from './repositories/patient-dashboard.repository';

@Module({
  imports: [DatabaseModule],

  controllers: [PatientsController, PatientDashboardController],

  providers: [
    PatientsService,
    PatientsRepository,
    PatientDashboardService,
    PatientDashboardRepository,
  ],

  exports: [PatientsService],
})
export class PatientsModule {}
