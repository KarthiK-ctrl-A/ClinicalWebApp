import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { SupabaseService } from '../../../database/supabase.service';

import { CreatePrescriptionDto } from '../dto/create-prescription.dto';

@Injectable()
export class PrescriptionsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly columns = `
    id,
    medication_name,
    dosage,
    frequency,
    duration_days,
    instructions,
    status,
    prescribed_at
    `;

  async findByPatient(patientId: string, accessToken: string) {
    const client = this.supabase.forUser(accessToken);

    const { data, error } = await client
      .from('prescriptions')
      .select(this.columns)
      .eq('patient_id', patientId)
      .order('prescribed_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        'Unable to retrieve prescriptions',
      );
    }

    return data ?? [];
  }

  async create(
    patientId: string,
    doctorId: string,
    accessToken: string,
    prescription: CreatePrescriptionDto,
  ) {
    const client = this.supabase.forUser(accessToken);

    const { data, error } = await client
      .from('prescriptions')
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        medication_name: prescription.medicationName,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration_days: prescription.durationDays,
        instructions: prescription.instructions ?? null,
      })
      .select(this.columns)
      .single();

    if (error) {
      throw new InternalServerErrorException('Unable to create prescription');
    }

    return data;
  }
}
