'use client';

import { getErrorMessage } from '@/lib/error-message';

import { useCallback, useEffect, useRef, useState } from 'react';

import { RealtimeKitProvider, useRealtimeKitClient } from '@cloudflare/realtimekit-react';

import { RtkMeeting } from '@cloudflare/realtimekit-react-ui';

import { Button } from '@/components/ui/button';

import { clinicApi } from '@/lib/api/clinic-api';

interface CallRoomProps {
  callId: string;
  onEnded: () => void;
  onExit: () => void;
}

interface ParticipantToken {
  callId: string;
  token: string;
}

export function CallRoom(props: CallRoomProps) {
  const [attempt, setAttempt] = useState(0);

  return (
    <CallRoomSession
      key={`${props.callId}-${attempt}`}
      {...props}
      onRetry={() => setAttempt((value) => value + 1)}
    />
  );
}

function CallRoomSession({
  callId,
  onEnded,
  onExit,
  onRetry,
}: CallRoomProps & {
  onRetry: () => void;
}) {
  const [meeting, initMeeting] = useRealtimeKitClient();

  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState('');
  const [actionError, setActionError] = useState('');
  const [ending, setEnding] = useState(false);

  const endingRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const response = await clinicApi<ParticipantToken>(`/api/v1/calls/${callId}/token`, {
          method: 'POST',
        });

        if (!active) return;

        await initMeeting({
          authToken: response.token,
        });
      } catch (error) {
        if (active) {
          setInitError(getErrorMessage(error, 'Unable to initialize consultation'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [callId, initMeeting]);

  const endCall = useCallback(async () => {
    if (endingRef.current) return;

    endingRef.current = true;
    setEnding(true);
    setActionError('');

    try {
      await clinicApi(`/api/v1/calls/${callId}/end`, {
        method: 'POST',
      });

      if (meeting) {
        await meeting.leave();
      }

      onEnded();
    } catch {
      endingRef.current = false;

      setActionError('Unable to end the call. Please try again.');
    } finally {
      setEnding(false);
    }
  }, [callId, meeting, onEnded]);

  useEffect(() => {
    if (!meeting) return;

    const handleRoomLeft = ({ state }: { state: string }) => {
      if (['left', 'ended', 'kicked'].includes(state) && !endingRef.current) {
        void endCall();
      }
    };

    meeting.self.on('roomLeft', handleRoomLeft);

    return () => {
      meeting.self.off('roomLeft', handleRoomLeft);

      void meeting.leave();
    };
  }, [meeting, endCall]);

  if (loading) {
    return (
      <div className="space-y-4 rounded-xl bg-white p-8">
        <h2 className="text-xl font-semibold">Connecting to consultation</h2>

        <p className="text-slate-500">Preparing your audio/video connection...</p>

        <Button variant="outline" onClick={onExit}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (initError || !meeting) {
    return (
      <div className="mx-auto max-w-lg space-y-5 rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="text-4xl">⚠️</div>

        <h2 className="text-2xl font-semibold">Unable to Join Consultation</h2>

        <p role="alert" className="text-sm text-red-600">
          {initError || 'Meeting initialization failed'}
        </p>

        <p className="text-sm text-slate-500">
          Your consultation could not be connected. You can retry or return to your dashboard.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={onRetry}>Retry Connection</Button>

          <Button variant="outline" onClick={onExit}>
            Return to Dashboard
          </Button>

          <Button variant="destructive" disabled={ending} onClick={() => void endCall()}>
            {ending ? 'Ending...' : 'End Call'}
          </Button>
        </div>

        {actionError && (
          <p role="alert" className="text-sm text-red-600">
            {actionError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-[550px] overflow-hidden rounded-xl border bg-slate-950">
        <RealtimeKitProvider value={meeting}>
          <RtkMeeting meeting={meeting} mode="fill" showSetupScreen={true} />
        </RealtimeKitProvider>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={onExit}>
          Return to Dashboard
        </Button>

        <Button variant="destructive" disabled={ending} onClick={() => void endCall()}>
          {ending ? 'Ending...' : 'End Consultation'}
        </Button>
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-red-600">
          {actionError}
        </p>
      )}
    </div>
  );
}
