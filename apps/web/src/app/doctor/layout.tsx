'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { createClient } from '@/lib/supabase/client';
import { clinicApi } from '@/lib/api/clinic-api';

import { CurrentUser } from '@/types/clinic';

export default function DoctorLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [doctor, setDoctor] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let active = true;

    async function verifyDoctor() {
      try {
        const user = await clinicApi<CurrentUser>('/api/v1/me');

        if (user.role !== 'doctor') {
          router.replace('/login');
          return;
        }

        if (active) {
          setDoctor(user);
        }
      } catch {
        router.replace('/login');
      }
    }

    void verifyDoctor();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setDoctor(null);
      window.location.replace('/login');
    } catch {
      alert('Sign out failed. Please try again.');
    }
  }

  if (!doctor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading doctor portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/doctor/patients" className="text-xl font-semibold">
            Clinic Management
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{doctor.fullName}</span>

            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        <div key={doctor.id}>{children}</div>
      </main>
    </div>
  );
}
