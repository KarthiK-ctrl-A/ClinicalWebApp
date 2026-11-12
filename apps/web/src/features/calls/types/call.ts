export type CallType = 'audio' | 'video';

export type CallStatus =
  | 'ringing'
  | 'accepted'
  | 'active'
  | 'declined'
  | 'ended'
  | 'failed';

export interface ClinicCall {
  id: string;
  patientId: string;
  doctorId: string;
  callType: CallType;
  status: CallStatus;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface CurrentCallResponse {
  patientId: string;
  call: ClinicCall | null;
}

export interface ParticipantToken {
  callId: string;
  token: string;
}

export type CallOutcome =
  | 'ringing'
  | 'in_progress'
  | 'answered'
  | 'declined'
  | 'cancelled'
  | 'failed'
  | 'unknown';

export interface CallHistoryItem extends ClinicCall {
  outcome: CallOutcome;
  durationSeconds: number | null;
}