'use client';

import { useEffect, useState } from 'react';

import { Pill, CalendarDays } from 'lucide-react';

import { clinicApi } from '@/lib/api/clinic-api';

interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  instructions: string | null;
  status: string;
  prescribedAt: string;
}

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] =
    useState<Prescription[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPrescriptions() {
      try {
        const data = await clinicApi<Prescription[]>(
          '/api/v1/prescriptions/me',
        );

        if (active) {
          setPrescriptions(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load prescriptions',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPrescriptions();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        Loading prescriptions...
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg bg-red-50 p-6 text-red-600"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          My Prescriptions
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View medications prescribed by your doctor.
        </p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <Pill className="mx-auto mb-3 h-10 w-10 text-slate-400" />

          <h2 className="font-semibold">
            No Prescriptions Available
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Your doctor has not added any prescriptions yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">

          {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >

              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <Pill className="h-5 w-5 text-blue-600" />
                  </div>

                  <h2 className="text-lg font-semibold">
                    {prescription.medicationName}
                  </h2>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-700">
                  {prescription.status}
                </span>
              </div>

              <div className="space-y-3 text-sm">

                <div>
                  <span className="font-medium">Dosage:</span>{' '}
                  {prescription.dosage}
                </div>

                <div>
                  <span className="font-medium">Frequency:</span>{' '}
                  {prescription.frequency}
                </div>

                <div>
                  <span className="font-medium">Duration:</span>{' '}
                  {prescription.durationDays != null
                    ? `${prescription.durationDays} days`
                    : 'Not specified'}
                </div>

                {prescription.instructions && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="font-medium text-blue-800">
                      Doctor Instructions
                    </p>

                    <p className="mt-1 text-blue-700">
                      {prescription.instructions}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 border-t pt-3 text-slate-500">
                  <CalendarDays className="h-4 w-4" />

                  Prescribed on{' '}
                  {new Date(
                    prescription.prescribedAt,
                  ).toLocaleDateString()}
                </div>

              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}