'use client';

import { getErrorMessage } from '@/lib/error-message';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Phone, Video, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { clinicApi } from '@/lib/api/clinic-api';

import { createClient } from '@/lib/supabase/client';

import type { RealtimeChannel } from '@supabase/supabase-js';

import type { CallHistoryItem, CallOutcome } from '../types/call';

interface CallHistoryProps {
  patientId: string;
}

const outcomeLabels: Record<CallOutcome, string> = {
  ringing: 'Ringing',
  in_progress: 'In Progress',
  answered: 'Answered',
  declined: 'Declined',
  cancelled: 'Cancelled',
  failed: 'Failed',
  unknown: 'Unknown',
};

const outcomeStyles: Record<CallOutcome, string> = {
  ringing: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  answered: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
  failed: 'bg-orange-100 text-orange-700',
  unknown: 'bg-slate-100 text-slate-700',
};

const callTypeDisplay = {
  audio: { label: 'Audio', icon: Phone },
  video: { label: 'Video', icon: Video },
};

function formatDuration(seconds: number | null): string {
  if (seconds === null) {
    return '—';
  }

  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor((seconds % 3600) / 60);

  const remainingSeconds = seconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');

  const paddedSeconds = String(remainingSeconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
}

export function CallHistory({ patientId }: CallHistoryProps) {
  const supabase = useMemo(() => createClient(), []);

  const [calls, setCalls] = useState<CallHistoryItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const loadHistory = useCallback(
    () => clinicApi<CallHistoryItem[]>(`/api/v1/calls/patients/${patientId}/history`),
    [patientId],
  );

  useEffect(() => {
    let active = true;

    let channel: RealtimeChannel | null = null;

    let unsubscribeAuth: (() => void) | null = null;

    async function refresh() {
      try {
        const result = await loadHistory();

        if (active) {
          setCalls(result);
          setError('');
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err, 'Unable to load call history'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    async function initialize() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Authentication required');
        }

        const userId = session.user.id;

        await supabase.realtime.setAuth(session.access_token);

        if (!active) return;

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
          if (!active) return;

          if (!updatedSession || updatedSession.user.id !== userId) {
            setCalls([]);
            setError('');
            if (channel) {
              void supabase.removeChannel(channel);
            }
            window.location.replace('/login');
            return;
          }

          void supabase.realtime.setAuth(updatedSession.access_token);
        });

        unsubscribeAuth = () => subscription.unsubscribe();

        await refresh();

        if (!active) return;

        channel = supabase
          .channel(`call-history:${userId}:${patientId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'calls',
              filter: `patient_id=eq.${patientId}`,
            },
            () => {
              // Re-fetch authorized history whenever
              // a call is created or its status changes.
              void refresh();
            },
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              void refresh();
            }
          });
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err, 'Unable to initialize call history'));

          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      active = false;

      unsubscribeAuth?.();

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [patientId, supabase, loadHistory]);

  async function handleRefresh() {
    setLoading(true);

    try {
      const result = await loadHistory();

      setCalls(result);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to refresh history'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Consultation History</h2>

          <p className="text-sm text-slate-500">Audio and video calls with this patient</p>
        </div>

        <Button variant="outline" size="sm" disabled={loading} onClick={() => void handleRefresh()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading call history...</p>}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && calls.length === 0 && !error && (
        <div className="rounded-lg bg-slate-50 p-8 text-center">
          <Phone className="mx-auto mb-3 h-8 w-8 text-slate-400" />

          <p className="font-medium">No consultations yet</p>

          <p className="text-sm text-slate-500">Audio and video call history will appear here.</p>
        </div>
      )}

      {calls.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Call Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Duration</th>
              </tr>
            </thead>

            <tbody>
              {calls.map((call) => {
                const { label, icon: CallIcon } = callTypeDisplay[call.callType];

                return (
                  <tr key={call.id} className="border-b last:border-0">
                    <td className="p-3">{new Date(call.createdAt).toLocaleString()}</td>

                    <td className="p-3">
                      <span className="flex items-center gap-2">
                        <CallIcon className="h-4 w-4 text-blue-600" />
                        {label}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          outcomeStyles[call.outcome]
                        }`}
                      >
                        {outcomeLabels[call.outcome]}
                      </span>
                    </td>

                    <td className="p-3">{formatDuration(call.durationSeconds)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Duration currently measures elapsed time from call acceptance to termination.
      </p>
    </section>
  );
}
