import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthRepository } from './repositories/auth.repository';

@Module({
  imports: [DatabaseModule],

  controllers: [AuthController],

  providers: [
    AuthService,
    AuthRepository,
  ],

  exports: [AuthService],
})
export class AuthModule {}