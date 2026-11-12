import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { PatientsModule } from '../patients/patients.module';

import { PrescriptionsController } from './controllers/prescriptions.controller';
import { PrescriptionsService } from './services/prescriptions.service';
import { PrescriptionsRepository } from './repositories/prescriptions.repository';

@Module({
  imports: [DatabaseModule, PatientsModule],

  controllers: [PrescriptionsController],

  providers: [PrescriptionsService, PrescriptionsRepository],
})
export class PrescriptionsModule {}
