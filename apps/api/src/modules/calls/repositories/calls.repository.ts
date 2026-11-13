import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { SupabaseService } from '../../../database/supabase.service';

import { CallRecord, CallStatus, CallType } from '../interfaces/call.interface';

@Injectable()
export class CallsRepository {
  private readonly logger = new Logger(CallsRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async create(
    patientId: string,
    doctorId: string,
    callType: CallType,
    meetingId: string,
  ): Promise<CallRecord> {
    const { data, error } = await this.supabase
      .admin()
      .from('calls')
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        call_type: callType,
        cloudflare_meeting_id: meetingId,
        status: 'ringing',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          'Doctor or patient already has an open call',
        );
      }

      throw new InternalServerErrorException('Unable to create call');
    }

    return data as CallRecord;
  }

  async findById(
    callId: string,
    accessToken: string,
  ): Promise<CallRecord | null> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from('calls')
      .select('*')
      .eq('id', callId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to retrieve call');
    }

    return data as CallRecord | null;
  }

  async findOpenForPatient(
    patientId: string,
    accessToken: string,
  ): Promise<CallRecord | null> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from('calls')
      .select('*')
      .eq('patient_id', patientId)
      .in('status', ['ringing', 'accepted', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to retrieve current call');
    }

    return data as CallRecord | null;
  }

  async transition(
    callId: string,
    from: CallStatus[],
    to: CallStatus,
  ): Promise<CallRecord> {
    const changes: Record<string, unknown> = {
      status: to,
    };

    if (to === 'accepted') {
      changes.started_at = new Date().toISOString();
    }

    if (to === 'declined' || to === 'ended') {
      changes.ended_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .admin()
      .from('calls')
      .update(changes)
      .eq('id', callId)
      .in('status', from)
      .select()
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to update call');
    }

    if (!data) {
      throw new ConflictException('Call status has already changed');
    }

    return data as CallRecord;
  }

  async findParticipant(
    callId: string,
    userId: string,
  ): Promise<string | null> {
    const { data, error } = await this.supabase
      .admin()
      .from('call_participants')
      .select('cloudflare_participant_id')
      .eq('call_id', callId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Call participant query failed: ${error.code} ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Unable to retrieve call participant',
      );
    }

    return data?.cloudflare_participant_id ?? null;
  }

  async saveParticipant(
    callId: string,
    userId: string,
    participantId: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .admin()
      .from('call_participants')
      .upsert(
        {
          call_id: callId,
          user_id: userId,
          cloudflare_participant_id: participantId,
        },
        {
          onConflict: 'call_id,user_id',
        },
      );

    if (error) {
      throw new InternalServerErrorException('Unable to save call participant');
    }
  }

  async findHistoryByPatient(
    patientId: string,
    doctorId: string,
    accessToken: string,
  ): Promise<CallRecord[]> {
    const client = this.supabase.forUser(accessToken);

    const { data, error } = await client
      .from('calls')
      .select('*')
      .eq('patient_id', patientId)
      .eq('doctor_id', doctorId)
      .order('created_at', {
        ascending: false,
      })
      .limit(50);

    if (error) {
      throw new InternalServerErrorException('Unable to retrieve call history');
    }

    return (data ?? []) as CallRecord[];
  }
}
