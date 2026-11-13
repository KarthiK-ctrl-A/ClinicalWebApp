import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { CloudflareModule } from '../../integrations/cloudflare/cloudflare.module';

import { PatientsModule } from '../patients/patients.module';

import { CallsController } from './controllers/calls.controller';

import { CallsService } from './services/calls.service';

import { CallsRepository } from './repositories/calls.repository';

@Module({
  imports: [DatabaseModule, PatientsModule, CloudflareModule],

  controllers: [CallsController],

  providers: [CallsService, CallsRepository],

  exports: [CallsService],
})
export class CallsModule {}
