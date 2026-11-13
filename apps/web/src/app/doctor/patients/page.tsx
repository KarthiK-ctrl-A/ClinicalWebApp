'use client';

import { getErrorMessage } from '@/lib/error-message';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { clinicApi } from '@/lib/api/clinic-api';

import { PaginatedResponse, PatientSummary } from '@/types/clinic';

const PAGE_SIZE = 20;

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
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

    if (!doctorId) {
      return;
    }

    async function loadPatients() {
      try {
        const response = await clinicApi<PaginatedResponse<PatientSummary>>(
          `/api/v1/patients?page=${page}&pageSize=${PAGE_SIZE}`,
        );

        if (active) {
          setPatients(response.data);
          setTotal(response.pagination.total);
          setPatientsOwnerId(doctorId);
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err, 'Unable to load patients'));
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
  }, [doctorId, page]);

  const filteredPatients = useMemo(() => {
    if (patientsOwnerId !== doctorId) {
      return [];
    }

    const value = search.trim().toLowerCase();
    return patients.filter((patient) => patient.fullName.toLowerCase().includes(value));
  }, [patients, patientsOwnerId, doctorId, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function changePage(nextPage: number) {
    setSearch('');
    setError('');
    setLoading(true);
    setPage(nextPage);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">My Patients</h1>

        <p className="text-slate-500">View and manage your assigned patients.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Patients ({total})</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            placeholder="Search this page by name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
                    <tr key={patient.id} className="border-b">
                      <td className="p-3 font-medium">{patient.fullName}</td>

                      <td className="p-3">{patient.gender ?? '—'}</td>

                      <td className="p-3">{patient.dateOfBirth ?? '—'}</td>

                      <td className="p-3">{patient.phone ?? '—'}</td>

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
                <p className="py-6 text-center text-slate-500">No patients found.</p>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <Button
                variant="outline"
                disabled={loading || page === 1}
                onClick={() => changePage(page - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={loading || page >= totalPages}
                onClick={() => changePage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
