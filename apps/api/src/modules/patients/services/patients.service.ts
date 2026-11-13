import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

import { ListPatientsDto } from '../dto/list-patients.dto';

import {
  PatientDetails,
  PatientRecord,
  PatientSummary,
} from '../interfaces/patient.interface';

import { PatientsRepository } from '../repositories/patients.repository';

@Injectable()
export class PatientsService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  async findAll(doctor: AuthenticatedUser, query: ListPatientsDto) {
    const offset = (query.page - 1) * query.pageSize;

    const result = await this.patientsRepository.findAssigned(
      doctor.id,
      doctor.accessToken,
      offset,
      query.pageSize,
    );

    return {
      data: result.records.map((record) => this.toSummary(record)),

      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    };
  }

  async findOne(
    patientId: string,
    doctor: AuthenticatedUser,
  ): Promise<PatientDetails> {
    const patient = await this.patientsRepository.findAssignedById(
      patientId,
      doctor.id,
      doctor.accessToken,
    );

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return {
      ...this.toSummary(patient),
      address: patient.address ?? null,
      medicalNotes: patient.medical_notes ?? null,
    };
  }

  async findOwnPatient(user: AuthenticatedUser) {
    if (user.role !== 'patient') {
      throw new ForbiddenException('Patient access required');
    }

    const patient = await this.patientsRepository.findByUserId(
      user.id,
      user.accessToken,
    );

    if (!patient) {
      throw new NotFoundException('Patient record not found');
    }

    return {
      id: patient.id,
      doctorId: patient.doctor_id,
    };
  }

  private toSummary(patient: PatientRecord): PatientSummary {
    return {
      id: patient.id,
      fullName: patient.profile?.full_name ?? '',
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      allergies: patient.allergies,
    };
  }
}
