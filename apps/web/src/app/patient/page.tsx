'use client';

import { getErrorMessage } from '@/lib/error-message';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { CalendarDays, MessageSquare, Stethoscope, Video } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { clinicApi } from '@/lib/api/clinic-api';

interface PatientDashboard {
  patient: {
    id: string;
    fullName: string;
  };

  assignedDoctor: {
    id: string;
    fullName: string;
    specialty: string | null;
  };

  nextConsultation: {
    id: string;
    scheduledAt: string;
    mode: 'audio' | 'video';
    status: string;
  } | null;
}

export default function PatientDashboardPage() {
  const [dashboard, setDashboard] = useState<PatientDashboard | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const result = await clinicApi<PatientDashboard>('/api/v1/patients/me/dashboard');

        if (active) {
          setDashboard(result);
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err, 'Unable to load dashboard'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="p-8">Loading your dashboard...</div>;
  }

  if (error || !dashboard) {
    return (
      <div className="space-y-4 rounded-xl border bg-white p-8">
        <h2 className="text-xl font-semibold">Dashboard Unavailable</h2>

        <p role="alert" className="text-red-600">
          {error || 'Unable to retrieve dashboard'}
        </p>

        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const { patient, assignedDoctor, nextConsultation } = dashboard;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {patient.fullName}</h1>

        <p className="mt-2 text-slate-500">
          Manage your care, upcoming consultations, and messages.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              My Doctor
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div>
              <h3 className="text-xl font-semibold">{assignedDoctor.fullName}</h3>

              <p className="text-slate-500">
                {assignedDoctor.specialty ?? 'Specialty not specified'}
              </p>
            </div>

            <Button render={<Link href="/patient/messages" />}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Doctor
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              Next Consultation
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {nextConsultation && (
              <>
                <p className="text-lg font-semibold">
                  {new Date(nextConsultation.scheduledAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>

                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Video className="h-4 w-4" />
                  {nextConsultation.mode === 'video' ? 'Video Consultation' : 'Audio Consultation'}
                </p>

                <p className="text-sm text-green-600">{nextConsultation.status}</p>
              </>
            )}

            {!nextConsultation && (
              <>
                <p className="font-medium">No consultation scheduled</p>

                <p className="text-sm text-slate-500">
                  Your upcoming consultation will appear here when scheduled.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <Link
            href="/patient/messages"
            className="flex items-center gap-3 rounded-lg border p-5 hover:bg-slate-50"
          >
            <MessageSquare className="h-6 w-6 text-blue-600" />

            <div>
              <h3 className="font-semibold">My Messages</h3>

              <p className="text-sm text-slate-500">View and reply to your doctor.</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 rounded-lg border p-5">
            <Video className="h-6 w-6 text-blue-600" />

            <div>
              <h3 className="font-semibold">Consultations</h3>

              <p className="text-sm text-slate-500">
                Incoming calls will appear here when your doctor calls.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
