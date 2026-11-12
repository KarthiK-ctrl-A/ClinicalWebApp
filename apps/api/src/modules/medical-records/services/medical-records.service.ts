import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

import { PatientsService } from '../../patients/services/patients.service';

import { MedicalRecordsRepository } from '../repositories/medical-records.repository';

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly recordsRepository: MedicalRecordsRepository,
  ) {}

  async findByPatient(patientId: string, doctor: AuthenticatedUser) {
    // Verify that this patient belongs to the doctor.
    await this.patientsService.findOne(patientId, doctor);

    const records = await this.recordsRepository.findByPatient(
      patientId,
      doctor.accessToken,
    );

    return {
      labResults: records.labs.map((lab) => ({
        id: lab.id,
        testName: lab.test_name,
        result: lab.result_value,
        unit: lab.unit,
        referenceRange: lab.reference_range,
        collectedAt: lab.collected_at,
      })),

      imagingReports: records.imaging.map((report) => ({
        id: report.id,
        imagingType: report.imaging_type,
        findings: report.findings,
        impression: report.impression,
        reportDate: report.report_date,
      })),
    };
  }
}
