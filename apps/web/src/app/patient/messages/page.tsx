'use client';

import { MessageThread } from '@/features/messaging/components/message-thread';

export default function PatientMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          My Messages
        </h1>

        <p className="text-sm text-slate-500">
          Communicate with your assigned doctor.
        </p>
      </div>

      <MessageThread
        key="patient-conversation"
        mode="patient"
      />
    </div>
  );
}