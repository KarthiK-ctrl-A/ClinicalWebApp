import { ForbiddenException, Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

import { PatientsService } from '../../patients/services/patients.service';

import { SendMessageDto } from '../dto/send-message.dto';

import {
  Conversation,
  ConversationResponse,
  MessageRecord,
  MessageResponse,
} from '../interfaces/message.interface';

import { MessagingRepository } from '../repositories/messaging.repository';

@Injectable()
export class MessagingService {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly messagingRepository: MessagingRepository,
  ) {}

  async getDoctorConversation(
    patientId: string,
    doctor: AuthenticatedUser,
  ): Promise<ConversationResponse> {
    const conversation = await this.forDoctor(patientId, doctor);

    return this.loadConversation(conversation, doctor);
  }

  async getPatientConversation(
    patient: AuthenticatedUser,
  ): Promise<ConversationResponse> {
    const conversation = await this.forPatient(patient);

    return this.loadConversation(conversation, patient);
  }

  async sendAsDoctor(
    patientId: string,
    doctor: AuthenticatedUser,
    dto: SendMessageDto,
  ): Promise<MessageResponse> {
    const conversation = await this.forDoctor(patientId, doctor);

    return this.send(conversation, doctor, dto);
  }

  async sendAsPatient(
    patient: AuthenticatedUser,
    dto: SendMessageDto,
  ): Promise<MessageResponse> {
    const conversation = await this.forPatient(patient);

    return this.send(conversation, patient, dto);
  }

  private async forDoctor(
    patientId: string,
    doctor: AuthenticatedUser,
  ): Promise<Conversation> {
    if (doctor.role !== 'doctor') {
      throw new ForbiddenException('Doctor access required');
    }

    await this.patientsService.findOne(patientId, doctor);

    return {
      patientId,
      doctorId: doctor.id,
    };
  }

  private async forPatient(patient: AuthenticatedUser): Promise<Conversation> {
    if (patient.role !== 'patient') {
      throw new ForbiddenException('Patient access required');
    }

    const record = await this.patientsService.findOwnPatient(patient);

    return {
      patientId: record.id,
      doctorId: record.doctorId,
    };
  }

  private async loadConversation(
    conversation: Conversation,
    user: AuthenticatedUser,
  ): Promise<ConversationResponse> {
    const messages = await this.messagingRepository.findByPatient(
      conversation.patientId,
      user.accessToken,
    );

    return {
      ...conversation,
      messages: messages.map((message) => this.toResponse(message)),
    };
  }

  private async send(
    conversation: Conversation,
    user: AuthenticatedUser,
    dto: SendMessageDto,
  ): Promise<MessageResponse> {
    const message = await this.messagingRepository.create(
      conversation.patientId,
      conversation.doctorId,
      user.id,
      dto.content.trim(),
      user.accessToken,
    );

    return this.toResponse(message);
  }

  private toResponse(message: MessageRecord): MessageResponse {
    return {
      id: message.id,
      patientId: message.patient_id,
      doctorId: message.doctor_id,
      senderId: message.sender_id,
      content: message.content,
      createdAt: message.created_at,
    };
  }
}
