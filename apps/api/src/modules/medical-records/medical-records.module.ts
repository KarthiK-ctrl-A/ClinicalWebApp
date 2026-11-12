import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { PatientsModule } from '../patients/patients.module';

import { MedicalRecordsController } from './controllers/medical-records.controller';
import { MedicalRecordsService } from './services/medical-records.service';
import { MedicalRecordsRepository } from './repositories/medical-records.repository';

@Module({
  imports: [DatabaseModule, PatientsModule],

  controllers: [MedicalRecordsController],

  providers: [MedicalRecordsService, MedicalRecordsRepository],
})
export class MedicalRecordsModule {}
