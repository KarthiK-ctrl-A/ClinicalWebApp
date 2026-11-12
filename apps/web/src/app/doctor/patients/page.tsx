'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { clinicApi } from '@/lib/api/clinic-api';

import {
  PaginatedResponse,
  PatientSummary,
} from '@/types/clinic';

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>(
    [],
  );

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = useMemo(() => createClient(), []);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [patientsOwnerId, setPatientsOwnerId] = useState<string | null>(null);

  useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setDoctorId(session?.user.id ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
}, [supabase]);

  useEffect(() => {
    let active = true;

    setPatients([]);
    setPatientsOwnerId(null);
    setError('');
    setSearch('');

    if (!doctorId) {
    setLoading(false);

    return () => {
      active = false;
    };
  }

    async function loadPatients() {
      try {
        const response = await clinicApi<
          PaginatedResponse<PatientSummary>
        >('/api/v1/patients?page=1&pageSize=20');

        if (active) {
          setPatients(response.data);
          setPatientsOwnerId(doctorId);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load patients',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPatients();

     return () => {
    active = false;
  };
}, [doctorId]);

  const visiblePatients =
  patientsOwnerId === doctorId ? patients : [];

const filteredPatients = useMemo(() => {
  const value = search.trim().toLowerCase();

  return visiblePatients.filter((patient) =>
    patient.fullName.toLowerCase().includes(value),
  );
}, [visiblePatients, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          My Patients
        </h1>

        <p className="text-slate-500">
          View and manage your assigned patients.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Assigned Patients ({patients.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            placeholder="Search patients by name..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {loading && <p>Loading patients...</p>}

          {error && (
            <p role="alert" className="text-red-600">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-100">
                  <tr>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Gender</th>
                    <th className="p-3">Date of Birth</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-b"
                    >
                      <td className="p-3 font-medium">
                        {patient.fullName}
                      </td>

                      <td className="p-3">
                        {patient.gender ?? '—'}
                      </td>

                      <td className="p-3">
                        {patient.dateOfBirth ?? '—'}
                      </td>

                      <td className="p-3">
                        {patient.phone ?? '—'}
                      </td>

                      <td className="p-3">
                        <Button size="sm" render={<Link href={`/doctor/patients/${patient.id}`} />}>
                          View Profile
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPatients.length === 0 && (
                <p className="py-6 text-center text-slate-500">
                  No patients found.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}