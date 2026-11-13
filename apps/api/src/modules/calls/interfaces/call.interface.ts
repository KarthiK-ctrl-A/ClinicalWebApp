export type CallType = 'audio' | 'video';

export type CallStatus =
  'ringing' | 'accepted' | 'active' | 'declined' | 'ended' | 'failed';

export interface CallRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  call_type: CallType;
  status: CallStatus;
  cloudflare_meeting_id: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface CallResponse {
  id: string;
  patientId: string;
  doctorId: string;
  callType: CallType;
  status: CallStatus;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}
