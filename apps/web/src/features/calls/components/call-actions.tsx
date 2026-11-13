'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';

import { clinicApi } from '@/lib/api/clinic-api';

import { createClient } from '@/lib/supabase/client';

import {
  ClinicCall,
  CurrentCallResponse,
  CallType,
} from '../types/call';

const CallRoom = dynamic(
  () =>
    import('./call-room').then((module) => module.CallRoom),
  { ssr: false },
);

interface CallActionsProps {
  patientId: string;
}

function mapCall(record: Record<string, unknown>): ClinicCall {
  return {
    id: record.id as string,
    patientId: record.patient_id as string,
    doctorId: record.doctor_id as string,
    callType: record.call_type as CallType,
    status: record.status as ClinicCall['status'],
    createdAt: record.created_at as string,
    startedAt: record.started_at as string | null,
    endedAt: record.ended_at as string | null,
  };
}

export function CallActions({
  patientId,
}: CallActionsProps) {
  const supabase = useMemo(() => createClient(), []);

  const [call, setCall] = useState<ClinicCall | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    let active = true;

    setCall(null);

    async function initialize() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          return;
        }

        await supabase.realtime.setAuth(
          session.access_token,
        );

        const result = await clinicApi<CurrentCallResponse>(
          `/api/v1/calls/patients/${patientId}/current`,
        );

        if (active) {
          setCall(result.call);
        }
      } catch {
        if (active) {
          setError('Unable to load current call');
        }
      }
    }

    void initialize();

    const channel = supabase
      .channel(`doctor-calls:${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          if (!active) return;

          const record = payload.new as Record<string, unknown>;

          if (record?.id) {
            const updated = mapCall(record);

            setCall(
              updated.status === 'ended' ||
                updated.status === 'declined'
                ? null
                : updated,
            );
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [patientId, supabase]);

  async function initiateCall(callType: CallType) {
    setLoading(true);
    setError('');

    try {
      const created = await clinicApi<ClinicCall>(
        '/api/v1/calls',
        {
          method: 'POST',
          body: JSON.stringify({
            patientId,
            callType,
          }),
        },
      );

      setCall(created);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to start call',
      );
    } finally {
      setLoading(false);
    }
  }

async function cancelCall() {
  if (!call) return;

  setError('');

  try {
    await clinicApi(
      `/api/v1/calls/${call.id}/end`,
      {
        method: 'POST',
      },
    );

    setCall(null);
    setMinimized(false);
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'Unable to end consultation',
    );
  }
}

  const handleEnded = useCallback(() => {
    setCall(null);
  }, []);

  return (
    <div className="space-y-4 rounded-lg border bg-white p-5">
      {!call && (
        <div className="flex gap-3">
          <Button
            disabled={loading}
            onClick={() => void initiateCall('audio')}
          >
            Audio Call
          </Button>

          <Button
            disabled={loading}
            onClick={() => void initiateCall('video')}
          >
            Video Call
          </Button>
        </div>
      )}

      {(call?.status === 'accepted' ||
  call?.status === 'active') && (
  minimized ? (
    <div className="space-y-3 rounded-lg border p-5">
      <h3 className="font-semibold">
        Consultation in Progress
      </h3>

      <p className="text-sm text-slate-500">
        The consultation is open.
        You can retry joining or end it.
      </p>

      <div className="flex gap-3">
        <Button
          onClick={() => setMinimized(false)}
        >
          Rejoin Consultation
        </Button>

        <Button
          variant="destructive"
          onClick={() => void cancelCall()}
        >
          End Call
        </Button>
      </div>
    </div>
  ) : (
    <CallRoom
  key={call.id}
  callId={call.id}
  callType={call.callType}
  onExit={() => {
    setMinimized(true);
  }}
  onEnded={() => {
    setCall(null);
    setMinimized(false);
  }}
/>
  )
)}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}