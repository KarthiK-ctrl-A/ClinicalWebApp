import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

import { PatientsService } from '../../patients/services/patients.service';

import { CreatePrescriptionDto } from '../dto/create-prescription.dto';

import { PrescriptionsRepository } from '../repositories/prescriptions.repository';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly prescriptionsRepository: PrescriptionsRepository,
  ) {}

  async findByPatient(patientId: string, doctor: AuthenticatedUser) {
    await this.verifyPatientAccess(patientId, doctor);

    const prescriptions = await this.prescriptionsRepository.findByPatient(
      patientId,
      doctor.accessToken,
    );

    return prescriptions.map((record) => this.toResponse(record));
  }

  async create(
    patientId: string,
    doctor: AuthenticatedUser,
    dto: CreatePrescriptionDto,
  ) {
    await this.verifyPatientAccess(patientId, doctor);

    const prescription = await this.prescriptionsRepository.create(
      patientId,
      doctor.id,
      doctor.accessToken,
      dto,
    );

    return this.toResponse(prescription);
  }

  private async verifyPatientAccess(
    patientId: string,
    doctor: AuthenticatedUser,
  ) {
    await this.patientsService.findOne(patientId, doctor);
  }

  private toResponse(record: {
    id: string;
    medication_name: string;
    dosage: string;
    frequency: string | null;
    duration_days: number | null;
    instructions: string | null;
    status: string;
    prescribed_at: string;
  }) {
    return {
      id: record.id,
      medicationName: record.medication_name,
      dosage: record.dosage,
      frequency: record.frequency,
      durationDays: record.duration_days,
      instructions: record.instructions,
      status: record.status,
      prescribedAt: record.prescribed_at,
    };
  }
}
