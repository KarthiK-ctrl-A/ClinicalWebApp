import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { SupabaseService } from '../../../database/supabase.service';

import type { PatientRecord } from '../interfaces/patient.interface';

@Injectable()
export class PatientsRepository {
  private readonly logger = new Logger(PatientsRepository.name);

  private normalizeProfile(
    profile: { full_name: string } | { full_name: string }[] | null,
  ): { full_name: string } | null {
    if (Array.isArray(profile)) {
      return profile[0] ?? null;
    }

    return profile;
  }

  constructor(private readonly supabase: SupabaseService) {}

  async findAssigned(
    doctorId: string,
    accessToken: string,
    offset: number,
    limit: number,
  ) {
    const client = this.supabase.forUser(accessToken);

    const { data, count, error } = await client
      .from('patients')
      .select(
        `
          id,
          date_of_birth,
          gender,
          phone,
          allergies,
          profile:profiles!patients_user_id_fkey (
            full_name
          )
        `,
        { count: 'exact' },
      )
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Patient list query failed: ${error.code}`);

      throw new InternalServerErrorException('Unable to retrieve patients');
    }

    return {
      records: (data ?? []).map((patient) => ({
        ...patient,
        profile: this.normalizeProfile(patient.profile),
      })),
      total: count ?? 0,
    };
  }

  async findAssignedById(
    patientId: string,
    doctorId: string,
    accessToken: string,
  ): Promise<PatientRecord | null> {
    const client = this.supabase.forUser(accessToken);

    const { data, error } = await client
      .from('patients')
      .select(
        `
          id,
          date_of_birth,
          gender,
          phone,
          allergies,
          address,
          medical_notes,
          profile:profiles!patients_user_id_fkey (
            full_name
          )
        `,
      )
      .eq('id', patientId)
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Patient detail query failed: ${error.code}`);

      throw new InternalServerErrorException(
        'Unable to retrieve patient details',
      );
    }

    if (!data) {
      return null;
    }

    return {
      ...data,
      profile: this.normalizeProfile(data.profile),
    };
  }
}
