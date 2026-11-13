'use client';

import { getErrorMessage } from '@/lib/error-message';

import { useEffect, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';

import { clinicApi } from '@/lib/api/clinic-api';

import { createClient } from '@/lib/supabase/client';

import { ClinicCall, CurrentCallResponse } from '../types/call';
import { mapCall } from '../map-call';

const CallRoom = dynamic(() => import('./call-room').then((module) => module.CallRoom), {
  ssr: false,
});

export function IncomingCallCenter() {
  const supabase = useMemo(() => createClient(), []);

  const [call, setCall] = useState<ClinicCall | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function initialize() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          return;
        }

        await supabase.realtime.setAuth(session.access_token);

        const result = await clinicApi<CurrentCallResponse>('/api/v1/calls/current');

        if (!active) return;

        setCall(result.call);

        channel = supabase
          .channel(`patient-calls:${session.user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'calls',
              filter: `patient_id=eq.${result.patientId}`,
            },
            (payload) => {
              if (!active) return;

              const updated = mapCall(payload.new);
              if (!updated) return;

              if (
                updated.status === 'ended' ||
                updated.status === 'declined' ||
                updated.status === 'failed'
              ) {
                setCall(null);
                setMinimized(false);
              } else {
                setCall(updated);
              }
            },
          )
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && active) {
              const latest = await clinicApi<CurrentCallResponse>('/api/v1/calls/current');

              if (active) {
                setCall(latest.call);
              }
            }
          });
      } catch {
        if (active) {
          setError('Unable to initialize incoming calls');
        }
      }
    }

    void initialize();

    return () => {
      active = false;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  async function acceptCall() {
    if (!call) return;

    setLoading(true);

    try {
      const updated = await clinicApi<ClinicCall>(`/api/v1/calls/${call.id}/accept`, {
        method: 'POST',
      });

      setCall(updated);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to accept call'));
    } finally {
      setLoading(false);
    }
  }

  async function endCurrentCall() {
    if (!call) return;

    setLoading(true);
    setError('');

    try {
      await clinicApi(`/api/v1/calls/${call.id}/end`, {
        method: 'POST',
      });

      setCall(null);
      setMinimized(false);
    } catch (error) {
      setError(getErrorMessage(error, 'Unable to end consultation'));

      // Allow dashboard access even if cleanup fails.
      setMinimized(true);
    } finally {
      setLoading(false);
    }
  }

  async function declineCall() {
    if (!call) return;

    setLoading(true);

    try {
      await clinicApi(`/api/v1/calls/${call.id}/decline`, {
        method: 'POST',
      });

      setCall(null);
    } catch {
      setError('Unable to decline call');
    } finally {
      setLoading(false);
    }
  }

  if (!call) {
    if (!error) {
      return null;
    }

    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (call.status === 'accepted' || call.status === 'active') {
    if (minimized) {
      return (
        <aside className="fixed bottom-4 right-4 z-40 w-80 space-y-3 rounded-xl border bg-white p-5 shadow-xl">
          <h3 className="font-semibold">Consultation</h3>

          <p className="text-sm text-slate-500">
            Your consultation is still open. You can retry joining or end the call.
          </p>

          <div className="flex gap-2">
            <Button onClick={() => setMinimized(false)}>Rejoin</Button>

            <Button variant="destructive" disabled={loading} onClick={() => void endCurrentCall()}>
              End Call
            </Button>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </aside>
      );
    }

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-6">
        <div className="mx-auto max-w-5xl space-y-4 rounded-xl bg-white p-4">
          <CallRoom
            key={call.id}
            callId={call.id}
            onExit={() => {
              setMinimized(true);
            }}
            onEnded={() => {
              setCall(null);
              setMinimized(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Incoming consultation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
    >
      <div className="w-full max-w-md space-y-5 rounded-xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Incoming {call.callType} Call</h2>

          <p className="mt-2 text-slate-500">Your doctor is calling.</p>
        </div>

        <div className="flex justify-center gap-4">
          <Button disabled={loading} onClick={() => void acceptCall()}>
            Accept
          </Button>

          <Button disabled={loading} variant="destructive" onClick={() => void declineCall()}>
            Decline
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
