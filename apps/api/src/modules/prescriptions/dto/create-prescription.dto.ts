import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreatePrescriptionDto {
  @IsString()
  @Matches(/\S/)
  @MaxLength(120)
  medicationName: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(80)
  dosage: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(120)
  frequency: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}
