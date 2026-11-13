import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

import { CloudflareRealtimeKitService } from '../../../integrations/cloudflare/cloudflare-realtimekit.service';

import { PatientsService } from '../../patients/services/patients.service';

import { InitiateCallDto } from '../dto/initiate-call.dto';

import { CallRecord, CallResponse } from '../interfaces/call.interface';

import { CallsRepository } from '../repositories/calls.repository';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    private readonly repository: CallsRepository,
    private readonly patientsService: PatientsService,
    private readonly cloudflare: CloudflareRealtimeKitService,
  ) {}

  async initiate(
    doctor: AuthenticatedUser,
    dto: InitiateCallDto,
  ): Promise<CallResponse> {
    if (doctor.role !== 'doctor') {
      throw new ForbiddenException('Only doctors can initiate calls');
    }

    await this.patientsService.findOne(dto.patientId, doctor);

    const meetingId = await this.cloudflare.createMeeting();

    try {
      const call = await this.repository.create(
        dto.patientId,
        doctor.id,
        dto.callType,
        meetingId,
      );

      return this.toResponse(call);
    } catch (error) {
      try {
        await this.cloudflare.endMeeting(meetingId);
      } catch {
        this.logger.error('Unable to clean up failed meeting creation');
      }

      throw error;
    }
  }

  async getCurrentForPatient(patient: AuthenticatedUser) {
    if (patient.role !== 'patient') {
      throw new ForbiddenException('Patient access required');
    }

    const record = await this.patientsService.findOwnPatient(patient);

    const call = await this.repository.findOpenForPatient(
      record.id,
      patient.accessToken,
    );

    let currentCall: CallResponse | null = null;
    if (call) {
      currentCall = this.toResponse(call);
    }

    return {
      patientId: record.id,
      call: currentCall,
    };
  }

  async getCurrentForDoctor(doctor: AuthenticatedUser, patientId: string) {
    if (doctor.role !== 'doctor') {
      throw new ForbiddenException();
    }

    await this.patientsService.findOne(patientId, doctor);

    const call = await this.repository.findOpenForPatient(
      patientId,
      doctor.accessToken,
    );

    let currentCall: CallResponse | null = null;
    if (call) {
      currentCall = this.toResponse(call);
    }

    return {
      patientId,
      call: currentCall,
    };
  }

  private async getAuthorizedCall(
    callId: string,
    user: AuthenticatedUser,
  ): Promise<CallRecord> {
    const call = await this.repository.findById(callId, user.accessToken);

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (user.role === 'doctor') {
      if (call.doctor_id !== user.id) {
        throw new NotFoundException('Call not found');
      }

      await this.patientsService.findOne(call.patient_id, user);
    } else {
      const patient = await this.patientsService.findOwnPatient(user);

      if (patient.id !== call.patient_id) {
        throw new NotFoundException('Call not found');
      }
    }

    return call;
  }

  async accept(
    callId: string,
    patient: AuthenticatedUser,
  ): Promise<CallResponse> {
    if (patient.role !== 'patient') {
      throw new ForbiddenException('Only patients can accept calls');
    }

    await this.getAuthorizedCall(callId, patient);

    const call = await this.repository.transition(
      callId,
      ['ringing'],
      'accepted',
    );

    return this.toResponse(call);
  }

  async decline(
    callId: string,
    patient: AuthenticatedUser,
  ): Promise<CallResponse> {
    if (patient.role !== 'patient') {
      throw new ForbiddenException('Only patients can decline calls');
    }

    const current = await this.getAuthorizedCall(callId, patient);

    const call = await this.repository.transition(
      callId,
      ['ringing'],
      'declined',
    );

    try {
      await this.cloudflare.endMeeting(current.cloudflare_meeting_id);
    } catch {
      this.logger.error('Cloudflare meeting cleanup failed after decline');
    }

    return this.toResponse(call);
  }

  async end(callId: string, user: AuthenticatedUser): Promise<CallResponse> {
    const current = await this.getAuthorizedCall(callId, user);

    if (current.status === 'ended' || current.status === 'declined') {
      return this.toResponse(current);
    }

    if (current.status === 'ringing' && user.role !== 'doctor') {
      throw new ForbiddenException('Patients must decline incoming calls');
    }

    const call = await this.repository.transition(
      callId,
      ['ringing', 'accepted', 'active'],
      'ended',
    );

    try {
      await this.cloudflare.endMeeting(current.cloudflare_meeting_id);
    } catch {
      this.logger.error('Cloudflare meeting cleanup failed after call end');
    }

    return this.toResponse(call);
  }

  async getParticipantToken(callId: string, user: AuthenticatedUser) {
    const call = await this.getAuthorizedCall(callId, user);

    if (call.status !== 'accepted' && call.status !== 'active') {
      throw new ConflictException('Call is not ready to join');
    }

    const existingParticipantId = await this.repository.findParticipant(
      call.id,
      user.id,
    );

    if (existingParticipantId) {
      this.logger.debug(
        `Refreshing existing participant for ${call.call_type} call`,
      );

      const token = await this.cloudflare.refreshParticipantToken(
        call.cloudflare_meeting_id,
        existingParticipantId,
      );

      return {
        callId: call.id,
        token,
      };
    }

    const participant = await this.cloudflare.addParticipant(
      call.cloudflare_meeting_id,
      user.id,
      user.fullName,
      call.call_type,
    );

    await this.repository.saveParticipant(call.id, user.id, participant.id);

    return {
      callId: call.id,
      token: participant.token,
    };
  }

  private getCallOutcome(call: CallRecord): string {
    switch (call.status) {
      case 'ringing':
        return 'ringing';

      case 'accepted':
      case 'active':
        return 'in_progress';

      case 'declined':
        return 'declined';

      case 'failed':
        return 'failed';

      case 'ended':
        return call.started_at ? 'answered' : 'cancelled';

      default:
        return 'unknown';
    }
  }

  private calculateDuration(call: CallRecord): number | null {
    if (call.status !== 'ended' || !call.started_at || !call.ended_at) {
      return null;
    }

    const startedAt = new Date(call.started_at).getTime();

    const endedAt = new Date(call.ended_at).getTime();

    if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt)) {
      return null;
    }

    return Math.max(0, Math.floor((endedAt - startedAt) / 1000));
  }

  async getPatientCallHistory(patientId: string, doctor: AuthenticatedUser) {
    if (doctor.role !== 'doctor') {
      throw new ForbiddenException(
        'Only doctors can access patient call history',
      );
    }

    await this.patientsService.findOne(patientId, doctor);

    const calls = await this.repository.findHistoryByPatient(
      patientId,
      doctor.id,
      doctor.accessToken,
    );

    return calls.map((call) => ({
      ...this.toResponse(call),

      outcome: this.getCallOutcome(call),

      durationSeconds: this.calculateDuration(call),
    }));
  }

  private toResponse(call: CallRecord): CallResponse {
    return {
      id: call.id,
      patientId: call.patient_id,
      doctorId: call.doctor_id,
      callType: call.call_type,
      status: call.status,
      createdAt: call.created_at,
      startedAt: call.started_at,
      endedAt: call.ended_at,
    };
  }
}
