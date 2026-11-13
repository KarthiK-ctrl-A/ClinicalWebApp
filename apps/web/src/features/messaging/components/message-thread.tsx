'use client';

import { getErrorMessage } from '@/lib/error-message';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { Send } from 'lucide-react';

import type { RealtimeChannel } from '@supabase/supabase-js';

import { Button } from '@/components/ui/button';

import { clinicApi } from '@/lib/api/clinic-api';

import { createClient } from '@/lib/supabase/client';

import { CurrentUser } from '@/types/clinic';

import { Conversation, Message, MessageThreadProps } from '../types/message';

function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const messages = new Map<string, Message>();

  for (const message of [...current, ...incoming]) {
    messages.set(message.id, message);
  }

  return Array.from(messages.values()).sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}

export function MessageThread({ mode, patientId }: MessageThreadProps) {
  const supabase = useMemo(() => createClient(), []);

  let endpoint = '/api/v1/messages/me';
  if (mode === 'doctor' && patientId) {
    endpoint = `/api/v1/messages/patients/${patientId}`;
  }

  const [user, setUser] = useState<CurrentUser | null>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [draft, setDraft] = useState('');

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState('');

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;

    let channel: RealtimeChannel | null = null;

    let unsubscribeAuth: (() => void) | null = null;

    async function initialize() {
      try {
        if (mode === 'doctor' && !patientId) {
          throw new Error('Patient ID is required');
        }

        const [currentUser, result] = await Promise.all([
          clinicApi<CurrentUser>('/api/v1/me'),
          clinicApi<Conversation>(endpoint),
        ]);

        if (!active) {
          return;
        }

        if (currentUser.role !== mode) {
          throw new Error('Invalid portal role');
        }

        setUser(currentUser);
        setConversation(result);
        setMessages(result.messages);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Authentication session expired');
        }

        await supabase.realtime.setAuth(session.access_token);

        if (!active) {
          return;
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
          if (!active) {
            return;
          }

          if (!updatedSession || updatedSession.user.id !== currentUser.id) {
            setMessages([]);
            setConversation(null);

            window.location.replace('/login');
            return;
          }

          void supabase.realtime.setAuth(updatedSession.access_token);
        });

        unsubscribeAuth = () => subscription.unsubscribe();

        channel = supabase
          .channel(`messages:${currentUser.id}:${result.patientId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `patient_id=eq.${result.patientId}`,
            },
            (payload) => {
              if (!active) {
                return;
              }

              const record = payload.new;

              if (
                typeof record.id !== 'string' ||
                typeof record.patient_id !== 'string' ||
                typeof record.doctor_id !== 'string' ||
                typeof record.sender_id !== 'string' ||
                typeof record.content !== 'string' ||
                typeof record.created_at !== 'string'
              ) {
                return;
              }

              const message: Message = {
                id: record.id,
                patientId: record.patient_id,
                doctorId: record.doctor_id,
                senderId: record.sender_id,
                content: record.content,
                createdAt: record.created_at,
              };

              setMessages((current) => mergeMessages(current, [message]));
            },
          )
          .subscribe((status) => {
            if (!active) {
              return;
            }

            if (status === 'SUBSCRIBED') {
              setConnected(true);
              setError('');

              // Fetch again after subscribing to avoid
              // missing messages inserted during setup.
              void clinicApi<Conversation>(endpoint)
                .then((latest) => {
                  if (active) {
                    setMessages((current) => mergeMessages(current, latest.messages));
                  }
                })
                .catch(() => {
                  if (active) {
                    setError('Unable to synchronize recent messages');
                  }
                });
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              setConnected(false);
            }
          });
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err, 'Unable to load conversation'));
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

      unsubscribeAuth?.();

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [endpoint, mode, patientId, supabase]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();

    if (!content || !conversation || sending) {
      return;
    }

    setSending(true);
    setError('');

    try {
      const message = await clinicApi<Message>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });

      setMessages((current) => mergeMessages(current, [message]));

      setDraft('');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to send message'));
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <p>Loading conversation...</p>;
  }

  if (!user || !conversation) {
    return (
      <p role="alert" className="text-red-600">
        {error || 'Conversation unavailable'}
      </p>
    );
  }

  let connectionClass = 'text-amber-600';
  let connectionLabel = 'Reconnecting';
  if (connected) {
    connectionClass = 'text-green-600';
    connectionLabel = 'Live';
  }

  return (
    <div className="flex h-[550px] flex-col overflow-hidden rounded-lg border bg-white">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold">Messages</h2>

          <p className="text-xs text-slate-500">Secure doctor-patient conversation</p>
        </div>

        <span className={`text-xs ${connectionClass}`}>{connectionLabel}</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-500">
            No messages yet. Start the conversation.
          </p>
        )}

        {messages.map((message) => {
          const isMine = message.senderId === user.id;
          let alignment = 'justify-start';
          let bubbleClass = 'border bg-white text-slate-800';
          let timeClass = 'text-slate-400';

          if (isMine) {
            alignment = 'justify-end';
            bubbleClass = 'bg-blue-600 text-white';
            timeClass = 'text-blue-100';
          }

          return (
            <div key={message.id} className={`flex ${alignment}`}>
              <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${bubbleClass}`}>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>

                <p className={`mt-2 text-right text-xs ${timeClass}`}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="border-t px-5 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={sendMessage} className="flex gap-3 border-t p-4">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type your message..."
          maxLength={2000}
          className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />

        <Button type="submit" disabled={!draft.trim() || sending}>
          <Send className="mr-2 h-4 w-4" />

          {sending ? 'Sending' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
