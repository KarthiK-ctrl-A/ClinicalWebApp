import { Injectable, InternalServerErrorException,   NotFoundException } from '@nestjs/common';

import { SupabaseService } from '../../../database/supabase.service';

import { CreatePrescriptionDto } from '../dto/create-prescription.dto';

export interface PatientPrescriptionRecord {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number | null;
  instructions: string | null;
  status: string;
  prescribed_at: string;
}

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

  async findForPatientUser(
  userId: string,
  accessToken: string,
): Promise<PatientPrescriptionRecord[]> {
  const client = this.supabase.forUser(accessToken);

  // Identify the authenticated patient's record
  const { data: patient, error: patientError } = await client
    .from('patients')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (patientError || !patient) {
    throw new NotFoundException(
      'Patient record not found',
    );
  }

  // Retrieve only this patient's prescriptions
  const { data, error } = await client
    .from('prescriptions')
    .select(`
      id,
      medication_name,
      dosage,
      frequency,
      duration_days,
      instructions,
      status,
      prescribed_at
    `)
    .eq('patient_id', patient.id)
    .order('prescribed_at', { ascending: false });

  if (error) {
    throw new InternalServerErrorException(
      'Unable to retrieve patient prescriptions',
    );
  }

  return (data ?? []) as PatientPrescriptionRecord[];
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