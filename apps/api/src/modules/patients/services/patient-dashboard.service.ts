import { Injectable, NotFoundException } from '@nestjs/common';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

import { PatientsService } from './patients.service';

import { PatientDashboardRepository } from '../repositories/patient-dashboard.repository';

@Injectable()
export class PatientDashboardService {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly repository: PatientDashboardRepository,
  ) {}

  async getDashboard(user: AuthenticatedUser) {
    // Resolve the patient record using the
    // authenticated user, never a supplied patient ID.

    const patient = await this.patientsService.findOwnPatient(user);

    const [doctor, appointment] = await Promise.all([
      this.repository.findDoctor(patient.doctorId),

      this.repository.findNextConsultation(patient.id, patient.doctorId),
    ]);

    if (!doctor) {
      throw new NotFoundException('Assigned doctor not found');
    }

    let nextConsultation = null;
    if (appointment) {
      nextConsultation = {
        id: appointment.id,
        scheduledAt: appointment.scheduled_at,
        mode: appointment.mode,
        status: appointment.status,
      };
    }

    return {
      patient: {
        id: patient.id,
        fullName: user.fullName,
      },

      assignedDoctor: {
        id: doctor.id,
        fullName: doctor.full_name,
        specialty: doctor.specialty,
      },

      nextConsultation,
    };
  }
}
