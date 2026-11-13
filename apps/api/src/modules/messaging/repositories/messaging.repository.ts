import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { SupabaseService } from '../../../database/supabase.service';

import { MessageRecord } from '../interfaces/message.interface';

@Injectable()
export class MessagingRepository {
  private readonly logger = new Logger(MessagingRepository.name);

  private readonly columns = `
    id,
    patient_id,
    doctor_id,
    sender_id,
    content,
    created_at
  `;

  constructor(private readonly supabase: SupabaseService) {}

  async findByPatient(
    patientId: string,
    accessToken: string,
  ): Promise<MessageRecord[]> {
    const client = this.supabase.forUser(accessToken);

    const { data, error } = await client
      .from('messages')
      .select(this.columns)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      this.logger.error(`Message query failed: ${error.code}`);

      throw new InternalServerErrorException('Unable to retrieve messages');
    }

    return (data ?? []).reverse();
  }

  async create(
    patientId: string,
    doctorId: string,
    senderId: string,
    content: string,
    accessToken: string,
  ): Promise<MessageRecord> {
    const client = this.supabase.forUser(accessToken);

    const { data, error } = await client
      .from('messages')
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        sender_id: senderId,
        content,
      })
      .select(this.columns)
      .single();

    if (error) {
      this.logger.error(`Message insert failed: ${error.code}`);

      throw new InternalServerErrorException('Unable to send message');
    }

    return data;
  }
}
