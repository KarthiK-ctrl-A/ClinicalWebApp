import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { SupabaseService } from '../../../database/supabase.service';

@Injectable()
export class MedicalRecordsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async findByPatient(patientId: string, accessToken: string) {
    const client = this.supabase.forUser(accessToken);

    const [labs, imaging] = await Promise.all([
      client
        .from('lab_results')
        .select(
          `
          id,
          test_name,
          result_value,
          unit,
          reference_range,
          collected_at
          `,
        )
        .eq('patient_id', patientId)
        .order('collected_at', { ascending: false }),

      client
        .from('imaging_reports')
        .select(
          `
          id,
          imaging_type,
          findings,
          impression,
          report_date
          `,
        )
        .eq('patient_id', patientId)
        .order('report_date', { ascending: false }),
    ]);

    if (labs.error || imaging.error) {
      throw new InternalServerErrorException(
        'Unable to retrieve medical records',
      );
    }

    return {
      labs: labs.data ?? [],
      imaging: imaging.data ?? [],
    };
  }
}
