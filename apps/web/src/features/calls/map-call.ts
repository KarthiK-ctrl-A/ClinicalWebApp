import type { ClinicCall } from './types/call';

export function mapCall(record: unknown): ClinicCall | null {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const row = record as Record<string, unknown>;
  const callType = row.call_type;
  const status = row.status;
  const startedAt = row.started_at;
  const endedAt = row.ended_at;

  if (
    typeof row.id !== 'string' ||
    typeof row.patient_id !== 'string' ||
    typeof row.doctor_id !== 'string' ||
    typeof row.created_at !== 'string' ||
    (callType !== 'audio' && callType !== 'video') ||
    (status !== 'ringing' &&
      status !== 'accepted' &&
      status !== 'active' &&
      status !== 'declined' &&
      status !== 'ended' &&
      status !== 'failed') ||
    (startedAt !== null && typeof startedAt !== 'string') ||
    (endedAt !== null && typeof endedAt !== 'string')
  ) {
    return null;
  }

  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    callType,
    status,
    createdAt: row.created_at,
    startedAt,
    endedAt,
  };
}
