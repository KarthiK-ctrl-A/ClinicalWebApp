import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import * as Joi from 'joi';

import { AuthenticationGuard } from './common/guards/authentication.guard';

import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './modules/auth/auth.module';

import { PatientsModule } from './modules/patients/patients.module';

import { HealthModule } from './modules/health/health.module';

import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';

import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';

import { MessagingModule } from './modules/messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),

        PORT: Joi.number().port().default(3001),

        FRONTEND_URL: Joi.string().uri().required(),

        SUPABASE_URL: Joi.string().uri().required(),

        SUPABASE_PUBLISHABLE_KEY: Joi.string().required(),

        SUPABASE_SECRET_KEY: Joi.string().optional(),

        DEMO_PASSWORD: Joi.string().optional(),
      }).unknown(true),
    }),

    AuthModule,
    PatientsModule,
    HealthModule,
    MedicalRecordsModule,
    PrescriptionsModule,
    MessagingModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
