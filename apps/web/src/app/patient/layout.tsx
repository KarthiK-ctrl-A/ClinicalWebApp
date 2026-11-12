'use client';

import {
  ReactNode,
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { clinicApi } from '@/lib/api/clinic-api';

import { createClient } from '@/lib/supabase/client';

import { CurrentUser } from '@/types/clinic';

import { IncomingCallCenter } from '@/features/calls/components/incoming-call-center';

import Link from 'next/link';

export default function PatientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [patient, setPatient] =
    useState<CurrentUser | null>(null);

  useEffect(() => {
    let active = true;

    async function verifyPatient() {
      try {
        const user = await clinicApi<CurrentUser>(
          '/api/v1/me',
        );

        if (user.role !== 'patient') {
          router.replace('/login');
          return;
        }

        if (active) {
          setPatient(user);
        }
      } catch {
        router.replace('/login');
      }
    }

    void verifyPatient();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert('Unable to sign out');
      return;
    }

    setPatient(null);

    window.location.replace('/login');
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading patient portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-5">
          <div>
            <h1 className="text-xl font-semibold">
              Patient Portal
            </h1>

            <p className="text-sm text-slate-500">
              Welcome, {patient.fullName}
            </p>
          </div>

          <nav className="flex items-center gap-5">
              <Link
                href="/patient"
                className="text-sm font-medium hover:text-blue-600"
              >
                Dashboard
              </Link>

              <Link
                href="/patient/messages"
                className="text-sm font-medium hover:text-blue-600"
              >
                Messages
              </Link>
            </nav>

          <Button
            variant="outline"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {children}
      </main>

      <IncomingCallCenter key={patient.id} />
    </div>
  );
}