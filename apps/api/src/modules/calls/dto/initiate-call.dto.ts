import { IsIn, IsUUID } from 'class-validator';
import type { CallType } from '../interfaces/call.interface';

export class InitiateCallDto {
  @IsUUID()
  patientId: string;

  @IsIn(['audio', 'video'])
  callType: CallType;
}