import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { SupabaseService } from '../../../database/supabase.service';

@Injectable()
export class PatientDashboardRepository {
  constructor(
    private readonly supabase: SupabaseService,
  ) {}

  async findDoctor(doctorId: string) {
    const { data, error } = await this.supabase
      .admin()
      .from('profiles')
      .select('id, full_name, specialty')
      .eq('id', doctorId)
      .eq('role', 'doctor')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Unable to retrieve doctor information',
      );
    }

    return data;
  }

  async findNextConsultation(
    patientId: string,
    doctorId: string,
  ) {
    const { data, error } = await this.supabase
      .admin()
      .from('appointments')
      .select(
        'id, scheduled_at, mode, status',
      )
      .eq('patient_id', patientId)
      .eq('doctor_id', doctorId)
      .eq('status', 'scheduled')
      .gte(
        'scheduled_at',
        new Date().toISOString(),
      )
      .order('scheduled_at', {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Unable to retrieve upcoming consultation',
      );
    }

    return data;
  }
}